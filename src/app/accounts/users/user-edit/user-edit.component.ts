import { Component, ElementRef, EventEmitter, OnInit, OnDestroy, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { AlertComponent } from 'shared/components/msgbox/alert.component';
import { SessionService } from 'core';
import { AccessUserModel, AccessUserPermissionModel } from '../user.model';
import { RestService } from 'core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AccessUsersModel } from '../users.model';
import { LinkModel } from 'shared/models/link.model';
import { UserEditSettingComponent, Mode } from '../user-edit-setting/user-edit-setting.component';
import { AccessRoleModel } from '../../roles/role.model';
import { UserEditResourceComponent } from '../user-edit-resource/user-edit-resource.component';
import { ResourceGroupModel } from '../../resource-groups/resource-group.model';
import { LdapModel } from 'ldapsmtp/ldap.model';
import { JsonConvert } from 'json2typescript/index';
import { LdapGroupModel } from 'ldapsmtp/ldapGroup.model';
import { LdapSmtpService } from 'ldapsmtp/ldap-smtp.service';
import { ErrorModel } from 'shared/models/error.model';
import { SharedService } from 'shared/shared.service';


@Component({
  selector: 'user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  providers: [LdapSmtpService]
})
export class UserEditComponent implements OnInit, OnDestroy {

  private static TOTAL_STEPS = 2;
  private settingsModeType = Mode;
  private maskCount: number = 0;
  private subs: Subject<void> = new Subject<void>();

  @Input() createLink: LinkModel;
  @Input() mode: Mode;
  @Input() models: AccessUserModel[] = [new AccessUserModel()];
  @Input() minPasswordLength: number = undefined;
  @Output() saveSuccess = new EventEmitter<AccessUserModel>();
  @Output() cancelClick = new EventEmitter();

  public form: FormGroup;
  public name: AbstractControl;
  public method: AbstractControl;


  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  @ViewChild(UserEditSettingComponent) setting: UserEditSettingComponent;
  @ViewChild(UserEditResourceComponent) resource: UserEditResourceComponent;


  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private textErrorTitle: string;
  private textAddUser: string;
  private textUpdateUser: string;
  private textFailedToAssignRoleToUserTpl: string;

  private masked: boolean = false;
  private step: number = 0;
  private selectedRoles: Array<AccessRoleModel> = [];
  private oldPermissions: AccessUserPermissionModel[];
  private ldapGroupList: Array<LdapGroupModel> = new Array<LdapGroupModel>();
  private showLdapGroupTable: boolean = false;

  get editMode(): boolean {
    return (!this.onlyOneUser) || this.models[0] && !this.models[0].phantom;
  }

  get stepTitle(): string {
    if (this.editMode) {
      if (this.step === 1)
        return 'users.textModifySettingsTitle';
      else if (this.step === 2)
        return 'users.textModifyResourcesTitle';
    } else {
      if (this.step === 1)
        return 'users.textAddUsersInfoAndRole';
      else if (this.step === 2)
        return 'users.textAddUsersAssignResources';
      else
        return 'users.textAddUsersSimple';
    }
  }

  constructor(private rest: RestService, fb: FormBuilder,
    private translate: TranslateService, private ldapService: LdapSmtpService) {

    this.form = fb.group({
      'method': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.method = this.form.controls['method'];
    this.name = this.form.controls['name'];
  }


  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  private _handleError(err: any, silence?: boolean): ErrorModel {
    let me = this;
    if (err && me.errorHandler) {
      return me.errorHandler.handle(err, false, silence);
    }
    return null;
  }

  private _handleResult(result: { model: AccessUserModel, error?: ErrorModel }[]): void {
    let me = this, error = me._oneError(result);
    if (error) {
      me._handleError(error, false);
    } else {
      me.info(me.textEditSucceed);
      me.saveSuccess.emit();
    }
  }

  reset(): void {
    this.models = [new AccessUserModel()];
    this.form.reset();
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'users.textCreationSuccessful',
      'users.textEditSuccessful',
      'common.errorTitle',
      'users.textAddUsersSimple',
      'users.textUpdateUser',
      'users.textFailedToAssignRoleToUserTpl'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['users.textCreationSuccessful'];
        me.textEditSucceed = resource['users.textEditSuccessful'];
        me.textErrorTitle = resource['common.errorTitle'];
        me.textUpdateUser = resource['users.textUpdateUser'];
        me.textAddUser = resource['users.textAddUsersSimple'];
        me.textFailedToAssignRoleToUserTpl = resource['users.textFailedToAssignRoleToUserTpl'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    if (!me.models) {
      me.models = [new AccessUserModel()];
      me.models[0].type = ''; // Force the user to select type.
      me.step = 0;
    } else {
      me.step = 1;
    }
  }

  onCancelClick() {
    this.cancelClick.emit();
  }

  onPrevClick() {
    this.step--;
  }

  onNextClick() {
    if (this.step === 1 && this.setting)
      this.selectedRoles = this.setting.selectedRoles;
    this.step++;
  }

  onSubmitClick() {
    if (this.onlyOneUser) {
      this._submitSingleUser();
    } else {
      this._submitMultiUser();
    }
  }

  private _submitMultiUser() {
    let me = this, result: { model: AccessUserModel, error?: ErrorModel }[] = [];
    (me.models || []).forEach((model) => {
      this._submitUser(model, result);
    });
  }

  private _submitUser(model: AccessUserModel, result: { model: AccessUserModel, error?: ErrorModel }[]): void {
    let me = this;
    me._maskOn();
    me.stageMore(model);
    model.update(AccessUserModel, me.rest).takeUntil(me.subs).subscribe(record => {
      result.push({ model: model });
      if (me._maskOff()) {
        me._handleResult(result);
      }
    },
      err => {
        me.unstageMore(model);
        result.push({ model: model, error: me._handleError(err, true) });
        if (me._maskOff()) {
          me._handleResult(result);
        }
      });
  }

  private _submitSingleUser() {
    let me = this, model = this.models[0], editingSuperUser = me.editMode && model.isSuperUser(),
      observable: Observable<AccessUserModel>;
    if (model.phantom) {
      me._maskOn();
      me.stageMore();
      observable = AccessUsersModel.create(AccessUserModel, model, me.createLink, me.rest);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me._maskOff();
            me.info(me.textCreateSucceed);
            me.saveSuccess.emit(record);
            me.reset();
          },
          err => {
            me._maskOff();
            me.unstageMore();
            me._handleError(err);
          }
        );
      } else {
        me._maskOff();
        me.unstageMore();
      }
    } else if (!editingSuperUser) {
      me._maskOn();
      me.stageMore();
      observable = model.update(AccessUserModel, me.rest);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me._maskOff();
            if (me.needToUpdatePassword())
              me.doChangePasswordAction(model, me.textEditSucceed, record);
            else {
              me.info(me.textEditSucceed);
              me.reset();
              me.saveSuccess.emit(record);
            }
          },
          err => {
            me._maskOff();
            me.unstageMore();
            me._handleError(err);
          }
        );
      } else if (this.mode === this.settingsModeType.password) {
        if (me.needToUpdatePassword())
          me.doChangePasswordAction(model, me.textEditSucceed);
      } else {
        me._maskOff();
        me.unstageMore();
      }
    } else { // Editing Super User.
      me.doChangePasswordAction(model, me.textEditSucceed);
    }
  }

  getSelectedRoles(): AccessRoleModel[] {
    return this.setting ? this.setting.selectedRoles : [];
  }

  getSelectedResources(): ResourceGroupModel[] {
    return this.resource ? this.resource.selectedResourceGroups : [];
  }

  private get onlyOneUser(): boolean {
    return (this.models !== undefined) && (this.models.length === 1);
  }

  private needToUpdatePassword(): boolean {
    let me = this, model = me.models[0];
    return !model.phantom && model.password && model.password.length > 0;
  }

  private doChangePasswordAction(item: AccessUserModel, msg: string, record?: AccessUserModel): void {
    let me = this, payload = item.getChangePasswordJson(), observable: Observable<AccessUserModel>;
    me._maskOn();
    observable = item.doAction<AccessUserModel>(AccessUserModel, 'changePassword', payload);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        updated => {
          me.info(msg);
          me.reset();
          me.saveSuccess.emit(record || updated);
        },
        err => {
          me._maskOff();
          me._handleError(err);
        }
      );
    } else {
      me._maskOff();
    }
  }

  private stageMore(user?: AccessUserModel): void {
    let me = this, roles = me.getSelectedRoles(), resouces = (user) ? user.resources : me.getSelectedResources(),
      permissions = [], model = (user) ? user : me.models[0];
    model.metadata['oldPermissions'] = model.permissions;

    model.permissions = model.permissions || [];

    resouces.forEach(function (resource) {
      let permission = new AccessUserPermissionModel();
      permission.resourcePool = resource;
      permission.roles = roles;
      permissions.push(permission);
    });

    model.permissions = permissions;
  }

  private unstageMore(user?: AccessUserModel): void {
    let me = this, model = (user) ? user : me.models[0];
    model.permissions = model.metadata['oldPermissions'];
  }


  private userRoleValid(): boolean {
    return this.setting && this.setting.isValid();
  }

  private resourceValid(): boolean {
    let editingSuperUser = this.editMode && this.models[0].isSuperUser();
    return editingSuperUser ? true : this.resource && this.resource.isValid();
  }

  private hasPrev(): boolean {
    return this.onlyOneUser && this.step >= 2;
  }

  private hasNext(): boolean {
    let editingSuperUser = this.editMode && this.models[0].isSuperUser();
    return this.onlyOneUser && !editingSuperUser && this.step > 0 && this.step < UserEditComponent.TOTAL_STEPS && this.mode !== this.settingsModeType.password;
  }

  private prevValid(): boolean {
    return true;
  }

  private hasSubmit(): boolean {
    let editingSuperUser = this.onlyOneUser && this.editMode && this.models[0].isSuperUser();
    return !this.onlyOneUser || editingSuperUser || this.isValid() || this.step === UserEditComponent.TOTAL_STEPS || this.mode === this.settingsModeType.password;
  }

  private nextValid(): boolean {
    let me = this, result = false;
    switch (me.step) {
      case 1:
        result = me.userRoleValid();
        break;
      default:
        break;
    }
    return result;
  }

  private isValid(): boolean {
    return (this.userRoleValid() && (this.resourceValid() || !this.onlyOneUser)) || (this.mode === this.settingsModeType.password && this.needToUpdatePassword());
  }

  private onTypeChange(value): void {
    if (value.target.value === 'LDAP_GROUP') {
      this.showLdapGroupTable = true;
    }
    else if (value.target.value === 'NATIVE_USER') {
      this.showLdapGroupTable = false;
    }
    if (this.step === 0 && this.models[0].hasType)
      this.step++;
    if (this.models[0].type !== 'LDAP_GROUP') {
      this.ldapGroupList = [];
      this.models[0].group = undefined;
    }
  }

  private mask() {
    this.masked = true;
  }

  private unmask() {
    this.masked = false;
  }

  private _maskOn() {
    this.maskCount++;
    if (this.maskCount > 0) {
      this.mask();
    }
  }

  private _maskOff(): boolean {
    this.maskCount--;
    if (this.maskCount <= 0) {
      this.maskCount = 0;
      this.unmask();
      return true;
    }
    return false;
  }

  private _oneError(errs: { model: AccessUserModel, error?: ErrorModel }[]): ErrorModel {
    let me = this, msg = [];
    errs.forEach(function (item) {
      if (item.error)
        msg.push(SharedService.formatString(me.textFailedToAssignRoleToUserTpl, item.model.name,
          item.error.message));
    });
    return msg.length > 0 ? new ErrorModel((me.editMode) ? me.textUpdateUser : me.textAddUser, msg.join('\n')) : null;
  }

}
