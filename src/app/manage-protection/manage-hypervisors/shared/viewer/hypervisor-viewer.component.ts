import {
  Component,
  ViewChild,
  TemplateRef,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter, AfterViewInit
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {RbacModel} from 'shared/rbac/rbac.model';
import {SharedService} from 'shared/shared.service';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {JobModel} from 'job/shared/job.model';
import {Subject} from 'rxjs/Subject';
import {HypervisorTableComponent} from '../';
import {HypervisorBackupService} from 'hypervisor/backup/hypervisor-backup.service';
import {HypervisorBrowseService} from 'hypervisor/shared/hypervisor-browse.service';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {SlapoliciesModel} from 'slapolicy/shared/slapolicies.model';
import {SlapolicyService} from 'slapolicy/shared/slapolicy.service';

export class BreadcrumbExModel extends BreadcrumbModel {
  constructor(public title: string,
              public url: string,
              public resource?: BaseHypervisorModel) {
    super(title, url, resource);
  }
}

@Component({
  selector: 'hypervisor-viewer',
  templateUrl: './hypervisor-viewer.component.html',
  styleUrls: ['./hypervisor-viewer.component.scss'],
  providers: [
    HypervisorBackupService
  ]
})
export class HypervisorViewerComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() model: HypervisorModel;
  @Input() textBackToTarget: string;
  @Input() view: NvPairModel;
  @Output() backTo = new EventEmitter();
  @Output() onAssignPolicy = new EventEmitter<BaseHypervisorModel>();
  @Output() onEditRunSettings = new EventEmitter<BaseHypervisorModel>();

  dropdownSettings: Object;
  breadcrumbs: Array<BreadcrumbExModel>;

  public isScriptServerOnly: boolean = true;

  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(HypervisorTableComponent) table: HypervisorTableComponent;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  views: Array<NvPairModel> = [];
  slas: Array<NvPairModel> = [];
  sla: NvPairModel;
  filters: Array<FilterModel> = [];
  namePattern: string = '';

  protected navigateRootPending: boolean = false;
  protected viewReady: boolean = false;

  private textTestResultTpl: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textVmAndTemplates: string;
  private textVMs: string;
  private textDatastore: string;
  private textVMCategoryTagView: string;
  private textHostsAndClustersView: string;
  private textAllSla: string;
  private textConfirm: string;
  private textSwitchView: string;

  private warningTitle: string;
  private textSelectAtLeastOneResource: string;
  private textSelectCredentials: string;
  private textSearchFor: string;
  private textUnProtectedVMs: string;
  private textAllResources: string;
  private textManageServer: string;
  private textManageVCenter: string;
  private textManageEC2: string;
  private textRerunSlaInit: string;

  private textLastInventoryAt: string;
  private textAuto: string;

  // Options values
  private subs: Subject<void> = new Subject<void>();

  private inventoryJob: JobModel;
  private forceRunPending: boolean = false;
  private masked: boolean = false;
  private searchCategory: boolean = false;
  private textRerun: string;
  private textClearSelectionsTpl: string = '';
  private textInfo: string;
  private textWarning: string;
  private textDetail: string;
  private textError: string;
  private textSummary: string;

  get hypervisorType(): string {
    return this.model ? this.model.type : '';
  }

  private get inventoryInProgress(): boolean {
    return this.forceRunPending ||
      (this.inventoryJob && this.inventoryJob.status !== 'IDLE' && this.inventoryJob.status !== 'HELD');
  }

  private get isVMsView(): boolean {
    return (this.view && this.view.value === 'vms');
  }

  private get filterEnabled(): boolean {
    return (this.isVMsView || this.namePattern) && this.vmbrowseService && this.vmbrowseService.inVmLevel;
  }

  constructor(private translate: TranslateService,
              private policyService: SlapolicyService,
              private vmbrowseService: HypervisorBrowseService) {
    this.breadcrumbs = this.vmbrowseService.breadcrumbs as Array<BreadcrumbExModel>;
  }

  get title(): string {
    return this.model ? this.model.name : '';
  }

  get subtitle(): string {
    return this.isVMware() ? 'vmware.textTitle' : (this.isHyperV() ? 'hyperv.textTitle' : 'awsec2.textTitle');
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string | TemplateRef<any>, title?: string, type?: AlertType, fn?: Function) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message, type, fn);
    }
  }

  confirm(message: string, handler: Function) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onUnProtectedVMsClick(): void {
    let me = this, index;

    // Remove the storageProfileName filter if existing
    index = me.filters.findIndex(function (flt) {
      return flt.property === 'storageProfileName';
    });
    if (index !== -1) {
      // Remove storageProfileName filter from filters.
      me.filters.splice(index, 1);
    }

    index = me.filters.findIndex(function (item) {
      return item.property === 'unprotected';
    });
    if (index !== -1) {
      // Set the value of unprotected filter to true.
      me.filters[index].value = true;
    } else {
      // Add filter to get unprotected vms.
      me.filters.push(new FilterModel('unprotected', true));
    }
    me.startSearch(me.inSearchResultView(), me.getSearchPattern());
  }

  onAllClick(): void {
    let me = this, crumb = me.vmbrowseService.currentBreadcrumb();
    if (me.searchBarComponent) {
      me.searchBarComponent.reset();
    }
    // Empty name pattern.
    me.namePattern = undefined;
    if (me.isVMsView) {
      me.clearFilter();
      me.startSearch(true);
    } else {
      if (crumb) {
        me.clearFilter();
        me.onBreadcrumbClick(crumb);
      }
    }
  }

  onViewClick(item: NvPairModel): void {
    let me = this, handler;
    if (me.view.value !== item.value) {
      handler = function () {
        let crumb;
        me.namePattern = '';
        if (me.searchBarComponent)
          me.searchBarComponent.reset();

        me.searchCategory = false;
        me.view = item;
        crumb = me.vmbrowseService.firstBreadcrumb();
        if (me.table) {
          me.table.setView(item);
        }
        if (crumb)
          me.onBreadcrumbClick(crumb);
      };
      if (me.hasResourceSelection())
        me.confirm(me.textSwitchView, handler);
      else
        handler();
    }
  }

  onSlaClick(item: NvPairModel): void {

    let me = this, index;
    if (me.sla.value !== item.value) {
      me.sla = item;
      if (item.value === 'unprotected') {
        me.onUnProtectedVMsClick();
      } else if (item.value === 'all') {
        this.onAllClick();
      } else {
        // Remove the unprotected filter if existing
        index = me.filters.findIndex(function (flt) {
          return flt.property === 'unprotected';
        });
        if (index !== -1) {
          // Remove unprotected filter from filters.
          me.filters.splice(index, 1);
        }
        index = me.filters.findIndex(function (flt) {
          return flt.property === 'storageProfileName';
        });
        if (index !== -1) {
          if (item.value) {
            me.filters[index].value = item.value;
          } else {
            // Remove storageProfileName filter from filters.
            me.filters.splice(index, 1);
          }
        } else if (item.value) {
          me.filters.push(new FilterModel('storageProfileName', item.value));
        }
        me.startSearch(true, me.getSearchPattern());
      }
    }
  }

  inSearchResultView(): boolean {
    return this.table && this.table.inSearchResultView();
  }

  isTagView(): boolean {
    return this.table && this.table.isTagView();
  }

  onClearSearch() {
    let me = this, crumb = me.vmbrowseService.firstBreadcrumb();
    if (crumb)
      me.onBreadcrumbClick(crumb);
  }

  startSearch(force?: boolean, namePattern?: string): void {
    let me = this, crumb;

    if (namePattern !== undefined)
      me.namePattern = namePattern;

    let removeAllFilters = !(me.namePattern && me.namePattern.length > 0);
    if (!force && removeAllFilters) {
      // Note: the search api supports unprotected filter now.
      crumb = me.vmbrowseService.currentBreadcrumb();
      if (crumb)
        me.onBreadcrumbClick(crumb);
    } else {
      if (me.table) {
        me.table.setFilters(me.filters);
        me.table.setSearchCategory(me.searchCategory);
        me.table.searchVms(me.namePattern);
      }
    }
  }

  ngAfterViewInit(): void {
    let me = this;
    if (me.navigateRootPending) {
      me.navigateRootPending = false;
      setTimeout(() => {
        me.navigateRoot();
      }, 10);
    }
    me.viewReady = true;
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
    SharedService.maximizeContent(true, false, true);
  }

  ngOnInit() {
    let me = this;
    SharedService.maximizeContent();
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    me.dropdownSettings = {
      singleSelection: false,
      enableSearchFilter: false,
      enableCheckAll: false
    };

    me.translate.get([
      'common.infoTitle',
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textRerun',
      'common.textRerunSelection',
      'common.textClearSelectionsTpl',
      'common.textInfo',
      'common.textDetail',
      'common.textError',
      'common.textWarning',
      'common.textSummary',
      'common.warningTitle',
      'job.textRerunSlaInit',
      'hypervisor.textAuto',
      'hypervisor.textVmAndTemplates',
      'hypervisor.textVMs',
      'hypervisor.textDatastore',
      'hypervisor.textAllSla',
      'hypervisor.textSwitchView',
      'vmware.textSearchForVMsAndFolders',
      'hypervisor.textUnProtectedVMs',
      'inventory.textAllResources',
      'awsec2.textManageEC2',
      'vmware.textTitle',
      'vmware.textManageVCenter',
      'hyperv.textManageServer',
      'hyperv.textTitle',
      'hypervisor.textSelectAtLeastOneResource',
      'hypervisor.textSelectCredentials',
      'hypervisor.textLastInventoryAt',
      'hypervisor.textVMCategoryTagView',
      'hypervisor.textHostsAndClustersView',
      'hypervisor.textTestResultTpl']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textManageServer = resource['hyperv.textManageServer'];
        me.textManageVCenter = resource['vmware.textManageVCenter'];
        me.textManageEC2 = resource['awsec2.textManageEC2'];
        me.textInfo = resource['common.textInfo'];
        me.textWarning = resource['common.textWarning'];
        me.textDetail = resource['common.textDetail'];
        me.textError = resource['common.textError'];
        me.textSummary = resource['common.textSummary'];

        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textVmAndTemplates = resource['hypervisor.textVmAndTemplates'];
        me.textVMs = resource['hypervisor.textVMs'];
        me.textDatastore = resource['hypervisor.textDatastore'];
        me.textAllSla = resource['hypervisor.textAllSla'];
        me.textSwitchView = resource['hypervisor.textSwitchView'];
        me.warningTitle = resource['common.warningTitle'];
        me.textSelectAtLeastOneResource = resource['hypervisor.textSelectAtLeastOneResource'];
        me.textSelectCredentials = resource['hypervisor.textSelectCredentials'];
        me.textAuto = resource['hypervisor.textAuto'];
        me.textRerunSlaInit = resource['job.textRerunSlaInit'];

        me.textSearchFor = resource['vmware.textSearchForVMsAndFolders'];
        me.textUnProtectedVMs = resource['hypervisor.textUnProtectedVMs'];
        me.textAllResources = resource['inventory.textAllResources'];

        me.textLastInventoryAt = resource['hypervisor.textLastInventoryAt'];
        me.textVMCategoryTagView = resource['hypervisor.textVMCategoryTagView'];
        me.textHostsAndClustersView = resource['hypervisor.textHostsAndClustersView'];
        me.textTestResultTpl = resource['hypervisor.textTestResultTpl'];
        me.textRerun = resource['common.textRerunSelection'];

        me.textClearSelectionsTpl = resource['common.textClearSelectionsTpl'];

        // Initialize views & slas.
        if (!me.isHyperV()) {
          me.views.push(new NvPairModel(me.textVmAndTemplates, 'vmview'));
        }
        me.views.push(
          new NvPairModel(me.textVMs, 'vms'),
          new NvPairModel(me.textDatastore, 'storageview'));

        if (!me.isHyperV()) {
          me.views.push(new NvPairModel(me.textVMCategoryTagView, 'tagview'));
          me.views.push(new NvPairModel(me.textHostsAndClustersView, 'hostview'));
        }
        me.view = me.view || me.views[0];

        // Update all & unprotected labels. SPP-5920.
        (me.slas || []).forEach(function (sla) {
          if (sla.value === 'unprotected')
            sla.name = me.textUnProtectedVMs;
          else if (sla.value === 'all')
            sla.name = me.textAllResources;
        });
      });
    me.loadPolicies();
  }

  onBreadcrumbClick(item: BreadcrumbModel, event?: any) {
    let me = this, topLevel: boolean;

    if (me.table) {
      topLevel = me.isTopLevel(item);
      if (!me.filterEnabled || topLevel) {
        if (me.searchBarComponent)
          me.searchBarComponent.reset();
        me.clearFilter();
      }
      me.table.setView(me.view);
      me.table.setFilters(me.filters);
      if (item.resource && !topLevel)
        me.table.navigate(item.resource as BaseHypervisorModel, event);
      else
        me.table.loadData(true);
    }
  }

  onLoad(resources: BaseHypervisorModel[]): void {
    let me = this;
    if (me.viewReady)
      me.navigateRoot(resources);
    else
      me.navigateRootPending = true;
  }

  navigateRoot(resources?: BaseHypervisorModel[]): void {
    let me = this, model = me.model,
      crumb: BreadcrumbModel,
      target: BaseHypervisorModel;

    if (!resources)
      resources = me.table ? me.table.records : [];
    target = (resources || []).find(function (item) {
      return item.id === model.id && item.type === model.type;
    });
    if (me.table && target) {
      crumb = me.vmbrowseService.firstBreadcrumb();
      me.vmbrowseService.resetBreadcrumbs(crumb);
      me.table.navigate(target);
    }
  }

  onPoliciesLoad(policies: Array<SlapolicyModel>): void {

    let me = this, hasPolicy = policies && policies.length > 0;
    me.slas.splice(0);
    me.slas.push(new NvPairModel(me.textAllResources, 'all'));
    me.slas.push(new NvPairModel(me.textUnProtectedVMs, 'unprotected'));
    if (hasPolicy) {
      policies.forEach(function (item) {
        let idx = me.slas.findIndex(function (sla) {
          return sla.name === item.name;
        });
        if (idx === -1)
          me.slas.push(new NvPairModel(item.name, item.name));
      });
    }
    me.sla = me.slas[0];
  }

  onBackToClick(): void {
    this.backTo.emit();
  }

  hasResourceSelection(): boolean {
    return false;
  }

  loadPolicies() {
    let me = this;
    me.policyService.getSLAPolicies(undefined, undefined, 0).takeUntil(me.subs).subscribe(
      data => {
        // Cast the JSON object to DatasetModel instance.
        let dataset = JsonConvert.deserializeObject(data, SlapoliciesModel);
        me.onPoliciesLoad(dataset.records);
      },
      err => {
        me.handleError(err, true);
      }
    );
  }

  onClickAssignPolicy(item: BaseHypervisorModel): void {
    this.onAssignPolicy.emit(item);
  }

  onClickEditRunSettings(item: BaseHypervisorModel): void {
    this.onEditRunSettings.emit(item);
  }

  private isTopLevel(item: BreadcrumbModel): boolean {
    return item && !item.resource || item.resource.resourceType === 'hypervisor';
  }

  private clearFilter(): void {
    let me = this;
    // Clear filters.
    if (me.filters.length > 0)
      me.filters.splice(0);

    if (me.slas && me.slas.length > 0)
      me.sla = me.slas[0];
  }

  private refreshResourceTable(): void {
    let me = this;
    if (me.table)
      me.table.onRefresh();
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private isVMware(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_VMWARE;
  }

  private isAwsec2(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_AWSEC2;
  }

  private getManageLabel(): string {
    if (this.isVMware()) {
      return this.textManageVCenter;
    } else if (this.isAwsec2()) {
      return this.textManageEC2;
    } else if (this.isHyperV()) {
      return this.textManageServer;
    } else {
      return 'Manage';
    }
  }

  private refreshJobDisplayFields(target: JobModel, updated: JobModel): void {
    let inProgress = this.inventoryInProgress;
    target.name = updated.name;
    target.type = updated.type;
    target.status = updated.status;
    target.typeDisplayName = updated.typeDisplayName;
    target.statusDisplayName = updated.statusDisplayName;
    target.nextFireTime = updated.nextFireTime;
    target.lastRunTime = updated.lastRunTime;
    target.lastSessionDuration = updated.lastSessionDuration;
    target.lastSessionStatus = updated.lastSessionStatus;
    target.lastSessionStatusDisplayName = updated.lastSessionStatusDisplayName;
    target.links = updated.links;

    if (inProgress && !this.inventoryInProgress) {
      // Issue a refresh of the backup table when the inventory job finished, i.e. the state changes from
      // Inventory in progress to done (Run Inventory).
      this.refreshResourceTable();
    }
  }

  private doAction(item: JobModel, name: string, successCallback?: Function, failCallback?: Function): void {
    let me = this, observable = item.doAction<JobModel>(JobModel, name);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        updated => {
          me.refreshJobDisplayFields(item, updated);
          if (successCallback)
            successCallback.call(me);
        },
        err => {
          me.handleError(err);
          if (failCallback)
            failCallback.call(me);
        }
      );
    else {
      if (failCallback)
        failCallback.call(me);
    }
  }

  private getSearchPattern(): string {
    let me = this;
    return (me.searchBarComponent && me.searchBarComponent.pattern !== '') ? me.searchBarComponent.pattern : '*';
  }
}
