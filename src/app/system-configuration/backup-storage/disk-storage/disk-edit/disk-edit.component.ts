import {Component, OnInit, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {FormGroup, AbstractControl, FormBuilder, Validators, FormControl} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {ErrorModel} from 'shared/models/error.model';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {StorageModel} from '../shared/storage.model';
import {SharedService} from 'shared/shared.service';
import {StorageManageService} from '../shared/storage-manage.service';
import {SiteService} from 'site/site.service';
import {SiteModel} from 'site/site.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {IdentityUserModel} from 'identity/shared/identity-user.model';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {IdentityUserEnterSelectComponent}
  from 'identity/shared/identity-user-enter-select/identity-user-enter-select.component';

@Component({
  selector: 'disk-edit',
  templateUrl: './disk-edit.component.html',
  providers: [SiteService]
})

export class DiskEditComponent implements OnInit {
  @Input() siteDropdownData: Array<SiteModel>;
  @Input() siteMap = [];
  canCreate: boolean = false;
  @Input() clsOfLabelCol: string;
  @Input() clsOfFieldCol: string;


  @Input() storageFilter: Array<String>;
  @Output() cancelClick = new EventEmitter();
  @Output() saveClick = new EventEmitter();
  @ViewChild(IdentityUserEnterSelectComponent) userEsRef: IdentityUserEnterSelectComponent;

  public form: FormGroup;
  public hostAddress: AbstractControl;
  public site: AbstractControl;
  public portNumber: AbstractControl;
  public type: AbstractControl;
  public sslConnection: boolean = true;


  public error: ErrorModel = null;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  model: StorageModel;
  private infoTitle: string;
  private errorTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private registrationUpdatedMsg: string;
  private textUseSSL: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private textChangeSite: string;

  private userType: string = IdentityUserModel.TYPE_SYSTEM;
  private userInfo: IdentityUserEnterSelectModel;
  private oldSite: string;

  private maskEditor: boolean = false;

  constructor(private storageManageService: StorageManageService, fb: FormBuilder,
              private translateService: TranslateService, private siteService: SiteService) {

    this.form = fb.group({
      'hostAddress': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'site': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'type': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'portNumber': ['', Validators.compose([Validators.minLength(0)])]
    });
    this.hostAddress = this.form.controls['hostAddress'];
    this.site = this.form.controls['site'];
    this.portNumber = this.form.controls['portNumber'];
    this.type = this.form.controls['type'];
    let paginationId: string = `storage-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  ngOnInit(){
    let me = this, endpoint = me.storageManageService.getNodeServiceEndpoint();
    me.translateService.get('common.nodeService')
      .subscribe((res: string) => {
        me.translateService.get([
          'common.infoTitle',
          'common.errorTitle',
          'common.processingRequestMsg',
          'common.textConfirm',
          'storage.registrationSucceedMsg',
          'storage.registrationUpdatedMsg',
          'storage.confirmUnregisterMsg',
          'storage.textChangeSite',
          'storage.textUseSSL'], {service: res, endpoint: endpoint})
          .subscribe((resource: Object) => {
            me.infoTitle = resource['common.infoTitle'];
            me.errorTitle = resource['common.errorTitle'];
            me.processingRequestMsg = resource['common.processingRequestMsg'];
            me.registrationSucceedMsg = resource['storage.registrationSucceedMsg'];
            me.registrationUpdatedMsg = resource['storage.registrationUpdatedMsg'];
            me.textUseSSL = resource['storage.textUseSSL'];
            me.textConfirm = resource['common.textConfirm'];
            me.textConfirmUnregister = resource['storage.confirmUnregisterMsg'];
            me.textChangeSite = resource['storage.textChangeSite'];
          });
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new StorageModel();
    me.userInfo = new IdentityUserEnterSelectModel();
    JsonConvert.valueCheckingMode = JsonConvert.ValueCheckingMode.ALLOW_NULL;
  }

  info(errOrMsg: ErrorModel | string, title?: string) {
    let me = this;
    if (me.alert) {
      if (errOrMsg instanceof ErrorModel)
        me.alert.show(errOrMsg.title, errOrMsg.message, AlertType.ERROR);
      else
        me.alert.show(title || me.infoTitle, errOrMsg);
    }
  }

  confirm(item: StorageModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmUnregister, item.name),
        AlertType.CONFIRMATION, handler);
  }

  confirmEx(message: string, handlerOK: Function, handlerCancel: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message,
        AlertType.CONFIRMATION, handlerOK, handlerCancel);
  }

  isRegistrationFormValid(): boolean {
    let me = this, form = me.form;
    return form.valid && me.isUserInfoValid() && me.isSiteNameValid();
  }

  onAddClick() {
    let me = this;
    if (!me.model.phantom) {
      me.model = new StorageModel();
      me.setUserInfo(me.model);
    }
    if (me.storageFilter.length === 1) {
      me.model.type = me.storageFilter[0].toString();
    }
    me.model.site = '1000';

    // Remember old site for later change detection.
    me.oldSite = me.model.site;
  }

  onEditClick(item: StorageModel) {
    let me = this;
    me.model = item.copy();
    me.setUserInfo(item);

    // Remember old site for later change detection.
    me.oldSite = me.model.site;
  }

  onCancelClick(): void {
    this.reset();
    this.cancelClick.emit();
  }

  onSaveClick() {
    let me = this, newSite: boolean, userInfo: IdentityUserEnterSelectModel;

    if (me.isRegistrationFormValid()) {
      me.mask();
      me.maskEditor = true;

      newSite = me.model.site === 'new';

      // Get user info & set the username field of current model
      userInfo = me.getUserInfo();
      me.model.username = userInfo.useExisting ? userInfo.userHref : userInfo.username || undefined;
      me.model.password = !userInfo.useExisting ? userInfo.password : undefined;

      if (me.model.phantom) {
        me.storageManageService.register(me.model)
          .subscribe(
            data => {
              me.unmask();
              me.saveClick.emit(newSite);
              me.maskEditor = false;

              me.reset();
              me.info(me.registrationSucceedMsg);

              if (!userInfo.useExisting) {
                // New user may have been created so need to reload users for prepopulating & selecting later.
                me.reloadUsers();
              }
            },
            err => {
              me.maskEditor = false;
              me.unmask();
              me.handleError(err, true);
            }
          );
      } else {
        me.storageManageService.update(me.model)
          .subscribe(
            data => {
              me.unmask();
              me.maskEditor = false;
              me.info(me.registrationUpdatedMsg);
              me.saveClick.emit(newSite);

              me.reset();

              if (!userInfo.useExisting) {
                // New user may have been created so need to reload users for prepopulating & selecting later.
                me.reloadUsers();
              }
            },
            err => {
              me.maskEditor = false;
              me.unmask();
              me.handleError(err, true);
            }
          );
      }
    }
  }

  reset(): void {
    let me = this;
    me.model = new StorageModel();
    me.setUserInfo(me.model);
    me.form.reset();
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private getUserInfo(): IdentityUserEnterSelectModel {
    let me = this;
    if (me.userEsRef)
      me.userInfo = me.userEsRef.getValue();
    return me.userInfo;
  }

  private setUserInfo(item: StorageModel): void {
    let me = this;
    me.userInfo = new IdentityUserEnterSelectModel();
    if (item) {
      me.userInfo.useExisting = item.hasUser();
      me.userInfo.userHref = item.hasUser() ? item.user.href : '';
      me.userInfo.user = item.hasUser() ? me.userEsRef.getUser(me.userInfo.userHref) : undefined;
      me.userInfo.username = item.username || '';
      me.userInfo.password = item.password || '';
    }
  }

  private reloadUsers(): void {
    let me = this;
    if (me.userEsRef)
      me.userEsRef.loadUsers();
  }

  private isUserInfoValid(): boolean {
    return this.userEsRef && this.userEsRef.isValid();
  }

  private isSiteNameValid(): boolean {
    return this.model && (this.model.site !== 'new' || this.model.siteName && this.model.siteName.trim().length > 0);
  }

  private onChangeSite(): void {
    let me = this;
    if (me.model && !me.model.phantom && me.oldSite && me.oldSite !== me.model.site) {
      me.confirmEx(me.textChangeSite, function() {
      }, function() {
        me.model.site = me.oldSite;
      });
    }
  }

  private mask() {
    let me = this;
    if (me.alert) {
      me.alert.show(undefined, undefined, AlertType.MASK);
    }
  }

  private unmask() {
    let me = this;
    if (me.alert) {
      me.alert.hide();
    }
  }
}
