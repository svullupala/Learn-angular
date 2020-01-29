import { Component, ElementRef, EventEmitter, OnInit, Input, Output, OnDestroy, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { SessionService } from 'core';
import { AccessUserModel } from '../user.model';
import { RestService } from 'core';
import { Observable } from 'rxjs/Observable';
import { SorterModel } from 'shared/models/sorter.model';
import { AccessRoleModel } from '../../roles/role.model';
import { AccessRolesModel } from '../../roles/roles.model';
import { PermissionRoleComponent } from '../../permission-groups/permission-role/permission-role.component';
import { LdapGroupModel } from 'ldapsmtp/ldapGroup.model';
import { SdlTooltipDirective } from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';
import { SharedService } from 'shared/shared.service';
import { LdapTableComponent } from './ldap-table/ldap-table.component';
import { LdapSmtpService } from 'ldapsmtp/ldap-smtp.service';
import { JsonConvert } from 'json2typescript';
import { LdapModel } from 'ldapsmtp/ldap.model';
import { LdapsModel } from 'ldapsmtp/ldaps.model';
import { DropdownComponent } from 'shared/components/dropdown/dropdown.component';
import { SearchBarModule } from 'shared/components/search-bar/search-bar.module';
import { Subject } from 'rxjs';

@Component({
  selector: 'user-edit-setting',
  templateUrl: './user-edit-setting.component.html',
  styleUrls: ['./user-edit-setting.component.scss']
})
export class UserEditSettingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() models: AccessUserModel[] = [new AccessUserModel()];
  @Input() ldapGroupList = new Array<LdapGroupModel>();
  @Input() showLdapGroupTable: boolean;
  @Input() mode: Mode = Mode.settings;
  @Input() changePasswordMode: boolean = false;
  @Input() minPasswordLength: number = undefined;
  @Output() saveSuccess = new EventEmitter<AccessUserModel>();
  @Output() cancelClick = new EventEmitter();
  @ViewChild(LdapTableComponent) selectTable: LdapTableComponent;

  public form: FormGroup;
  public name: AbstractControl;
  public ldap: AbstractControl;
  public password: AbstractControl;
  public oldPassword: AbstractControl;

  roles: Array<AccessRoleModel> = [];
  errorHandler: ErrorHandlerComponent;
  showPassword: boolean = false;
  showOldPassword: boolean = false;
  textPasswordTip: string;
  textPasswordSuggestion: string;
  textCommonUsername: string;

  private passwordValidators = [Validators.required];
  private namePattern: string = '';
  private masked: boolean = false;
  private textSearchForLdap: string;
  private textViewAll: string;
  private textRelativePathPlaceholder: string = "Relative Path";

  private relativePath: string = undefined;

  private subs: Subject<void> = new Subject<void>();

  modeType = Mode;

  selectedRoles: Array<AccessRoleModel> = [];
  @ViewChild(PermissionRoleComponent) permissionRoleComponent: PermissionRoleComponent;

  constructor(private rest: RestService, private fb: FormBuilder,
    private translate: TranslateService, private ldapService: LdapSmtpService) {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      'oldPassword': ['', Validators.compose(this.passwordValidators.concat(Validators.minLength(1)))],
      'password': ['', Validators.compose(this.passwordValidators)],
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'ldap': ['', Validators.compose([])]
    });

    if (this.minPasswordLength !== undefined) {
      this.setMinPasswordLength(this.minPasswordLength);
    }

    this.oldPassword = this.form.controls['oldPassword'];
    this.password = this.form.controls['password'];
    this.name = this.form.controls['name'];
    this.ldap = this.form.controls['ldap'];
  }

  setMinPasswordLength(value: number) {
    this.form.controls['password'].setValidators(
      Validators.compose(this.passwordValidators.concat(Validators.minLength(value))));
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  reset(): void {
    this.models = [new AccessUserModel()];
    this.form.reset();
  }

  ngOnInit(): void {
    let me = this;
    if (me.changePasswordMode) {
      me.mode = Mode.password;
    }

    me.translate.get([
      'users.textPasswordTip',
      'common.textNewPasswordErrorSuggestion',
      'common.textCommonUsername',
      'ldap-smtp.textSearchForLdap',
      'ldap-smtp.textViewAll',
      'users.textRelativePathPlaceholder'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.textPasswordTip = resource['users.textPasswordTip'];
      me.textPasswordSuggestion = resource['common.textNewPasswordErrorSuggestion'];
      me.textCommonUsername = resource['common.textCommonUsername'];
      me.textSearchForLdap = resource['ldap-smtp.textSearchForLdap'];
      me.textViewAll = resource['ldap-smtp.textViewAll']
      me.textRelativePathPlaceholder = resource['users.textRelativePathPlaceholder'];
    });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];

    if (!me.models)
      me.models = [new AccessUserModel()];
    me.loadRoles();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['minPasswordLength']) {
      me.setMinPasswordLength(changes['minPasswordLength'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  loadRoles() {
    let me = this, observable: Observable<AccessRolesModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];

    observable = AccessRolesModel.retrieve<AccessRoleModel, AccessRolesModel>(AccessRolesModel, me.rest,
      undefined, sorters, 0, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {

          me.roles = dataset.records || [];
          // NOTE: the role API does not support sort by name.
          me.roles.sort(function (a, b) {
            return a.name > b.name ? 1 : (a.name === b.name ? 0 : -1);
          });

          if (this.onlyOneUser) {
            me.initRoleSelection();
          }
        },
        err => {
          me.handleError(err, false);
        }
      );
    }
  }

  isValid(): boolean {
    let model = this.models[0], editingSuperUser = !model.phantom && model.isSuperUser(),
      baseInfoValid = model.name && model.name.length > 0 && this.passwordValid();
    if (this.onlyOneUser) {
      if (model.type === 'LDAP_GROUP')
        return (model.group !== undefined || !editingSuperUser) && this.selectedRoles && this.selectedRoles.length > 0;

      if (this.needOldPassword())
        baseInfoValid = baseInfoValid && this.oldPasswordValid();

      return editingSuperUser ? (this.passwordValid() && this.oldPasswordValid()) :
        (baseInfoValid && this.selectedRoles && this.selectedRoles.length > 0);
    } else {
      return this.selectedRoles && this.selectedRoles.length > 0;
    }
  }

  get passwordTip() {
    return SharedService.formatString(this.textPasswordTip, (this.minPasswordLength) ? this.minPasswordLength : '1');
  }

  get passwordSuggestion() {
    return SharedService.formatString(this.textPasswordSuggestion, (this.minPasswordLength) ? this.minPasswordLength : '1');
  }

  private get onlyOneUser(): boolean {
    return (this.models !== undefined) && (this.models.length === 1);
  }

  private matchRole(role: AccessRoleModel): boolean {
    let me = this, model = me.models[0];
    return (model.roles || []).findIndex(function (item) {
      return role.equals(item);
    }) !== -1;
  }

  private initRoleSelection(): void {
    let me = this;
    (me.roles || []).forEach(function (role) {
      let matched = me.matchRole(role);
      role.metadata['selected'] = matched;
      if (matched) {
        if (me.permissionRoleComponent)
          me.onRoleChange(role);
        else me.selectedRoles.push(role);
      }
    });
  }

  private onRoleChange(role: AccessRoleModel): void {
    let selected = role.metadata['selected'], idx = (this.selectedRoles || []).findIndex(function (item) {
      return item.equals(role);
    });
    if (selected && idx === -1) {
      if (this.permissionRoleComponent) {
        this.permissionRoleComponent.addRole(role);
        this.selectedRoles.push(role);
      }
    } else if (!selected && idx !== -1) {
      if (this.permissionRoleComponent) {
        this.permissionRoleComponent.removeRole(role);
        this.selectedRoles.splice(idx, 1);
      }
    }
  }

  private passwordValid(): boolean {
    let model = this.models[0], hasPasswordInput = model.password && model.password.length > 0;
    return this.password.valid || !model.phantom && !model.isSuperUser() && !hasPasswordInput;
  }

  private togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private canChangePassword(): boolean {
    let builtInAdmin = this.models[0] && this.models[0].isBuiltInAdminAccount(),
      hasLink = this.models[0] && this.models[0].hasLink('changePassword');

    // Basic RBAC: check presence of changepassword link
    // Additional logic: regular logged in admin cannot change local admin's password
    if (builtInAdmin) {
      return SessionService.getInstance().isBuiltInAdminUser() && hasLink;
    } else {
      return hasLink;
    }
  }

  private needPassword(): boolean {
    let model = this.models[0];
    return model.phantom || this.canChangePassword();
  }

  private needOldPassword(): boolean {
    let model = this.models[0], hasPasswordInput = model.password && model.password.length > 0;
    return this.canChangePassword() &&
      !model.phantom && hasPasswordInput && model.id === SessionService.getInstance().getAccountId();
  }

  private oldPasswordValid(): boolean {
    let model = this.models[0], hasPasswordInput = model.password && model.password.length > 0;
    return this.oldPassword.valid || !model.phantom && !hasPasswordInput;
  }

  private toggleOldPasswordVisibility(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  private isPassword(): boolean {
    return (this.mode === Mode.password || this.mode === Mode.settings);
  }

  private isRole(): boolean {
    return (this.mode === Mode.role || this.mode === Mode.settings);
  }

  private isSettings(): boolean {
    return this.mode === Mode.settings;
  }

  private onSelectionChange(event: any) {
    this.models[0].group = event[0];
  }

  private maskOn() {
    this.masked = true;
  }

  private maskOff() {
    this.masked = false;
  }

  private getLdapList(namePattern?: string, relativePath?: string) {
    this.ldapGroupList = [];
    this.maskOn();
    this.ldapService.getLdapEntries().takeUntil(this.subs).subscribe(
      ldaps => {
        if (ldaps.records.length > 0) {
          this.ldapService.getLdapGroups(JsonConvert.deserializeObject(ldaps.records[0], LdapModel), namePattern ? namePattern : null, relativePath ? relativePath : null)
            .takeUntil(this.subs)
            .subscribe(ldapgroups => {
              for (let v = 0; v < ldapgroups.records.length; v++) {
                this.ldapGroupList.push(JsonConvert.deserializeObject(ldapgroups.records[v], LdapGroupModel));
              }
            },
            error => {
              this.maskOff();
              this.errorHandler.handle(error);
            },
            () => {
              this.maskOff();
            }
          );
        }
      },
      err => {
        this.maskOff();
        this.errorHandler.handle(err);
      },
      () => {
        this.maskOff();
      });
  }

  private startSearch(namePattern?: string, relativePath?: string): void {
    this.namePattern = namePattern;
    if (namePattern.length === 0 || namePattern === '*') {
      this.getLdapList(null, relativePath);
    } else {
      this.getLdapList(namePattern, relativePath);
    }
  }

}

export enum Mode {
  settings,
  password,
  role
}
