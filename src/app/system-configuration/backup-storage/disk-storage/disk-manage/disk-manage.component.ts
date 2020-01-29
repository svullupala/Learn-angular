import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  TemplateRef,
  Output,
  EventEmitter,
  Input
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { JsonConvert } from "json2typescript";
import { ErrorModel } from "shared/models/error.model";
import {
  AlertType,
  AlertComponent,
  ErrorHandlerComponent
} from "shared/components/index";
import { SessionService } from "core";
import { StorageModel } from "../shared/storage.model";
import { DiskModel } from "../shared/disk.model";
import { DisksModel } from "../shared/disks.model";
import { PoolModel } from "../shared/pool.model";
import { PoolsModel } from "../shared/pools.model";
import { SharedService } from "shared/shared.service";
import { StorageManageService } from "../shared/storage-manage.service";
import { SiteService } from "site/site.service";
import { SiteModel } from "site/site.model";
import { PaginateConfigModel } from "shared/models/paginate-config.model";
import { PartnerModel } from "diskstorage/disk-manage/partner-manage/partner.model";
import { PartnersModel } from "diskstorage/disk-manage/partner-manage/partners.model";
import { PartnerManageComponent } from "./partner-manage/partner-manage.component";
import { DynamicTabEntry, DynamicTabsetComponent } from "shared/components";
import { ActiveDirectoryComponent } from "./active-directory/active-directory.component";
import { PreferencesCategoryModel } from "shared/components/preferences-category/preferences-category.model";
import { vSnapPreferencesService } from "./vsnap-preferences/vsnap-preferences.service";
import { HelpService } from "core";
import { NetworkModel } from "diskstorage/disk-manage/network-manage/network.model";
import { NetworksModel } from "diskstorage/disk-manage/network-manage/networks.model";
import { NetworkManageComponent } from "diskstorage/disk-manage/network-manage/network-manage.component";

@Component({
  selector: "disk-manage",
  templateUrl: "./disk-manage.component.html",
  styleUrls: ["./disk-manage.component.scss"],
  providers: [SiteService]
})
export class DiskManageComponent implements OnInit {
  @Input() siteDropdownData: Array<SiteModel>;
  @Input() siteMap = [];
  @Input() showField;
  storagePools: Array<PoolModel>;
  storagePartners: Array<PartnerModel>;
  availableNetworks: Array<NetworkModel>;
  managePartners: PartnersModel;
  networksList: NetworksModel;
  unusedDisks: Array<DiskModel>;
  canCreate: boolean = false;

  @ViewChild("settingsContainer") settingsContainer: ElementRef;
  @ViewChild("unusedDisksContainer") unusedDisksContainer: ElementRef;
  @ViewChild("partnersContainer") partnersContainer: ElementRef;
  @ViewChild("networksContainer") networksContainer: ElementRef;
  @ViewChild(DynamicTabsetComponent) tabSet: DynamicTabsetComponent;
  @ViewChild(PartnerManageComponent)
  partnerManageComponent: PartnerManageComponent;
  @ViewChild(NetworkManageComponent)
  networkManageComponent: NetworkManageComponent;
  @ViewChild("storageOptions", { read: TemplateRef })
  storageOptionsTemplateRef: TemplateRef<any>;
  @ViewChild("diskOptions", { read: TemplateRef })
  diskOptionsTemplateRef: TemplateRef<any>;
  @ViewChild("partnerOptions", { read: TemplateRef })
  partnerOptionsTemplateRef: TemplateRef<any>;
  @ViewChild("activeDirectoryOptions", { read: TemplateRef })
  activeDirectoryOptionsTemplateRef: TemplateRef<any>;
  @ViewChild("preferenceOptions", { read: TemplateRef })
  preferenceOptionsTemplateRef: TemplateRef<any>;
  @ViewChild("networkManage", { read: TemplateRef })
  networkManageTemplateRef: TemplateRef<any>;
  @ViewChild(ActiveDirectoryComponent)
  activeDirectoryComponent: ActiveDirectoryComponent;
  @Output() cancelClick = new EventEmitter();

  public error: ErrorModel = null;
  public hideManagePanel = true;

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  model: StorageModel;
  selectedPool: PoolModel;
  selectedDisks: Array<String> = [];

  private tabs: DynamicTabEntry[];
  private infoTitle: string;
  private errorTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private textUseSSL: string;
  private textConfirm: string;
  private textCompression: string;
  private textDeduplication: string;
  // private textSyncWriteMode: string;
  private textEncryptionEnabled: string;
  private textConfirmUnregister: string;
  private textInitStarted: string;
  private textRescanComplete: string;
  private textDisksAdded: string;
  private textChangeSite: string;
  private textNotConnected: string;
  private textConnecting: string;
  // private textConfirmDisableSyncWrites: string;
  private textDownloadTitle: string;
  private textDownloadInitiatedMsg: string;
  private textAddPartner: string;
  private textDisks: string;
  private textOptions: string;
  private textPartners: string;
  private textActiveDirectory: string;
  private textPreferences: string;
  private textJoin: string;
  private textLeave: string;
  private textClose: string;

  private maskUnusedDisks: boolean = false;
  private maskSettings: boolean = false;
  private maskPartners: boolean = false;
  private maskNetworks: boolean = false;
  private settingsExpanded: boolean = false;
  private unusedDisksExpanded: boolean = false;
  private partnersExpanded: boolean = false;
  private networksExpanded: boolean = false;
  private encryption: boolean = undefined;
  private poolError: ErrorModel;
  private diskError: ErrorModel;
  private partnerError: ErrorModel;
  private networkError: ErrorModel;
  private storageItem: StorageModel;
  private setMaskActiveDirectory: boolean;
  private setMaskVsnapPreferences: boolean = false;
  private vsnapPreferenceData: any;

  constructor(
    private storageManageService: StorageManageService,
    private translateService: TranslateService,
    private siteService: SiteService,
    private helpService: HelpService,
    private vSvapService: vSnapPreferencesService
  ) {
    let paginationId: string = `storage-table-pagination-${new Date().valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({ id: paginationId });
  }

  ngOnInit() {
    let me = this,
      endpoint = me.storageManageService.getNodeServiceEndpoint();
    me.translateService.get("common.nodeService").subscribe((res: string) => {
      me.translateService
        .get(
          [
            "common.infoTitle",
            "common.errorTitle",
            "common.processingRequestMsg",
            "common.textConfirm",
            "common.textDownloadInitiatedMsg",
            "common.textClose",
            "storage.textDownloadLogs",
            "storage.registrationSucceedMsg",
            "storage.confirmUnregisterMsg",
            "storage.textCompression",
            "storage.textDeduplication",
            // 'storage.textSyncWriteMode',
            "storage.textEncryptionEnabled",
            "storage.initStartedMsg",
            "storage.rescanCompleteMsg",
            "storage.disksAddedMsg",
            "storage.textChangeSite",
            "storage.textNotConnected",
            "storage.textConnecting",
            "storage.textAddPartner",
            "storage.textUseSSL",
            "storage.textDisks",
            "storage.textOptions",
            "storage.textPartners",
            "storage.textActiveDirectory",
            "storage.textJoin",
            "storage.textLeave",
            "storage.textPreferences"
            // 'storage.textConfirmDisableSyncWrites'
          ],
          { service: res, endpoint: endpoint }
        )
        .subscribe((resource: Object) => {
          me.infoTitle = resource["common.infoTitle"];
          me.errorTitle = resource["common.errorTitle"];
          me.processingRequestMsg = resource["common.processingRequestMsg"];
          me.registrationSucceedMsg =
            resource["storage.registrationSucceedMsg"];
          me.textUseSSL = resource["storage.textUseSSL"];
          me.textConfirm = resource["common.textConfirm"];
          me.textConfirmUnregister = resource["storage.confirmUnregisterMsg"];
          me.textInitStarted = resource["storage.initStartedMsg"];
          me.textRescanComplete = resource["storage.rescanCompleteMsg"];
          me.textDisksAdded = resource["storage.disksAddedMsg"];
          me.textCompression = resource["storage.textCompression"];
          me.textDeduplication = resource["storage.textDeduplication"];
          // me.textSyncWriteMode = resource['storage.textSyncWriteMode'];
          me.textEncryptionEnabled = resource["storage.textEncryptionEnabled"];
          me.textChangeSite = resource["storage.textChangeSite"];
          me.textNotConnected = resource["storage.textNotConnected"];
          me.textConnecting = resource["storage.textConnecting"];
          // me.textConfirmDisableSyncWrites = resource['storage.textConfirmDisableSyncWrites'];
          me.textDownloadTitle = resource["storage.textDownloadLogs"];
          me.textDownloadInitiatedMsg =
            resource["common.textDownloadInitiatedMsg"];
          me.textAddPartner = resource["storage.textAddPartner"];
          me.textDisks = resource["storage.textDisks"];
          me.textOptions = resource["storage.textOptions"];
          me.textPartners = resource["storage.textPartners"];
          me.textActiveDirectory = resource["storage.textActiveDirectory"];
          me.textPreferences = resource["storage.textPreferences"];
          me.textJoin = resource["storage.textJoin"];
          me.textLeave = resource["storage.textLeave"];
          me.textClose = resource["common.textClose"];
          this.initTabs();
        });
    });

    me.errorHandler = SessionService.getInstance().context["errorHandler"];
    me.alert = SessionService.getInstance().context["msgbox.alert"];
    me.model = new StorageModel();
    me.selectedPool = new PoolModel();
    JsonConvert.valueCheckingMode = JsonConvert.ValueCheckingMode.ALLOW_NULL;
  }

  initTabs(): void {
    this.tabs = [
      {
        key: "storageOptions",
        title: this.textOptions,
        content: this.storageOptionsTemplateRef,
        refresh: false,
        active: true
      },
      {
        key: "diskOptions",
        title: this.textDisks,
        content: this.diskOptionsTemplateRef,
        refresh: false,
        active: false
      },
      {
        key: "networkManage",
        title: "Networks",
        content: this.networkManageTemplateRef,
        refresh: false,
        active: false
      },
      {
        key: "partnerOptions",
        title: this.textPartners,
        content: this.partnerOptionsTemplateRef,
        refresh: false,
        active: false
      },
      {
        key: "activeDirectoryOptions",
        title: this.textActiveDirectory,
        content: this.activeDirectoryOptionsTemplateRef,
        refresh: false,
        active: false
      },
      {
        key: "preferenceOptions",
        title: this.textPreferences,
        content: this.preferenceOptionsTemplateRef,
        refresh: false,
        active: false
      }
    ];
  }

  onSwitchMode(activeTab: DynamicTabEntry) {}

  info(errOrMsg: ErrorModel | string, title?: string) {
    let me = this;
    if (me.alert) {
      if (errOrMsg instanceof ErrorModel)
        me.alert.show(errOrMsg.title, errOrMsg.message, AlertType.ERROR);
      else me.alert.show(title || me.infoTitle, errOrMsg);
    }
  }

  confirm(item: StorageModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(
        me.textConfirm,
        SharedService.formatString(me.textConfirmUnregister, item.name),
        AlertType.CONFIRMATION,
        handler
      );
  }

  confirmEx(message: string, handlerOK: Function, handlerCancel: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(
        me.textConfirm,
        message,
        AlertType.CONFIRMATION,
        handlerOK,
        handlerCancel
      );
  }

  onManageClick(item: StorageModel) {
    let me = this;
    me.model = item.copy();
    me.hideManagePanel = false;
    me.loadPools(item);
    me.loadDisks(item);
    me.loadPartners(item);
    me.loadNetworks(item);
    me.storageItem = item;
    me.loadVsnapPreferences(item);
  }

  get showFullyQualifiedDomainName(): boolean {
    return (
      this.activeDirectoryComponent && !this.activeDirectoryComponent.isJoined()
    );
  }

  loadVsnapPreferences(item: StorageModel) {
    let me = this;
    this.setMaskVsnapPreferences = true;
    me.vSvapService.getVsnapPreferences(item).subscribe(
      response => {
        this.setMaskVsnapPreferences = false;
        this.vsnapPreferenceData = response;
      },
      error => {
        this.errorHandler.handle(error);
      }
    );
  }

  loadPools(item: StorageModel) {
    let me = this;
    me.maskSettings = true;
    me.storageManageService.getPools(item).subscribe(
      data => {
        me.maskSettings = false;
        // Cast the JSON object to PoolsModel instance.
        let dataset = JsonConvert.deserializeObject(data, PoolsModel);
        me.storagePools = <Array<PoolModel>>dataset.records;
        me.selectedPool = me.storagePools[0]; // spp 3.0, only have ability to manage one pool. UI needs heavy changes
        // me.selectedPool.init();
        me.encryption =
          me.selectedPool && me.selectedPool.encryption
            ? me.selectedPool.encryption["enabled"]
            : undefined;
        me.poolError = undefined;
      },
      err => {
        me.maskSettings = false;
        me.poolError = me.handleError(err);
      }
    );
  }

  loadDisks(item: StorageModel) {
    let me = this;
    me.maskUnusedDisks = true;
    me.storageManageService.getDisks(item).subscribe(
      data => {
        // Cast the JSON object to PoolsModel instance.
        let dataset = JsonConvert.deserializeObject(data, DisksModel);
        me.unusedDisks = <Array<DiskModel>>dataset.records;
        me.maskUnusedDisks = false;
        me.diskError = undefined;
      },
      err => {
        me.maskUnusedDisks = false;
        me.diskError = me.handleError(err);
      }
    );
  }

  loadPartners(item: StorageModel) {
    let me = this;
    me.maskPartners = true;
    me.storageManageService.getPartners(item).subscribe(
      data => {
        let dataset = JsonConvert.deserializeObject(data, PartnersModel);
        me.managePartners = dataset;
        me.storagePartners = <Array<PartnerModel>>dataset.records;
        me.storageManageService.updateRestoreItems();
        me.maskPartners = false;
        me.partnerError = undefined;
      },
      err => {
        me.maskPartners = false;
        me.partnerError = me.handleError(err);
      }
    );
  }

  loadNetworks(item: StorageModel) {
    let me = this;
    me.maskNetworks = true;
    me.storageManageService.getNetworks(item).subscribe(
      data => {
        me.maskNetworks = false;
        let dataset = JsonConvert.deserializeObject(data, NetworksModel);
        me.networksList = dataset;
        me.availableNetworks = <Array<NetworkModel>>dataset.records;
        me.storageManageService.updateRestoreItems();
        me.partnerError = undefined;
      },
      err => {
        me.maskNetworks = false;
        me.networkError = me.handleError(err);
      }
    );
  }

  onSettingsSaveClick(item: PoolModel) {
    let me = this;
    me.maskSettings = true;
    this.storageManageService.setPoolOptions(item).subscribe(
      data => {
        me.maskSettings = false;
        me.info("Updated settings for server " + me.model.name);
      },
      err => {
        me.maskSettings = false;
        me.handleError(err);
      }
    );
  }

  onAssignDisksSaveClick() {
    let me = this;

    me.maskUnusedDisks = true;
    this.storageManageService
      .expandPool(me.selectedPool, { disk_list: me.selectedDisks })
      .subscribe(
        data => {
          me.maskUnusedDisks = false;
          me.loadPools(me.model);
          me.loadDisks(me.model);
          me.info(
            SharedService.formatString(
              me.textDisksAdded,
              me.selectedDisks.length
            )
          );
          me.selectedDisks = [];
        },
        err => {
          me.maskUnusedDisks = false;
          me.handleError(err);
        }
      );
  }

  setDiskSelected(selected: DiskModel) {
    var index = this.selectedDisks.indexOf(selected.uuid);
    if (index === -1) {
      this.selectedDisks.push(selected.uuid);
    } else {
      this.selectedDisks.splice(index, 1);
    }
  }

  handleError(err: any, node?: boolean): ErrorModel {
    let me = this,
      result: ErrorModel;
    if (me.errorHandler) result = me.errorHandler.handle(err, node);
    return result;
  }

  onHelpClick(page: string) {
    SharedService.openUrl(this.helpService.getHelp(page), "");
  }

  onCancelClick() {
    this.switchPartnersContainer();
    this.switchNetworksContainer();
    this.switchUnusedDisksContainer();
    this.switchSettingsContainer();
    this.cancelClick.emit();
  }

  onDownloadLogsClick() {
    let me = this,
      storageId = me.model.storageId,
      baseUrl = me.storageManageService.getEcxApiEndpoint();
    SessionService.getInstance().context["downloader"].download(
      baseUrl +
        "/" +
        storageId +
        "/management/logcollect?esessionid=" +
        SessionService.getInstance().sessionId
    );
    if (me.alert)
      me.alert.show(me.textDownloadTitle, me.textDownloadInitiatedMsg);
  }

  private getSettingsContainer(): any {
    let me = this,
      element = me.settingsContainer && me.settingsContainer.nativeElement;
    return element;
  }

  private getUnusedDisksContainer(): any {
    let me = this,
      element =
        me.unusedDisksContainer && me.unusedDisksContainer.nativeElement;
    return element;
  }

  private getPartnersContainer(): any {
    let me = this,
      element = me.partnersContainer && me.partnersContainer.nativeElement;
    return element;
  }

  private getNetworksContainer(): any {
    let me = this,
      element = me.networksContainer && me.networksContainer.nativeElement;
    return element;
  }

  private switchSettingsContainer(): void {
    let me = this,
      element = me.getSettingsContainer();
    if (element) {
      $(element).toggle();
      this.settingsExpanded = !this.settingsExpanded;
    }
  }

  private switchUnusedDisksContainer(): void {
    let me = this,
      element = me.getUnusedDisksContainer();
    if (element) {
      $(element).toggle();
      this.unusedDisksExpanded = !this.unusedDisksExpanded;
    }
  }

  private switchPartnersContainer(): void {
    let me = this,
      element = me.getPartnersContainer();
    if (element) {
      $(element).toggle();
      this.partnersExpanded = !this.partnersExpanded;
    }
  }

  private switchNetworksContainer(): void {
    let me = this,
      element = me.getNetworksContainer();
    if (element) {
      $(element).toggle();
      this.networksExpanded = !this.networksExpanded;
    }
  }

  private onSaveNetworkSettings(): void {
    let me = this;
    me.networkManageComponent.saveNetworkSettings();
  }

  private checkNetworkStatus(): boolean {
    return (
      this.networkManageComponent && this.networkManageComponent.isDisabled()
    );
  }

  // private onChangeSyncWrite(): void {
  //   let me = this;
  //   if (!me.selectedPool.syncWrite) {
  //     me.confirmEx(me.textConfirmDisableSyncWrites, function() {
  //     }, function() {
  //       me.selectedPool.syncWrite = true;
  //     });
  //   }
  // }

  private get disableDiskBtn(): boolean {
    if (!!this.diskError) {
      return true;
    } else if (Array.isArray(this.selectedDisks) && this.selectedPool) {
      return this.selectedDisks.length < this.selectedPool.diskgroupSize;
    }
    return !this.selectedPool;
  }

  // private isMaxStreamsValid(): boolean {
  //   let me = this;
  //   if (me.selectedPool && me.selectedPool.selectedStreamValue === 1 && this.selectedPool.streamValue < 1) {
  //     return false;
  //   }
  //   return true;
  // }

  // private onHandleKeyDown(key: KeyboardEvent) {
  //   return !(key.key === '.' || key.keyCode === 46 || key.which === 46);
  // }

  private maskActiveDirectory(event: boolean) {
    this.setMaskActiveDirectory = event;
  }
}
