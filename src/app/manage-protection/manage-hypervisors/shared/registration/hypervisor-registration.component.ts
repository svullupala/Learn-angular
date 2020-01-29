import {Component, Input, OnInit, ViewChild, OnDestroy, Output, EventEmitter} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SharedService} from 'shared/shared.service';
import {SessionService} from 'core';
import {IdentityUserModel} from 'identity/shared/identity-user.model';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {Subject} from 'rxjs/Subject';
import {HypervisorManageService} from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {BsModalRef} from 'ngx-bootstrap';
import {HypervisorNodeModel} from 'hypervisor/shared/hypervisor-node.model';
import {ErrorModel} from 'shared/models/error.model';
import {IdentityUserEnterSelectV2Component} from 'identity/shared/identity-user-enter-select-v2';
import {HypervisorRegistrationError} from '../hypervisor-inventory.service';

@Component({
  selector: 'hypervisor-registration',
  templateUrl: './hypervisor-registration.component.html',
  styleUrls: ['./hypervisor-registration.component.scss']
})
export class HypervisorRegistrationComponent implements OnInit, OnDestroy {

  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Output() registered = new EventEmitter<HypervisorModel>();
  @Output() errorOccurred = new EventEmitter<HypervisorRegistrationError>();

  public persistOldVeInfo: boolean = false;

  touched: {
    hostAddress: boolean
    portNumber: boolean,
    snapshotConcurrency: boolean
  } = {hostAddress: false, portNumber: false, snapshotConcurrency: false};

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  masked: boolean = false;
  model: HypervisorModel;
  canCreate: boolean = false;

  @ViewChild('user', {read: IdentityUserEnterSelectV2Component}) userEsRef: IdentityUserEnterSelectV2Component;

  private subs: Subject<void> = new Subject<void>();
  private infoTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private registrationEditMsg: string;
  private textUseSSL: string;

  private userType: string = IdentityUserModel.TYPE_SYSTEM;
  private userInfo: IdentityUserEnterSelectModel;
  private veUserInfo: IdentityUserEnterSelectModel;
  private getUserPending: boolean = false;

  constructor(public vcmService: HypervisorManageService,
              public translate: TranslateService,
              public bsModalRef: BsModalRef) {
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): ErrorModel {
    let me = this;
    if (me.errorHandler)
      return me.errorHandler.handle(err, node, true);
    return undefined;
  }

  isRegistrationFormValid(): boolean {
    return this.baseValid() && this.isUserInfoValid();
  }

  onBlur(key: string): void {
    this.touched[key] = true;
  }

  onCancelClick(): void {
    this.reset();
    this.hide();
  }

  onSaveClick() {
    let me = this, userInfo: IdentityUserEnterSelectModel, veUserInfo: IdentityUserEnterSelectModel;

    if (me.isRegistrationFormValid()) {

      // Get user info & set the username field of current model
      userInfo = me.getUserInfo();
      me.model.username = userInfo.useExisting ? userInfo.userHref : userInfo.username || undefined;
      me.model.password = !userInfo.useExisting ? userInfo.password : undefined;

      if (me.persistOldVeInfo) {
        // Get veUser info & set the username field of current model
        veUserInfo = me.getVeUserInfo();
        me.model.veUsername = veUserInfo.useExisting ? veUserInfo.userHref : veUserInfo.username || undefined;
        me.model.vePassword = !veUserInfo.useExisting ? veUserInfo.password : undefined;
      }

      if (me.model.phantom) {
        me.mask();
        me.vcmService.register(me.model).takeUntil(me.subs)
          .subscribe(
            data => {
              // Cast the JSON object to HypervisorModel instance.
              let hypervisor: HypervisorModel;
              try {
                hypervisor = JsonConvert.deserializeObject(data, HypervisorModel);
              } catch (e) {
              }

              // AGAIN BECAUSE the NodeJS service is always in change.
              if (!hypervisor) {
                try {
                  hypervisor = JsonConvert.deserializeObject(data, HypervisorNodeModel).response;
                } catch (e) {
                }
              }
              me.unmask();

              if (hypervisor && hypervisor.getId())
                me.info(me.registrationSucceedMsg);

              me.hide();
              me.registered.emit(hypervisor);
            },
            err => {
              me.unmask();
              me.hide();
              me.errorOccurred.emit({
                model: me.model,
                error: me.handleError(err, true),
                raw: err
              });
            }
          );
      } else {
        me.update();
      }
    }
  }

  onAddInit(item?: HypervisorModel) {
    let me = this;
    me.persistOldVeInfo = false;
    me.model = item || new HypervisorModel(me.hypervisorType);
    me.model.snapshotConcurrency = (item ? item.snapshotConcurrency : 0) || 3;
    me.setUserInfo(me.model, true);
  }

  onEditInit(item: HypervisorModel) {
    let me = this;
    me.model = item.copy();

    // Note: In 10.1.1 we allowed the user to register a vCenter with VE settings.
    // In 10.1.2 we no longer support this feature. We removed all code relating to this
    // feature (https://jira.catalogicsoftware.com/browse/SPP-3188).
    // Recently, it was brought up that we need to retain those settings when we are editing that
    // vCenter with those ve settings (https://jira.catalogicsoftware.com/browse/SPP-3503).
    // 10.1.1 customer who registered a vcenter with VE settings then upgraded to 10.1.2 we need
    // to persist those settings.
    me.persistOldVeInfo = !me.isHyperV() && me.model.hasVeHostAddress;

    me.setUserInfo(item);
    if (me.persistOldVeInfo)
      me.setVeUserInfo(item);
  }

  reset(): void {
    let me = this;
    me.model = new HypervisorModel(me.hypervisorType);
    me.setUserInfo(me.model);
    if (me.persistOldVeInfo)
      me.setVeUserInfo(me.model);
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'hypervisor.registrationSucceedMsg',
      'hypervisor.registrationEditMsg',
      'hypervisor.textUseSSL',
      'vmware.textTitle',
      'hyperv.textTitle']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.registrationSucceedMsg = SharedService.formatString(resource['hypervisor.registrationSucceedMsg'],
          me.isHyperV() ? resource['hyperv.textTitle'] : resource['vmware.textTitle']);
        me.registrationEditMsg = SharedService.formatString(resource['hypervisor.registrationEditMsg'],
          me.isHyperV() ? resource['hyperv.textTitle'] : resource['vmware.textTitle']);
        me.textUseSSL = resource['hypervisor.textUseSSL'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new HypervisorModel(me.hypervisorType);
    me.userInfo = new IdentityUserEnterSelectModel();
    me.veUserInfo = new IdentityUserEnterSelectModel();
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

  private getTitleText() {
    return this.isHyperV() ?
      ((this.model.phantom ? 'hyperv.textAddServer' : 'hyperv.textEditServerProperties'))
      : ((this.model.phantom ? 'vmware.textAddVCenter' : 'vmware.textEditVCenterProperties'));
  }

  private update(): void {
    let me = this;
    me.mask();
    me.vcmService.update(me.model).takeUntil(me.subs)
      .subscribe(
        data => {
          // Cast the JSON object to HypervisorModel instance.
          let hypervisor: HypervisorModel;
          try {
            hypervisor = JsonConvert.deserializeObject(data, HypervisorModel);
          } catch (e) {
          }

          // AGAIN BECAUSE the NodeJS service is always in change.
          if (!hypervisor) {
            try {
              hypervisor = JsonConvert.deserializeObject(data, HypervisorNodeModel).response;
            } catch (e) {
            }
          }
          me.unmask();
          me.hide();
          me.info(me.registrationEditMsg);
          me.registered.emit(hypervisor);
        },
        err => {
          me.unmask();
          me.hide();
          me.errorOccurred.emit({
            model: me.model,
            error: me.handleError(err, true),
            raw: err
          });
        }
      );
  }

  private getUserInfo(): IdentityUserEnterSelectModel {
    let me = this;
    if (me.userEsRef)
      me.userInfo = me.userEsRef.getValue();
    return me.userInfo;
  }

  private isHref(value: string): boolean {
    return !value ? false : ['http:', 'https:'].findIndex(item => value.startsWith(item)) !== -1;
  }

  private hasUserHref(item: HypervisorModel): boolean {
    return !!item.username && this.isHref(item.username) || item.hasUser();
  }

  private getUserHref(item: HypervisorModel): string {
    return item.hasUser() ? item.user.href : item.username;
  }

  private hasUser(item: HypervisorModel, checkUsername?: boolean): boolean {
    return checkUsername ? this.hasUserHref(item) : item.hasUser();
  }

  private setUserInfo(item: HypervisorModel, checkUsername?: boolean): void {
    let me = this;
    me.userInfo = new IdentityUserEnterSelectModel();
    if (item) {
      me.userInfo.useExisting = me.hasUser(item, checkUsername);
      me.userInfo.userHref = me.userInfo.useExisting ? me.getUserHref(item) : '';
      me.userInfo.user = me.userInfo.useExisting ? me.userEsRef.getUser(me.userInfo.userHref) : undefined;
      if (!me.userInfo.user)
        me.getUserPending = true;
      else {
        item.username = me.userInfo.user.username;
        me.userInfo.username = me.userInfo.user.username;
      }
      me.userInfo.username = item.username || '';
      me.userInfo.password = item.password || '';
      if (me.userInfo.useExisting)
        me.userEsRef.useExistingUser();
    }
  }

  private onUsersLoaded(): void {
    let me = this;
    if (me.getUserPending) {
      me.getUserPending = false;
      me.userInfo.user = me.userEsRef.getUser(me.userInfo.userHref);
      if (me.userInfo.user) {
        me.model.username = me.userInfo.user.username;
        me.userInfo.username = me.userInfo.user.username;
      }
    }
  }

  private baseValid(): boolean {
    let model = this.model;
    return model && model.hostAddress && model.portNumber > 0 && model.portNumber < 65535 &&
      model.snapshotConcurrency >= 1;
  }

  private getVeUserInfo(): IdentityUserEnterSelectModel {
    let me = this;
    return me.veUserInfo;
  }

  private setVeUserInfo(item: HypervisorModel): void {
    let me = this;
    me.veUserInfo = new IdentityUserEnterSelectModel();
    if (item) {
      me.veUserInfo.useExisting = item.hasVeUser();
      me.veUserInfo.userHref = item.hasVeUser() ? item.veUser.href : '';
      me.veUserInfo.user = undefined; // this field isn't used here.
      me.veUserInfo.username = item.veUsername || '';
      me.veUserInfo.password = item.vePassword || '';
    }
  }

  private isUserInfoValid(): boolean {
    return this.userEsRef && this.userEsRef.isValid();
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private onSslClick(value: boolean): void {
    if (this.isHyperV()) {
      this.model.portNumber = value ? 5986 : 5985;
    } else {
      this.model.portNumber = value ? 443 : 80;
    }
  }
}
