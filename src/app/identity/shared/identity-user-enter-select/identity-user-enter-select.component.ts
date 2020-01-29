import {
  Component, Input, OnChanges, SimpleChanges, OnInit, EventEmitter, Output, ChangeDetectorRef
} from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormControl } from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {ErrorHandlerComponent} from 'shared/components';
import {RestService} from 'core';
import {SessionService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {IdentityUserModel} from '../identity-user.model';
import {IdentityUsersModel} from '../identity-users.model';
import {IdentityUserEnterSelectModel} from '../identity-user-enter-select.model';
import { Subject } from 'rxjs/Subject';
import { IdentitiesService } from '../../../accounts/identities/identities.service';
import { IdentityModel } from '../../../accounts/identities/identity.model';
import { JsonConvert } from 'json2typescript';
import {SdlTooltipDirective} from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';

@Component({
  selector: 'identity-user-enter-select',
  styleUrls: ['./identity-user-enter-select.component.scss'],
  templateUrl: './identity-user-enter-select.component.html',
  providers: [
    // RestService - NOTE: Use the RestService provider in Pages module.
    IdentitiesService
  ]
})
export class IdentityUserEnterSelectComponent implements OnInit, OnChanges {

  @Output() createdUserEvent: EventEmitter<IdentityModel> = new EventEmitter<IdentityModel>();
  @Output() loadedUserEvent: EventEmitter<any> = new EventEmitter<any>();
  @Input() enableNameField: boolean = false;
  @Input() enterOnly: boolean = false;
  @Input() noPlaceholder: boolean = false;
  @Input() showHidePassword: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: string;
  @Input() textUsername: string;
  @Input() textPassword: string;
  @Input() model: IdentityUserEnterSelectModel;
  @Input() clsOfLabelCol: string;
  @Input() clsOfFieldCol: string;
  @Input() applicationType: string;
  isLoading: boolean = false;

  private form: FormGroup;
  private username: AbstractControl;
  private password: AbstractControl;
  private name: AbstractControl;
  private errorHandler: ErrorHandlerComponent;
  private records: Array<IdentityUserModel>;
  private subs: Subject<void> = new Subject<void>();
  private textUserDisplayNameTpl: string;
  private showPassword: boolean = false;

  constructor(private restService: RestService,
              private identityService: IdentitiesService,
              private changeDef: ChangeDetectorRef,
              private translate: TranslateService, fb: FormBuilder) {
    this.form = fb.group({
      'username': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'password': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.username = this.form.controls['username'];
    this.password = this.form.controls['password'];
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['model']) {
      me.fixUserHref();
    }
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    if (!me.model)
      me.model = new IdentityUserEnterSelectModel();

    if (this.enableNameField) {
      this.form.addControl('name', new FormControl('name'));
      this.name = this.form.controls['name'];
      this.name.setValidators([Validators.required, Validators.minLength(1)]);
    }
    me.translate.get([
      'identity.textUserDisplayNameTpl']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textUserDisplayNameTpl = resource['identity.textUserDisplayNameTpl'];
      });
    if (!me.enterOnly)
      me.loadUsers();
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  /**
   * Loads all users, if the type property is set, loads users with a type filter.
   */
  loadUsers(): void {
    let me = this, observable: Observable<IdentityUsersModel>,
      filter = me.type ? [new FilterModel('type', me.type)] : undefined,
      sorters = [
        new SorterModel('name', 'ASC')
      ];
    me.isLoading = true;
    observable = IdentityUsersModel.retrieve<IdentityUserModel, IdentityUsersModel>(IdentityUsersModel, me.restService,
      filter, sorters, 0, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.records = dataset.records;
          me.fixUserHref();
          me.isLoading = false;
          me.loadedUserEvent.emit();
        },
        err => {
          me.isLoading = false;
          me.handleError(err);
        }
      );
    }
  }

  createUser(): void {
    let me = this, observable: Observable<any>,
        identityModel: IdentityModel = new IdentityModel();

    if (!me.model.useExisting) {
      identityModel.name = me.model.name || me.model.username;
      identityModel.username = me.model.username;
      identityModel.password = me.model.password;
      observable = me.identityService.create(identityModel);
    }
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        user => {
         let createdUser: IdentityModel = JsonConvert.deserializeObject(user, IdentityModel);
         me.createdUserEvent.emit(createdUser);
         me.reset();
         me.loadUsers();
        },
        err => me.handleError(err)
      );
    }
  }

  reset(): void {
    this.username.reset();
    this.password.reset();
    if (this.name) {
      this.name.reset();
    }
    this.model.reset();
    this.changeDef.detectChanges();
  }

  /**
   * Returns the model indicates the user's setting.
   * @returns {IdentityUserEnterSelectModel}
   */
  getValue(): IdentityUserEnterSelectModel {
    return this.model;
  }

  getUser(href: string): IdentityUserModel {
    if (this.records && this.records.length > 0) {
      return this.records.find((user: IdentityUserModel) => {
        return user.identity(href);
      });
    }
  }

  /**
   * Returns true if the setting is valid.
   * @returns {IdentityUserEnterSelectModel}
   */
  isValid(): boolean {
    let me = this, model = me.model;
    if (me.enableNameField) {
      return model && (model.useExisting && model.userHref && model.userHref.length > 0 ||
        !model.useExisting && model.username && model.username.length > 0 && model.password && model.password.length > 0
        && model.name && model.name.length > 0);
    }
    return model && (model.useExisting && model.userHref && model.userHref.length > 0 ||
      !model.useExisting && model.username && model.username.length > 0 && model.password && model.password.length > 0);
  }

  setValue(user: IdentityUserEnterSelectModel): void {
    this.model = user;
    this.fixUserHref();
  }

  private onSelectUser(): void {
    this.model.userHref = this.model.user.getId();
  }

  private userDisplayName(item: IdentityUserModel): string {
    // return item.type ? SharedService.formatString(this.textUserDisplayNameTpl, item.name, item.type) : item.name;
    // [RS] Do not show "type" for SPP 3.0
    return item.name;
  }

  private fixUserHref(): void {
    let me = this, target, model = me.model;
    if (model && model.userHref && model.userHref.length > 0) {
      target = (me.records || []).find(function(item) {
        return item.getId() !== model.userHref && item.identity(model.userHref);
      });
      if (target) {
        model.userHref = target.getId();
      }
    }
  }

  private disableToolTip(control: FormControl): boolean {
    return (control.valid && control.touched) ? true : (!(!control.valid && control.touched));
  }

  private togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}


