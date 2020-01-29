import {
  Component, OnDestroy, OnInit, Output,
  EventEmitter, ViewChild, Input,
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef} from 'ngx-bootstrap';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {SessionService} from 'core';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {SharedService} from 'shared/shared.service';
import {NgForm} from '@angular/forms';
import {DiscoveryInstancesModel} from 'appserver/discovery-instances.model';
import {DiscoveryInstanceModel} from 'appserver/discovery-instance.model';
import {DiscoveryTableComponent} from 'appserver/manage-appserver/discovery-table/discovery-table.component';
import {ExchOnlineInstancesModel} from 'appserver/exchonline-instances.model';
import {ExchOnlineInstanceModel} from 'appserver/exchonline-instance.model';
import {AppserverPayloadModel} from 'appserver/manage-appserver/registration-form/registration-form.component';
import {AppCredentialModel, AppServerModel} from 'appserver/appserver.model';
import {
  ApplicationRegistrationFormService
} from 'appserver/manage-appserver/registration-form/registration-form.service';
import {ErrorModel} from 'shared/models/error.model';
import {ApplicationRegistrationError, ApplicationRegistrationTarget} from '../application-inventory.service';
import {IdentityUserEnterSelectV2Component} from 'identity/shared/identity-user-enter-select-v2';

@Component({
  selector: 'application-registration',
  templateUrl: './application-registration.component.html',
  styleUrls: ['./application-registration.component.scss'],
})
export class ApplicationRegistrationComponent implements OnInit, OnDestroy {

  @Output() registered = new EventEmitter<ApplicationRegistrationTarget>();
  @Output() errorOccurred = new EventEmitter<ApplicationRegistrationError>();
  @Input() propertiesText: string;
  @Input() propertiesEditText: string;
  @Input() hideOptions: boolean = false;
  @Input() canDiscover: boolean = false;
  @Input() showOsType: boolean = true;
  @Input() applicationType: string;
  @Input() labelWidth: number = 2;
  @Input() fieldWidth: number = 6;
  @ViewChild('identityUserSelect', {read: IdentityUserEnterSelectV2Component})
  identitySelectComponent: IdentityUserEnterSelectV2Component;
  @ViewChild('tenantClientSelect', {read: IdentityUserEnterSelectV2Component})
  tenantClientSelectComponent: IdentityUserEnterSelectV2Component;
  @ViewChild(DiscoveryTableComponent) discoverComponent: DiscoveryTableComponent;

  public alert: AlertComponent;
  public error: ErrorHandlerComponent;
  private instances: Array<DiscoveryInstanceModel>;
  private getUserPending: boolean = false;
  private getKeyPending: boolean = false;
  private onlyUserSelection: boolean = false;
  private infoTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private textConfirm: string;
  private updateRegistrationMsg: string;
  private LINUX_TYPE: string = 'linux';
  private WINDOWS_TYPE: string = 'windows';
  private SQL_TYPE: string = 'sql';
  private MONGO_TYPE: string = 'mongo';
  private EXCHANGE_TYPE: string = 'exch';
  private EXCHONLINE_TYPE: string = 'office365';
  private DB2_TYPE: string = 'db2';
  private isOracleApplication: boolean = false;
  private ORACLE_TYPE: string = 'oracle';
  // private SCRIPT_TYPE: string = 'script';
  private editAppserver: boolean = false;
  private appserverPayloadModel: AppserverPayloadModel;
  private subs: Subject<void> = new Subject<void>();
  private masked: boolean = false;
  private appServer: AppServerModel;
  private textRequiredFieldMinSuggestionTpl: string;

  constructor(private registrationFormService: ApplicationRegistrationFormService,
              private bsModalRef: BsModalRef,
              private translate: TranslateService) {
  }

  get textRequiredFieldMinSuggestion(): string {
    return SharedService.formatString(this.textRequiredFieldMinSuggestionTpl, 1);
  }

  get isExchangeOnline(): boolean {
    return this.applicationType === this.EXCHONLINE_TYPE;
  }

  ngOnInit() {
    this.appserverPayloadModel = new AppserverPayloadModel();
    if (this.applicationType === this.DB2_TYPE) {
      this.appserverPayloadModel.maxConcurrency = 1;
    }
    if (this.applicationType === this.ORACLE_TYPE) {
      this.isOracleApplication = true;
    }
    this.appserverPayloadModel.osType = (this.applicationType === this.SQL_TYPE
      || this.applicationType === this.EXCHANGE_TYPE) ? this.WINDOWS_TYPE : this.LINUX_TYPE;

    if (this.isExchangeOnline) {
      this.appserverPayloadModel.tenantClient = new IdentityUserEnterSelectModel();
      this.appserverPayloadModel.tenantAdmin = new IdentityUserEnterSelectModel();
    }

    this.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textRequiredFieldMinSuggestionTpl',
      'application.applicationPropertiesText',
      'application.updateRegistrationMsg',
      'application.registrationSucceedMsg']).takeUntil(this.subs)
      .subscribe((resource: Object) => {

        this.infoTitle = resource['common.infoTitle'];
        this.processingRequestMsg = resource['common.processingRequestMsg'];
        this.registrationSucceedMsg = resource['application.registrationSucceedMsg'];
        this.updateRegistrationMsg = resource['application.updateRegistrationMsg'];
        this.textConfirm = resource['common.textConfirm'];
        this.textRequiredFieldMinSuggestionTpl = resource['common.textRequiredFieldMinSuggestionTpl'];
      });

    this.error = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  onCancelClick(): void {
    this.hide();
  }

  onAddInit(item?: ApplicationRegistrationTarget) {
    let me = this;
    me.appServer = (item ? item.appServer : null) || new AppServerModel();
    me.appServer.applicationType = me.applicationType;
    me.editAppserver = false;
    if (!item) {
      me.reset();
      me.instances = undefined;
    } else {
      me.appserverPayloadModel = item.payload;
      me.initUserAccess();
    }
  }

  onEditInit(item: AppServerModel) {
    let me = this;
    me.appServer = item;
    me.setAppModel(me.appServer);
    me.editAppserver = true;
  }

  hide(): void {
    this.bsModalRef.hide();
  }

  private mask(): void {
    this.masked = true;
  }

  private unmask(): void {
    this.masked = false;
  }

  private setAppModel(appServer: AppServerModel): void {

    let href;
    if (appServer.osuser)
      href = (appServer.osuser['href'] as string) || '';
    else
      href = (appServer.oskey['href'] as string) || '';

    if (!this.onlyUserSelection && href.indexOf('key') !== -1) {
      this.identitySelectComponent.setKey(href);
      this.appserverPayloadModel.keySelectModel = this.appserverPayloadModel.sshKey;
      this.appserverPayloadModel.useSsh = true;
    } else {
      this.appserverPayloadModel.userHref = appServer.osuser['href'];
      this.appserverPayloadModel.user = this.identitySelectComponent.getUser(this.appserverPayloadModel.userHref);
      if (!this.appserverPayloadModel.user)
        this.getUserPending = true;
      else {
        this.appserverPayloadModel.username = this.appserverPayloadModel.user.username;
      }
      this.appserverPayloadModel.useExisting = true;
      this.appserverPayloadModel.useSsh = false;
    }
    this.appserverPayloadModel.osType = appServer.osType || '';
    this.appserverPayloadModel.applicationType = this.applicationType;
    this.appserverPayloadModel.hostAddress = appServer.hostAddress;
    this.appserverPayloadModel.maxConcurrency = appServer.maxConcurrency;
    if (Array.isArray(appServer.appCredentials) && appServer.appCredentials.length > 0 &&
      (!this.isExchangeOnline && this.discoverComponent)) {
      this.getRegisteredInstances(appServer.appCredentials);
    } else if (Array.isArray(appServer.instances) && appServer.instances.length > 0 && this.isExchangeOnline) {
      this.setExchangeOnlineTenant(appServer.instances);
    }
  }

  private initUserAccess(): void {
    let me = this, keyHref: string, userHref = me.appserverPayloadModel.userHref;

    if (me.onlyUserSelection || !me.appserverPayloadModel.keySelectModel ||
      !me.appserverPayloadModel.keySelectModel.key) {
      me.appserverPayloadModel.useSsh = false;
    }
    if (me.appserverPayloadModel.useSsh) {
      keyHref = me.appserverPayloadModel.keySelectModel.keyHref;
      if (me.identitySelectComponent)
        me.identitySelectComponent.setKey(keyHref);
      else
        me.getKeyPending = true;
    } else if (me.identitySelectComponent) {
      me.appserverPayloadModel.user = me.identitySelectComponent.getUser(userHref);
      if (!me.appserverPayloadModel.user)
        me.getUserPending = true;
      else
        me.appserverPayloadModel.username = me.appserverPayloadModel.user.username;
      me.appserverPayloadModel.useExisting = true;
    }
  }

  private onUsersLoaded(): void {
    let me = this;
    if (me.getUserPending) {
      me.getUserPending = false;
      me.appserverPayloadModel.user = this.identitySelectComponent.getUser(me.appserverPayloadModel.userHref);
      if (me.appserverPayloadModel.user) {
        me.appserverPayloadModel.username = me.appserverPayloadModel.user.username;
      }
      if (me.editAppserver) {
        this.identitySelectComponent.refreshIdentityType();
      }
    }
  }

  private getTitleText(): string {
    if (typeof this.propertiesText === 'string'
      && typeof this.propertiesEditText === 'string') {
      return this.editAppserver ? this.propertiesEditText : this.propertiesText;
      // } else if (this.applicationType === 'script') {
      //   this.appserverPayloadModel.setScriptServer();
      //   return this.editAppserver ? 'scripts.editScriptServerPropertiesText'
      //     : 'scripts.scriptServerPropertiesText';
    } else {
      return this.editAppserver ? 'application.editApplicationPropertiesText'
        : 'application.textAddApplicationServer';
    }
  }

  private getSubtitleText(): string {
    let subtitle = {
      db2: 'menubar.submenu.textDB2',
      exch: 'menubar.submenu.textExchange',
      office365: 'menubar.submenu.textExchangeOnline',
      mongo: 'menubar.submenu.textMongoDb',
      oracle: 'menubar.submenu.textOracle',
      sql: 'menubar.submenu.textSQL'
    };
    return subtitle[this.applicationType];
  }

  private getExchangeOnlineInstancesPersistentJson(): Array<any> {
    let instance = new ExchOnlineInstanceModel();
    instance.tenant = this.appserverPayloadModel.tenantName;
    instance.tenantID = this.appserverPayloadModel.tenantID;
    instance.keytype = 'exch_key';
    instance.clientID = this.appserverPayloadModel.tenantClient.username;
    instance.clientSecret = this.appserverPayloadModel.tenantClient.password;
    instance.name = instance.keytype + '_' + this.appserverPayloadModel.hostAddress;
    return [instance.getPersistentJson()];
  }

  private setExchangeOnlineTenant(instances: ExchOnlineInstanceModel[]): void {
    let instance: ExchOnlineInstanceModel = instances && instances.length > 0 ? instances[0] : null,
      users: {
        client: IdentityUserEnterSelectModel
      };
    if (instance) {
      this.appserverPayloadModel.tenantName = instance.tenant;
      this.appserverPayloadModel.tenantID = instance.tenantID;
      // The instance users need to be allocated before assigning to tenantClient & tenantAdmin.
      users = this.allocateInstanceUsers(instance);
      this.appserverPayloadModel.tenantClient = users.client;
    }
  }

  private allocateInstanceUsers(instance: ExchOnlineInstanceModel): {
    client: IdentityUserEnterSelectModel;
  } {
    let client = new IdentityUserEnterSelectModel();

    client.useExisting = false;
    client.username = instance.clientID;
    client.password = instance.clientSecret;

    return {client: client};
  }

  private onSaveClick(): void {
    let me = this, payload,
      observable: Observable<any>;

    if (me.discoverComponent && me.canDiscover) {
      me.appserverPayloadModel.instances = me.discoverComponent.getValue();
    }
    if (me.isExchangeOnline) {
      me.appserverPayloadModel.instances = me.getExchangeOnlineInstancesPersistentJson();
    }
    if (!me.onlyUserSelection && me.appserverPayloadModel.useSsh) {
      me.appserverPayloadModel.user = undefined;
      me.appserverPayloadModel.userHref = '';
      me.appserverPayloadModel.keySelectModel = me.appserverPayloadModel.sshKey;
      payload = me.appserverPayloadModel.getPersistentKeyJson();
    } else {
      if (me.appserverPayloadModel.keySelectModel) {
        me.appserverPayloadModel.keySelectModel.key = undefined;
        me.appserverPayloadModel.keySelectModel.keyHref = '';
      }
      payload = me.appserverPayloadModel.getPersistentJson();
    }
    observable = me.editAppserver
      ? me.registrationFormService.updateAppserver(me.appServer.id, payload)
      : me.registrationFormService.registerAppserver(payload);
    if (observable) {
      me.mask();
      observable.takeUntil(me.subs).subscribe(
        (res: Object) => {
          let message: string = me.editAppserver
            ? me.updateRegistrationMsg
            : me.registrationSucceedMsg;

          me.unmask();
          me.hide();
          me.info(message);
          me.registered.emit({appServer: me.appServer, payload: me.appserverPayloadModel});
        },
        error => {
          me.unmask();
          me.hide();
          me.errorOccurred.emit({
            model: {appServer: me.appServer, payload: me.appserverPayloadModel},
            error: me.handleError(error, true),
            raw: error
          });
        }
      );
    }
  }

  private getInstances(): void {
    let payload = this.appserverPayloadModel.getInstancesJson(this.applicationType),
      observable: Observable<any> = this.registrationFormService.getInstances(payload);
    if (observable) {
      this.mask();
      observable.takeUntil(this.subs).subscribe(
        (res: DiscoveryInstancesModel) => {
          this.unmask();
          if (this.applicationType === 'oracle')
            this.instances = res.getDatabases();
          if (this.applicationType === 'mongo')
            this.instances = res.getRecords();
        },
        (error: Object) => {
          this.unmask();
          this.handleError(error);
        }
      );
    }
  }

  private getRegisteredInstances(appCredentials: Array<AppCredentialModel>): void {
    let payload = this.appserverPayloadModel.getInstancesJson(this.applicationType,
      this.getInstancesPostBody(appCredentials)),
      observable: Observable<DiscoveryInstancesModel | ExchOnlineInstancesModel> =
        this.registrationFormService.getRegisteredInstances(payload);
    if (observable) {
      this.mask();
      observable.takeUntil(this.subs).subscribe(
        (res: DiscoveryInstancesModel | ExchOnlineInstancesModel) => {
          if (this.applicationType === 'oracle')
            this.instances = this.discoverComponent.setValue((res as DiscoveryInstancesModel).getDatabases());
          if (this.applicationType === 'mongo')
            this.instances = this.discoverComponent.setValue((res as DiscoveryInstancesModel).getRecords());

          this.unmask();
        },
        (error: Object) => {
          this.unmask();
          this.handleError(error, true);
        }
      );
    }
  }

  private getInstancesPostBody(appCredentials: Array<AppCredentialModel>): Array<object> {
    let retVal: Array<any> = [];

    (appCredentials || []).forEach((app: AppCredentialModel) => {
      retVal.push({name: app.instanceName, user: app.appuser['href']});
    });
    return retVal;
  }

  private resetAppseverPayloadModel(): void {
    this.appserverPayloadModel = new AppserverPayloadModel();
    this.appserverPayloadModel.applicationType = this.applicationType;
    this.appserverPayloadModel.osType =
      (this.applicationType === this.SQL_TYPE
        || this.applicationType === this.EXCHANGE_TYPE)
        ? this.WINDOWS_TYPE
        : this.LINUX_TYPE;
    if (this.isExchangeOnline) {
      this.appserverPayloadModel.tenantClient = new IdentityUserEnterSelectModel();
      this.appserverPayloadModel.tenantAdmin = new IdentityUserEnterSelectModel();
    }
  }

  private reset(): void {
    this.resetAppseverPayloadModel();
    this.appserverPayloadModel.useSsh = false;
  }

  private isIdentityComponentValid(): boolean {
    return this.identitySelectComponent && this.identitySelectComponent.isValid();
  }

  private isTenantClientComponentValid(): boolean {
    return this.tenantClientSelectComponent && this.tenantClientSelectComponent.isValid();
  }

  private isOptionsHidden(): boolean {
    return this.hideOptions || this.applicationType === this.DB2_TYPE;
    // || this.applicationType === this.SCRIPT_TYPE;
  }

  private info(message: string, title?: string): void {
    this.alert.show(title || this.infoTitle, message);
  }

  private handleError(err: any, node?: boolean): ErrorModel {
    let me = this;
    if (me.error)
      return me.error.handle(err, node, true);
    return undefined;
  }

  private isValid(appForm: NgForm): boolean {
    let me = this,
      componentValidity: boolean = me.isIdentityComponentValid(),
      extraValidity: boolean = me.isExchangeOnline ?
        me.isTenantClientComponentValid() : true;
    return (appForm.form.valid && componentValidity && extraValidity);
  }
}
