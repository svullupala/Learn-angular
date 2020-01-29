import {
  Component, OnDestroy, OnInit, Output, Renderer,
  EventEmitter, ViewChild, Input, ChangeDetectorRef, TemplateRef
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import { ManageAppServerService } from '../manage-appserver.service';
import { AppCredentialModel, AppServerModel } from '../../appserver.model';
import { AlertComponent, AlertType } from 'shared/components/msgbox/alert.component';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { SessionService } from 'core';
import { ApplicationRegistrationFormService } from './registration-form.service';
import { HasPersistentJson } from 'core';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';
import {
  IdentityUserEnterSelectComponent
} from 'identity/shared/identity-user-enter-select/identity-user-enter-select.component';
import {SharedService} from 'shared/shared.service';
import {SdlTooltipDirective} from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';
import { AbstractControl, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { DiscoveryInstancesModel } from 'appserver/discovery-instances.model';
import { DiscoveryInstanceModel } from 'appserver/discovery-instance.model';
import { DiscoveryTableComponent } from 'appserver/manage-appserver/discovery-table/discovery-table.component';
import { KeySelectorComponent } from 'shared/components/key-selector/key-selector.component';
import { KeySelectModel } from 'shared/components/key-selector/key-select.model';
import {ExchOnlineInstancesModel} from 'appserver/exchonline-instances.model';
import {ExchOnlineInstanceModel} from 'appserver/exchonline-instance.model';

export class AppserverPayloadModel extends IdentityUserEnterSelectModel implements HasPersistentJson {
  public name: string;
  public hostAddress: string;
  public osType: string;
  public applicationType: string;
  public scriptServer: boolean = false;
  public maxConcurrency: number = 10;
  public instances: Array<any> = [];
  public useForAllInstances: boolean = false;
  public keySelectModel: KeySelectModel;
  public tenantName: string;
  public tenantID: string;
  public tenantClient: IdentityUserEnterSelectModel;
  public tenantAdmin: IdentityUserEnterSelectModel;

  public getPersistentJson(): Object {
    return {
      name: this.name ? this.name : undefined,
      hostAddress: this.hostAddress,
      username: this.useExisting ? this.userHref : this.username,
      password: this.password,
      osType: this.osType,
      applicationType: this.applicationType,
      addToCatJob: this.scriptServer ? false : true,
      script: this.scriptServer,
      application: !this.scriptServer,
      useForAllInstances: this.useForAllInstances,
      opProperties: {
        maxConcurrency: this.maxConcurrency
      },
      instances: this.instances && this.instances.length > 0 ? this.instances : undefined
    };
  }

  public getPersistentKeyJson(): object {
    // TODO: This is okay for now, but it is important that we refactor post 10.1.3. UI and NodeJS.
    if (this.keySelectModel && this.keySelectModel instanceof KeySelectModel)
      return {
        name: this.name ? this.name : undefined,
        hostAddress: this.hostAddress,
        username: this.keySelectModel.useExisting ? this.keySelectModel.keyHref : this.keySelectModel.name,
        privatekey: this.keySelectModel.useExisting ? undefined : this.keySelectModel.privatekey,
        user: this.keySelectModel.useExisting ? undefined : this.keySelectModel.user,
        osType: this.osType,
        applicationType: this.applicationType,
        addToCatJob: this.scriptServer ? false : true,
        script: this.scriptServer,
        application: !this.scriptServer,
        useForAllInstances: this.useForAllInstances,
        opProperties: {
          maxConcurrency: this.maxConcurrency
        },
        instances: this.instances && this.instances.length > 0 ? this.instances : undefined
      };
  }

  public getInstancesJson(applicationType: string, instances?: Array<any>): object {
    return {
      user: this.useExisting ? {href: this.userHref} : {},
      properties: {
        name: this.name ? this.name : undefined,
        host: this.hostAddress,
        osType: this.osType,
        username: !this.useExisting ? this.username : undefined,
        password: !this.useExisting ? this.password : undefined
      },
      instances: Array.isArray(instances) && instances.length > 0 ? instances : undefined,
      provider: applicationType || '',
      level: 'databases'
    };
  }

  public setScriptServer(): void {
    this.scriptServer = true;
  }
}

@Component({
  selector: 'app-registration-form',
  templateUrl: 'registration-form.component.html',
  styles: []
})

export class ApplicationRegistrationFormComponent implements OnInit, OnDestroy {

  @Output() formSubmitEvent = new EventEmitter<boolean>();
  @Output() editEvent = new EventEmitter<boolean>();
  @Input() onlyUserSelection: boolean = true;
  @Input() propertiesText: string;
  @Input() propertiesEditText: string;
  @Input() hideOptions: boolean = false;
  @Input() canDiscover: boolean = false;
  @Input() showOsType: boolean = true;
  @Input() applicationType: string;
  @Input() labelWidth: number = 2;
  @Input() fieldWidth: number = 3;
  @ViewChild('identityUserSelect', {read: IdentityUserEnterSelectComponent})
  identitySelectComponent: IdentityUserEnterSelectComponent;

  @ViewChild('tenantClientSelect', {read: IdentityUserEnterSelectComponent})
  tenantClientSelectComponent: IdentityUserEnterSelectComponent;

  @ViewChild(KeySelectorComponent) keySelectComponent: KeySelectorComponent;
  @ViewChild(DiscoveryTableComponent) discoverComponent: DiscoveryTableComponent;

  baseFieldClass: string = 'col-sm-{0}';
  baseLabelClass: string = 'control-label col-sm-{0}';
  public alert: AlertComponent;
  public error: ErrorHandlerComponent;
  public optionsForm: FormGroup;
  public maxConcurrency: AbstractControl;
  private instances: Array<DiscoveryInstanceModel>;
  private userRegistrationMode: boolean = true;
  private getUserPending: boolean = false;

  get textRequiredFieldMinSuggestion(): string {
    return SharedService.formatString(this.textRequiredFieldMinSuggestionTpl, 1);
  }

  get isExchangeOnline(): boolean {
    return this.applicationType === this.EXCHONLINE_TYPE;
  }

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
  private isKubernetesApplication: boolean = false;
  private KUBERNETES_TYPE: string = 'k8s';
  private SCRIPT_TYPE: string = 'script';
  private editAppserver: boolean = false;
  private appserverPayloadModel: AppserverPayloadModel;
  private subs: Subject<void> = new Subject<void>();
  private appServer: AppServerModel;
  private textRequiredFieldMinSuggestionTpl: string;

  constructor(private registrationFormService: ApplicationRegistrationFormService,
              private changeDef: ChangeDetectorRef,
              private manageAppserverService: ManageAppServerService,
              private translate: TranslateService, fb: FormBuilder) {
    this.optionsForm = fb.group({
      'maxConcurrency': ['',
        Validators.compose([Validators.required, Validators.min(1), Validators.max(99)])]
    });
      this.maxConcurrency = this.optionsForm.controls['maxConcurrency'];
 }

  ngOnInit() {
    this.appserverPayloadModel = new AppserverPayloadModel();
    if (this.applicationType === this.DB2_TYPE) {
      this.appserverPayloadModel.maxConcurrency = 1;
    }
    if (this.applicationType === this.ORACLE_TYPE) {
      this.isOracleApplication = true;
    }
    if (this.applicationType === this.KUBERNETES_TYPE) {
      this.isKubernetesApplication = true;
    }
    this.appserverPayloadModel.osType = (this.applicationType === this.SQL_TYPE
      || this.applicationType === this.EXCHANGE_TYPE) ? this.WINDOWS_TYPE :  this.LINUX_TYPE;

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
    this.manageAppserverService.editAppserverSubject.takeUntil(this.subs)
      .subscribe(
        (appServer: AppServerModel) => {
          this.appServer = appServer;
          this.setAppModel(this.appServer);
          this.editEvent.emit(true);
          this.editAppserver = true;
        }
      );
    this.manageAppserverService.resetRegistrationFormSubject.takeUntil(this.subs)
      .subscribe(
        () => {
          this.editAppserver = false;
          this.reset();
          this.instances = undefined;
        }
      );

    this.error = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.setWidths();
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  setWidths(): void {
    this.baseFieldClass = SharedService.formatString(this.baseFieldClass, this.fieldWidth.toString());
    this.baseLabelClass = SharedService.formatString(this.baseLabelClass, this.labelWidth.toString());
  }

  private setAppModel(appServer: AppServerModel): void {

    let href;
    if (appServer.osuser)
    href = (appServer.osuser['href'] as string) || '';
    else
    href =  (appServer.oskey['href'] as string) || '';

    if (!this.onlyUserSelection && href.indexOf('key') !== -1) {
      this.keySelectComponent.setValue(href);
      this.appserverPayloadModel.keySelectModel = this.keySelectComponent.getValue();
      this.userRegistrationMode = false;
    } else {
      this.appserverPayloadModel.userHref = appServer.osuser['href'];
      this.appserverPayloadModel.user = this.identitySelectComponent.getUser(this.appserverPayloadModel.userHref);
      if (!this.appserverPayloadModel.user)
        this.getUserPending = true;
      this.appserverPayloadModel.useExisting = true;
      this.userRegistrationMode = true;
    }
    this.appserverPayloadModel.osType = appServer.osType || '';
    this.appserverPayloadModel.applicationType = this.applicationType;
    this.appserverPayloadModel.name = this.appServer.name ? this.appServer.name : undefined;
    this.appserverPayloadModel.hostAddress = appServer.hostAddress;
    this.appserverPayloadModel.maxConcurrency = appServer.maxConcurrency;
    if (Array.isArray(appServer.appCredentials) && appServer.appCredentials.length > 0 &&
      (!this.isExchangeOnline && this.discoverComponent)) {
      this.getRegisteredInstances(appServer.appCredentials);
    } else if (Array.isArray(appServer.instances) && appServer.instances.length > 0 && this.isExchangeOnline) {
      this.setExchangeOnlineTenant(appServer.instances);
    }
  }

  private onUsersLoaded(): void {
    if (this.getUserPending) {
      this.getUserPending = false;
      this.appserverPayloadModel.user = this.identitySelectComponent.getUser(this.appserverPayloadModel.userHref);
    }
  }

  private setTitle(): string {
    if (typeof this.propertiesText === 'string'
      && typeof this.propertiesEditText === 'string') {
      return this.editAppserver ? this.propertiesEditText : this.propertiesText;
    } else if (this.applicationType === 'script') {
      this.appserverPayloadModel.setScriptServer();
      return this.editAppserver ? 'scripts.editScriptServerPropertiesText'
                                  : 'scripts.scriptServerPropertiesText';
    } else {
      return this.editAppserver ? 'application.editApplicationPropertiesText'
                                : 'application.applicationPropertiesText';
    }
  }

  private onCancelClick(): void {
    this.reset();
    this.editEvent.emit(false);
  }

  private reloadUsers(): void {
    let me = this;
    if (me.identitySelectComponent) {
      me.identitySelectComponent.loadUsers();
    }
  }

  private reloadKeys(): void {
    let me = this;
    if (me.keySelectComponent) {
      me.keySelectComponent.loadKeys();
    }
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
    let client = new IdentityUserEnterSelectModel(),
      admin = new IdentityUserEnterSelectModel();

    client.useExisting = false;
    client.username = instance.clientID;
    client.password = instance.clientSecret;

    return {client: client};
  }

  private onSubmit(): void {
    let payload,
        observable: Observable<any>;

    if (this.discoverComponent && this.canDiscover) {
      this.appserverPayloadModel.instances = this.discoverComponent.getValue();
    }
    if (this.isExchangeOnline) {
      this.appserverPayloadModel.instances = this.getExchangeOnlineInstancesPersistentJson();
    }
    if (!this.onlyUserSelection && !this.userRegistrationMode) {
      this.appserverPayloadModel.keySelectModel = this.keySelectComponent.getValue();
      payload = this.appserverPayloadModel.getPersistentKeyJson();
    } else {
      payload = this.appserverPayloadModel.getPersistentJson();
    }
    observable = this.editAppserver
      ? this.registrationFormService.updateAppserver(this.appServer.id, payload)
      : this.registrationFormService.registerAppserver(payload);
    if (observable) {
      this.mask();
      observable.takeUntil(this.subs).subscribe(
        (res: Object) => {
          this.unmask();
          this.info(this.editAppserver
            ? this.updateRegistrationMsg
            : this.registrationSucceedMsg);
          this.manageAppserverService.refreshAppservers();
          if (this.editAppserver) {
            this.formSubmitEvent.emit(false);
          } else {
            this.editEvent.emit(false);
          }
          if (!this.appserverPayloadModel.useExisting) {
            this.reloadUsers();
          }
          if (this.appserverPayloadModel.keySelectModel
            && !this.userRegistrationMode
            && !this.appserverPayloadModel.keySelectModel.useExisting) {
            this.reloadKeys();
          }
          this.reset();
          this.editAppserver = false;
        },
        (error: Object) => {
          this.unmask();
          this.handleError(error, true);
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
    this.userRegistrationMode = true;
    this.changeDef.detectChanges();
  }

  private isIdentityComponentValid(): boolean {
    return this.identitySelectComponent && this.identitySelectComponent.isValid();
  }

  private isTenantClientComponentValid(): boolean {
    return this.tenantClientSelectComponent && this.tenantClientSelectComponent.isValid();
  }

  private isKeyComponentValid(): boolean {
    return this.keySelectComponent && this.keySelectComponent.isValid();
  }

  private mask(): void {
    this.alert.show(this.infoTitle, this.processingRequestMsg, AlertType.MASK);
  }

  private unmask(): void {
    this.alert.hide();
  }

  private isOptionsHidden(): boolean {
    return this.hideOptions || this.applicationType === this.DB2_TYPE || this.applicationType === this.SCRIPT_TYPE;
  }

  private info(message: string, title?: string): void {
    this.alert.show(title || this.infoTitle, message);
  }

  private handleError(err: any, node?: boolean): void {
    this.error.handle(err, node);
  }

  private isValid(appForm: NgForm, optionsForm: NgForm): boolean {
    let componentValidity: boolean = this.userRegistrationMode
      ? ( this.isIdentityComponentValid())
      : (this.isKeyComponentValid()),
      extraValidity: boolean = this.isExchangeOnline ?
        this.isTenantClientComponentValid() : true;
    return (appForm.form.valid && componentValidity && extraValidity && optionsForm.valid);
  }
}
