import {Component, Input, OnInit, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import {FormGroup, AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {HypervisorManageService} from './hypervisor-manage.service';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SharedService} from 'shared/shared.service';
import {HypervisorModel} from '../hypervisor.model';
import {HypervisorsModel} from '../hypervisors.model';
import {HypervisorNodeModel} from '../hypervisor-node.model';
import {SessionService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {IdentityUserModel} from 'identity/shared/identity-user.model';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {IdentityUserEnterSelectComponent}
  from 'identity/shared/identity-user-enter-select/identity-user-enter-select.component';
import {LinkModel} from 'shared/models/link.model';
import { Subject } from 'rxjs/Subject';
import {MD5} from 'shared/util/md5';
import {KeySelectModel} from 'shared/components/key-selector/key-select.model';
import {CloudService} from 'cloud/cloud.service';
import {KeySelectorComponent} from 'shared/components/key-selector/key-selector.component';
import {CloudModel} from 'cloud/cloud.model';
import {HypervisorTableComponent} from 'hypervisor/shared/hypervisor-table/hypervisor-table.component';
import {CloudTableComponent} from 'cloud/cloud-table/cloud-table.component';

@Component({
  selector: 'hypervisor-manage',
  templateUrl: './hypervisor-manage.component.html',
  styleUrls: ['./hypervisor-manage.component.scss'],
})
export class HypervisorManageComponent implements OnInit, OnDestroy {

  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;

  records: Array<HypervisorModel>;
  paginateConfig: PaginateConfigModel;
  public form: FormGroup;
  public veServerForm: FormGroup;
  public ec2Form: FormGroup;
  public optionsForm: FormGroup;
  public name: AbstractControl;
  public hostAddress: AbstractControl;
  public portNumber: AbstractControl;
  public veHostAddress: AbstractControl;
  public veOSType: AbstractControl;
  public snapshotConcurrency: AbstractControl;
  public sslConnection: boolean = true;
  public persistOldVeInfo: boolean = false;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  model: HypervisorModel;
  cloudModel: CloudModel;
  canCreate: boolean = false;

  @ViewChild('collapsibleOptionsRef') collapsibleOptionsRef: ElementRef;
  @ViewChild('hypervisorEditContainer') editContainer: ElementRef;
  @ViewChild(HypervisorTableComponent) hypervisorTable: HypervisorTableComponent;
  @ViewChild(CloudTableComponent) cloudTable: CloudTableComponent;
  @ViewChild('user', { read: IdentityUserEnterSelectComponent} ) userEsRef: IdentityUserEnterSelectComponent;
  @ViewChild(KeySelectorComponent) keySelector: KeySelectorComponent;

  private mode: string = 'list';
  private subs: Subject<void> = new Subject<void>();
  private infoTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private registrationEditMsg: string;
  private textUseSSL: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;

  private userType: string = IdentityUserModel.TYPE_SYSTEM;
  private userInfo: IdentityUserEnterSelectModel;
  private veUserInfo: IdentityUserEnterSelectModel;
  private maskList: boolean = false;
  private resource: Object = [];
  private keySelectModel: KeySelectModel;

  constructor(public vcmService: HypervisorManageService, fb: FormBuilder,
              public cloudService: CloudService,
              public translate: TranslateService) {

    this.form = fb.group({
      'hostAddress': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'portNumber': ['', Validators.compose([Validators.minLength(0)])]
    });
    this.hostAddress = this.form.controls['hostAddress'];
    this.portNumber = this.form.controls['portNumber'];

    this.ec2Form = fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
    });
    this.name = this.ec2Form.controls['name'];

    this.optionsForm = fb.group({
      'snapshotConcurrency': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.snapshotConcurrency = this.optionsForm.controls['snapshotConcurrency'];

    this.veServerForm = fb.group({
      'veHostAddress': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'veOSType': ['', Validators.compose([Validators.required])]
    });
    this.veHostAddress = this.veServerForm.controls['veHostAddress'];
    this.veOSType = this.veServerForm.controls['veOSType'];

    let paginationId: string = `hypervisor-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  confirm(item: HypervisorModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmUnregister, item.name),
        AlertType.UNREGISTER, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  isRegistrationFormValid(): boolean {
    let me = this;
    if (me.isAWSEC2()){
      return this.ec2Form.valid && this.keySelector && this.keySelector.isValid();
    } else {
      return this.form.valid && me.isUserInfoValid();
    }
  }

  onCancelClick(): void {
    this.reset();
    this.mode = 'list';
  }

  saveEC2() {
    let me = this, accessKey,  cloudPostBody = {
      type: this.cloudModel.type,
      provider: this.cloudModel.provider,
      name: this.name.value
    };
    accessKey = me.keySelectModel.useExisting ?
      me.keySelectModel.keyHref : me.keySelectModel.getPersistentJson();
    if (!me.keySelectModel.useExisting) {
      accessKey.name = this.name.value;
    }

    cloudPostBody['accesskey'] = accessKey;
    me.mask();
    me.cloudService.registerEC2Provider(cloudPostBody).takeUntil(me.subs)
      .subscribe(
        data => {
          me.unmask();
          me.mode = 'list';
          me.info(me.registrationSucceedMsg);
          me.reset();
          me.loadData();
        }, err => {
          me.unmask();
          me.handleError(err, true);
        }
      );
  }

  saveHypervisor() {
    let me = this, userInfo: IdentityUserEnterSelectModel, veUserInfo: IdentityUserEnterSelectModel;

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
            } catch (e) {}

            // AGAIN BECAUSE the NodeJS service is always in change.
            if (!hypervisor) {
              try {
                hypervisor = JsonConvert.deserializeObject(data, HypervisorNodeModel).response;
              } catch (e) {
              }
            }
            me.unmask();
            me.mode = 'list';
            if (hypervisor && hypervisor.getId()) {
              me.info(me.registrationSucceedMsg);
              me.reset();
              me.loadData();
              if (!me.userInfo.useExisting) {
                // New user may have been created so need to reload users for prepopulating & selecting later.
                me.reloadUsers();
              }
            }
          },
          err => {
            me.unmask();
            me.handleError(err, true);
          }
        );
    } else {
      me.update();
    }
  }

  onSaveClick() {
    let me = this;
    if (me.isRegistrationFormValid()) {
      if (me.isAWSEC2()) {
        me.saveEC2();
      } else {
        me.saveHypervisor();
      }
    }
  }

  onAddClick() {
    let me = this;
    me.persistOldVeInfo = false;
    if (!me.model.phantom) {
      me.model = new HypervisorModel(me.hypervisorType);
      me.setUserInfo(me.model);
    }
    me.mode = 'edit';
  }

  onEditClick(item: HypervisorModel) {
    let me = this;
    me.model = item.copy();
    me.mode = 'edit';

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

  onEditCloudClick(item: CloudModel){
    let me = this;
    me.cloudModel = item;
    me.mode = 'edit';
    me.name.setValue(me.cloudModel.name);
    me.keySelector.setValue(me.cloudModel.accesskey.href);
  }

  reset(): void {
    let me = this;
    me.model = new HypervisorModel(me.hypervisorType);
    me.cloudModel = new CloudModel('compute', 'aws');
    me.setUserInfo(me.model);
    if (me.persistOldVeInfo)
      me.setVeUserInfo(me.model);
    me.form.reset();
    me.ec2Form.reset();
    me.resetKeyModel();
  }

  loadData(resetPage: boolean = true) {
    let me = this;
    if (me.isAWSEC2()) {
      me.cloudTable.getClouds();
    } else {
      me.hypervisorTable.loadData(resetPage);
    }
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.filters = [
      new FilterModel('type', me.hypervisorType)
    ];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'hypervisor.registrationSucceedMsg',
      'hypervisor.registrationEditMsg',
      'hypervisor.textConfirmUnregister',
      'hypervisor.textUseSSL',
      'awsec2.textAddEC2',
      'awsec2.textTitle',
      'awsec2.textServerProperties',
      'awsec2.textEditServerProperties',
      'awsec2.textHostName',
      'vmware.textTitle',
      'vmware.textAddVCenter',
      'vmware.textHostName',
      'vmware.textVCenterProperties',
      'vmware.textEditVCenterProperties',
      'hyperv.textAddServer',
      'hyperv.textServerProperties',
      'hyperv.textEditServerProperties',
      'hyperv.textHostName',
      'hyperv.textTitle']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.resource = resource;
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.registrationSucceedMsg = me.getRegistrationSucceedMsg();
        me.registrationEditMsg = me.getRegistrationEditSucceedMsg();
        me.textUseSSL = resource['hypervisor.textUseSSL'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmUnregister = resource['hypervisor.textConfirmUnregister'];
      });

    me.keySelectModel = me.keySelectModel || new KeySelectModel();
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new HypervisorModel(me.hypervisorType);
    me.cloudModel = new CloudModel('compute', 'aws');
    me.userInfo = new IdentityUserEnterSelectModel();
    me.veUserInfo = new IdentityUserEnterSelectModel();
  }

  public getKeyModel(): KeySelectModel {
    return this.keySelector && this.keySelector.getValue();
  }

  public isKeyValid(): boolean {
    return this.keySelector && this.keySelector.isValid();
  }

  public resetKeyModel(): void {
    this.keySelectModel = new KeySelectModel();
    if (this.keySelector)
      this.keySelector.reset();
  }

  private mask(): void {
    this.alert.show(undefined, undefined, AlertType.MASK);
  }

  private unmask(): void {
    this.alert.hide();
  }

  private getRegistrationEditSucceedMsg(): string {
    if (this.isHyperV()) {
      return SharedService.formatString(this.resource['hypervisor.registrationEditMsg'],
          this.resource['hyperv.textTitle']);
    } else if (this.isVMware()) {
      return SharedService.formatString(this.resource['hypervisor.registrationEditMsg'],
          this.resource['vmware.textTitle']);
    } else if (this.isAWSEC2()) {
      return SharedService.formatString(this.resource['hypervisor.registrationEditMsg'],
          this.resource['awsec2.textTitle']);
    } else {
      return SharedService.formatString(this.resource['hypervisor.registrationEditMsg'], 'server');
    }
  }

  private getRegistrationSucceedMsg(): string {
    if (this.isHyperV()) {
      return SharedService.formatString(this.resource['hypervisor.registrationSucceedMsg'],
          this.resource['hyperv.textTitle']);
    } else if (this.isVMware()) {
      return SharedService.formatString(this.resource['hypervisor.registrationSucceedMsg'],
          this.resource['vmware.textTitle']);
    } else if (this.isAWSEC2()) {
      return SharedService.formatString(this.resource['hypervisor.registrationSucceedMsg'],
          this.resource['awsec2.textTitle']);
    } else {
      return SharedService.formatString(this.resource['hypervisor.registrationSucceedMsg'], 'server');
    }
  }

  private getTitleText() {
    if (this.model.phantom) {
      if (this.isHyperV()) {
        return this.resource['hyperv.textServerProperties'];
      } else if (this.isVMware()) {
        return this.resource['vmware.textVCenterProperties'];
      } else if (this.isAWSEC2()) {
        return this.resource['awsec2.textServerProperties'];
      } else {
        return 'properties';
      }
    } else {
      if (this.isHyperV()) {
        return this.resource['hyperv.textEditServerProperties'];
      } else if (this.isVMware()) {
        return this.resource['vmware.textEditVCenterProperties'];
      } else if (this.isAWSEC2()) {
        return this.resource['awsec2.textEditServerProperties'];
      } else {
        return 'edit properties';
      }
    }
  }

  private getHostNameText(): string {
    if (this.isHyperV()) {
      return this.resource['hyperv.textHostName'];
    } else if (this.isVMware()) {
      return this.resource['vmware.textHostName'];
    } else if (this.isAWSEC2()) {
      return this.resource['awsec2.textHostName'];
    } else {
      return 'add';
    }
  }

  private getAddButtonText(): string {
    if (this.isHyperV()) {
      return this.resource['hyperv.textAddServer'];
    } else if (this.isVMware()) {
      return this.resource['vmware.textAddVCenter'];
    } else if (this.isAWSEC2()) {
      return this.resource['awsec2.textAddEC2'];
    } else {
      return 'add';
    }
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
          } catch (e) {}

          // AGAIN BECAUSE the NodeJS service is always in change.
          if (!hypervisor) {
            try {
              hypervisor = JsonConvert.deserializeObject(data, HypervisorNodeModel).response;
            } catch (e) {
            }
          }
          me.unmask();
          if (hypervisor && hypervisor.getId()) {
            me.reset();
            me.loadData();
            if (!me.userInfo.useExisting) {
              // New user may have been created so need to reload users for prepopulating & selecting later.
              me.reloadUsers();
            }
          }
          me.info(me.registrationEditMsg);
          me.mode = 'list';
        },
        err => {
          me.unmask();
          me.handleError(err, true);
        }
      );
  }

  private getUserInfo(): IdentityUserEnterSelectModel {
    let me = this;
    if (me.userEsRef)
      me.userInfo = me.userEsRef.getValue();
    return me.userInfo;
  }

  private setUserInfo(item: HypervisorModel): void {
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

  private reloadUsers(): void {
    let me = this;
    if (me.userEsRef)
      me.userEsRef.loadUsers();
  }

  private isUserInfoValid(): boolean {
    return this.userEsRef && this.userEsRef.isValid();
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private isVMware(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_VMWARE;
  }

  private isAWSEC2(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_AWSEC2;
  }

  private onSslClick(value: boolean): void {
    if (this.isHyperV()) {
      this.model.portNumber = value ? 5986 : 5985;
    } else {
      this.model.portNumber = value ? 443 : 80;
    }
  }

  private getDropDownActionId(item: HypervisorModel): string {
    return 'hypervisor-manage-dropdown-action-' + MD5.encode(item.getId());
  }
}
