import {Component, OnInit, ViewChild, ElementRef, Renderer, OnDestroy, TemplateRef, forwardRef} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {VmselectbackupTableComponent} from './vmselectbackup-table/vmselectbackup-table.component';
import {HypervisorBrowseService} from '../shared/hypervisor-browse.service';
import { SessionService, ScreenId } from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {BaseModel} from 'shared/models/base.model';
import {BaseHypervisorModel} from '../shared/base-hypervisor.model';
import {HypervisorBackupService} from './hypervisor-backup.service';
import {HypervisorModel} from '../shared/hypervisor.model';
import {RbacModel} from 'shared/rbac/rbac.model';
import {SharedService} from 'shared/shared.service';
import {HypervisorBackupOptionsModel} from '../shared/hypervisor-backup-options.model';
import {IdentityUserModel} from 'identity/shared/identity-user.model';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {PolicyStatusTableComponent}
  from 'slapolicy/shared/policyStatusTable/policyStatusTable.component';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {JobModel} from 'job/shared/job.model';
import {JobsModel} from 'job/shared/jobs.model';
import { Subject } from 'rxjs/Subject';
import {ConfigGroupsTestTaskModel} from 'shared/models/config-groups.model';
import {ConfigGroupsComponent} from 'shared/components/config-groups/config-groups.component';
import {PolicySelectTableComponent} from 'slapolicy/shared/policySelectTable/index';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {
  HypervisorBackupOptionsComponent
} from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options.component';
import { BaseModalComponent } from 'shared/components/base-modal/base-modal.component';
import {JobWizardComponent} from 'wizard/job-wizard.component';
import {WizardAllowedCategory} from 'shared/components/wizard/wizard-registry';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from 'wizard/snapshot-restore/snapshot-restore-wizard.model';
import {WIZARD_CATEGORY_BACKUP} from 'wizard/on-demand-backup/backup-wizard.model';
import {Workflow} from 'shared/components/wizard/wizard.model';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../../global.state';

@Component({
  selector: 'hypervisor-backup',
  templateUrl: './hypervisor-backup.component.html',
  styleUrls: ['./hypervisor-backup.component.scss'],
  providers: [
    HypervisorBackupService
  ]
})
export class HypervisorBackupComponent extends RefreshSameUrl {

  hypervisorType: string;
  cardTitle: string;

  vmbrowseService: HypervisorBrowseService;


  selectableLogTypes: Array<any>;
  selectedLogTypes: Array<any>;
  jobLogTypes: string[];
  dropdownSettings: Object;
  logFilters: Array<FilterModel>;

  breadcrumbs: Array<any>;

  public isScriptServerOnly: boolean = true;

  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(VmselectbackupTableComponent) vmselectbackupTable: VmselectbackupTableComponent;
  @ViewChild(PolicySelectTableComponent) policySelectTable: PolicySelectTableComponent;
  @ViewChild('collapsevmoptions') vmoptionsCollapseRef: ElementRef;
  @ViewChild('collapseapplypolicy') policyCollapseRef: ElementRef;
  @ViewChild(BaseModalComponent) rerunModal: BaseModalComponent;
  // @ViewChild(IdentityUserEnterSelectComponent) userEsRef: IdentityUserEnterSelectComponent;
  @ViewChild(PolicyStatusTableComponent) policyStatusTable: PolicyStatusTableComponent;
  @ViewChild(ConfigGroupsComponent) configGroupsComponent: ConfigGroupsComponent;
  @ViewChild(HypervisorBackupOptionsComponent) hypervisorOptionsComponent: HypervisorBackupOptionsComponent;

  @ViewChild(forwardRef(() => JobWizardComponent)) wizard: JobWizardComponent;

  testResult: ConfigGroupsTestTaskModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  views: Array<NvPairModel> = [];
  view: NvPairModel;
  slas: Array<NvPairModel> = [];
  sla: NvPairModel;
  filters: Array<FilterModel> = [];
  namePattern: string = '';

  private selectedSingleModel: BaseHypervisorModel;
  private selectedPolicyNames: string[];
  private textTestResultTpl: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textVmAndTemplates: string;
  private textVMs: string;
  private textDatastore: string;
  private textVMCategoryTagView: string;
  private textHostsAndClustersView: string;
  private textAllSla: string;
  private textGold: string = 'Gold';
  private textSilver: string = 'Silver';
  private textBronze: string = 'Bronze';
  private textConfirm: string;
  private textSwitchView: string;
  private enableExclusion: boolean = false;
  private targetUnprotectedBtn: any;
  private warningTitle: string;
  private textSelectAtLeastOneResource: string;
  private textSelectCredentials: string;
  private textSearchFor: string;
  private textUnProtectedVMs: string;
  private textAllVMs: string;
  private textManageServer: string;
  private textManageVCenter: string;
  private textManageEC2: string;
  private textRerunSlaInit: string;
  private selectedRerunSla: string;
  private selectedRerunVm: BaseHypervisorModel;
  // Removed
  // private textTempSnapshot: string;
  // private textMakeVMSnapshotPermanent: string;
  // private tempVMwareSnapshot: boolean = true;
  // private makeVMSnapshotPermanent: boolean = false;

  // Options Labels
  // private textMaxConcurrentSnapshot: string;
  private textLastInventoryAt: string;
  private textAuto: string;

  // Options values
  private enableFH: boolean = false;
  private subs: Subject<void> = new Subject<void>();

  private userType: string = IdentityUserModel.TYPE_SYSTEM;
  private userInfo: IdentityUserEnterSelectModel;
  private inventoryJob: JobModel;
  private forceRunPending: boolean = false;
  private maskSlaPolicy: boolean = false;
  private maskVADPs: boolean = true;
  private maskOptions: boolean = false;
  private masked: boolean = false;
  private testAborted: boolean = false;
  private searchCategory: boolean = false;
  private testPending: boolean = false;
  private textRerun: string;
  private textClearSelectionsTpl: string = '';
  private textInfo: string;
  private textWarning: string;
  private textDetail: string;
  private textError: string;
  private textSummary: string;
  private isPoliciesLengthZero: boolean = false;

  private logTyps: Array<any> = [
    {id: 0, itemName: 'INFO', value: 'INFO'},
    {id: 1, itemName: 'WARN', value: 'WARN'},
    {id: 2, itemName: 'ERROR', value: 'ERROR'},
    {id: 3, itemName: 'DETAIL', value: 'DETAIL'},
    {id: 4, itemName: 'SUMMARY', value: 'SUMMARY'}
  ];

  private isCreatingRestoreJob: boolean = false;
  private subType: string;

  get textBackToTarget(): string {
    if (this.isHyperV()) {
      return 'menubar.submenu.textHyperv';
    } else if (this.isVMware()) {
      return 'menubar.submenu.textVMware'
    } else if (this.isAwsec2()) {
      return 'menubar.submenu.textAWSEC2'
    }
  }

  get allowedCategories(): WizardAllowedCategory[] {
    return [
      {type: WIZARD_CATEGORY_SNAPSHOT_RESTORE, subType: this.hypervisorType as Workflow},
      {type: WIZARD_CATEGORY_BACKUP, subType: this.hypervisorType as Workflow}
    ];
  }

  get textClearSelections(): string {
    return SharedService.formatString(this.textClearSelectionsTpl, this.resourceSelectionCount());
  }

  get showCreateRestoreJobButton(): boolean {
    let instance = SessionService.getInstance();
    let me = this;
    if (me.isHyperV()) {
      return instance.hasScreenPermission(ScreenId.HYPERV_RESTORE);
    } else if (me.isVMware()) {
      return instance.hasScreenPermission(ScreenId.VMWARE_RESTORE);
    } else if (me.isAwsec2()){
      return instance.hasScreenPermission(ScreenId.AWSEC2_RESTORE)
    }
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

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService,
              private _vmbrowse: HypervisorBrowseService,
              private vmbackupService: HypervisorBackupService,
              private renderer: Renderer) {
    super(globalState, route);
    this.vmbrowseService = _vmbrowse;
    this.breadcrumbs = this.vmbrowseService.breadcrumbs;
    this.hypervisorType = route.snapshot.data['hypervisorType'] || HypervisorModel.TYPE_VMWARE;
    this.cardTitle = route.snapshot.data['cardTitle'] || '';
  }

  protected onRefreshSameUrl(): void {
    this.onWizardCancel();
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  maskScreen() {
    let me = this;
    if (me.alert) {
      me.alert.show('', me.processingRequestMsg, AlertType.MASK);
    }
  }

  unmaskScreen() {
    let me = this;
    if (me.alert)
      me.alert.hide();
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

        me.emptyResourceSelection();

        me.searchCategory = false;
        me.view = item;
        crumb = me.vmbrowseService.firstBreadcrumb();
        if (me.vmselectbackupTable) {
          me.vmselectbackupTable.setView(item);
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
    // console.log('onSlaClick');
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
    return this.vmselectbackupTable && this.vmselectbackupTable.inSearchResultView();
  }

  isTagView(): boolean {
    return !!(this.vmselectbackupTable && this.vmselectbackupTable.isTagView());
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
      if (me.vmselectbackupTable) {
        me.emptyResourceSelection();
        me.vmselectbackupTable.setFilters(me.filters);
        me.vmselectbackupTable.setSearchCategory(me.searchCategory);
        me.vmselectbackupTable.searchVms(me.namePattern);
      }
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.setJobLogTypes(this.jobLogTypes);
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;

    super.ngOnInit();

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    me.dropdownSettings = {
      singleSelection: false,
      enableSearchFilter: false,
      enableCheckAll: false
    };

    me.selectableLogTypes = me.getLogTypeDropdownList();
    me.jobLogTypes = me.getJobLogTypes();
    me.jobLogTypes = me.jobLogTypes || ['INFO', 'WARN', 'ERROR', 'SUMMARY'];
    me.selectedLogTypes = me.getLogTypeInitSelectedList();
    me.logFilters = me.getLogFilter();

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
      'hypervisor.textSearchFor',
      'hypervisor.textUnProtectedVMs',
      'hypervisor.textAllVMs',
      'awsec2.textAllInstances',
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
        me.initLogFilter();
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

        me.textSearchFor = resource['hypervisor.textSearchFor'];
        me.textUnProtectedVMs = resource['hypervisor.textUnProtectedVMs'];
        me.textAllVMs = this.isAwsec2() ? resource['awsec2.textAllInstances'] : resource['hypervisor.textAllVMs'];

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
        me.view = me.views[0];

        // Update all & unprotected labels. SPP-5920.
        (me.slas || []).forEach(function (sla) {
          if (sla.value === 'unprotected')
            sla.name = me.textUnProtectedVMs;
          else if (sla.value === 'all')
            sla.name = me.textAllVMs;
        });
      });
    me.userInfo = new IdentityUserEnterSelectModel();
    me.refreshInventory();
    if (me.isHyperV()) {
      me.subType = HypervisorModel.TYPE_HYPERV;
    } else if (me.isAwsec2()) {
      me.subType = HypervisorModel.TYPE_AWSEC2;
    } else if (me.isVMware()) {
      me.subType = HypervisorModel.TYPE_VMWARE;
    }
  }

  onBreadcrumbClick(item: any, event?: any) {
    let me = this;

    if (me.vmselectbackupTable) {
      if (!me.filterEnabled || me.isTopLevel(item)) {
        if (me.searchBarComponent)
            me.searchBarComponent.reset();
        me.clearFilter();
      }
      me.vmselectbackupTable.setView(me.view);
      me.vmselectbackupTable.setFilters(me.filters);
      if (item.resource) {
        me.vmselectbackupTable.navigate(item.resource, event);
      } else
        me.vmselectbackupTable.loadData(true, true);
    }
  }

  onApplyPolicyClick(): void {
    let me = this, resources = me.getResourceSelection(),
      policies = me.getPolicySelection();
    if (resources.length > 0) {
      // Apply SLA policies.
      me.maskSlaPolicy = true;
      me.vmbackupService.applyPolicies(me.hypervisorType, resources, policies).takeUntil(me.subs)
        .subscribe(
        success => {
          me.maskSlaPolicy = false;
        },
        err => {
          me.maskSlaPolicy = false;
          me.handleError(err, true);
        },
        () => {
          me.resetOptions();
          me.emptyPolicySelection();
          me.refreshResourceTable();
          me.refreshPolicyStatusTable();
        }
      );
    } else {
      me.info(me.textSelectAtLeastOneResource, me.warningTitle, AlertType.WARNING);
    }
  }

  onLoadVADPs(mask: boolean) {
    this.maskVADPs = mask;
  }

  onApplyOptionsClick(test?: boolean): void {
    let me = this, resources = me.getResourceSelection(),
      options = me.hypervisorOptionsComponent.getOptions(),
      userInfo = me.hypervisorOptionsComponent.getUserInfo(), username;

    if (me.enableFH){
      username = userInfo.useExisting ? userInfo.userHref : userInfo.username || undefined;
      if (username === undefined || username === '') {
        me.info(me.textSelectCredentials, me.warningTitle, AlertType.WARNING);
        return;
      }
    }
    if (resources.length > 0) {
      // Apply options.
      me.maskOptions = true;
      me.vmbackupService.applyOptions(resources, options, me.hypervisorType).takeUntil(me.subs)
        .subscribe(
        success => {
          me.maskOptions = false;
          if (!test)
            me.hypervisorOptionsComponent.setOptions();
        },
        err => {
          me.maskOptions = false;
          me.handleError(err, true);
        },
        () => {
          if (!test) {
            me.resetOptions();
            me.emptyPolicySelection();
          }
          me.testPending = !!test;
          if (!me.userInfo.useExisting) {
            // New user may have been created so need to reload users for prepopulating & selecting later.
            me.hypervisorOptionsComponent.reloadUsers();
          }
        }
      );
    } else {
      me.info(me.textSelectAtLeastOneResource, me.warningTitle, AlertType.WARNING);
    }
  }

  onLoadUsers(event?: any): void {
    let me = this;
    if (me.testPending) {
      me.testPending = false;
      me.loadOptions(me.selectedSingleModel, true);
    }
  }

  onPoliciesLoad(policies: Array<SlapolicyModel>): void {
    if(policies != null && policies.length === 0) {
      this.isPoliciesLengthZero = true;
    }
    let me = this, hasPolicy = policies && policies.length > 0;
    me.slas.splice(0);
    me.slas.push(new NvPairModel(me.textAllVMs, 'all'));
    me.slas.push(new NvPairModel(me.textUnProtectedVMs, 'unprotected'));
    // <a class="dropdown-item" (click)="onAllClick()">No filter</a>
    // <a class="dropdown-item" (click)="onUnProtectedVMsClick($event)" translate>
    // {{'hypervisor.textUnProtectedVMs'}}
    // </a>

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

  onSelectionChangeEvent() {
    this.resetOptions();
  }

  resetOptions() {
    let me = this, selection = me.getResourceSelection(), singleSelected = (selection && selection.length === 1);
    me.selectedSingleModel = singleSelected ? selection[0] : undefined;
    me.selectedPolicyNames = singleSelected ? selection[0].storageProfiles : [];
    me.enableExclusion = me.isVDisk(me.selectedSingleModel);
    if (singleSelected && selection[0].hasLink('options'))
      me.loadOptions(selection[0]);
    else
      me.hypervisorOptionsComponent.setOptions();

    me.closeAllCollapse();
  }

  hasResourceSelection(): boolean {
    let me = this;
    if (me.vmselectbackupTable)
      return me.vmselectbackupTable.hasSelection();
    return false;
  }

  hasPolicySelection(): boolean {
    let me = this;
    if (me.policySelectTable)
      return me.policySelectTable.hasSelection();
    return false;
  }

  onCreateRestoreJobClick(): void {
    this.isCreatingRestoreJob = true;
    this.startCreateWizard();
  }

  onWizardCancel(): void {
    this.isCreatingRestoreJob = false;
    this.hideWizard();
  }

  onWizardSubmit(): void {
    this.isCreatingRestoreJob = false;
  }

  private initLogFilter(): void {
    let me = this;
    me.logTyps = [
      {id: 0, itemName: me.textInfo, value: 'INFO'},
      {id: 1, itemName: me.textWarning, value: 'WARN'},
      {id: 2, itemName: me.textError, value: 'ERROR'},
      {id: 3, itemName: me.textDetail, value: 'DETAIL'},
      {id: 4, itemName: me.textSummary, value: 'SUMMARY'}
    ];
    me.selectableLogTypes = me.getLogTypeDropdownList();
    me.jobLogTypes = me.getJobLogTypes();
    me.jobLogTypes = me.jobLogTypes || ['INFO', 'WARN', 'ERROR', 'SUMMARY'];
    me.selectedLogTypes = me.getLogTypeInitSelectedList();
    me.logFilters = me.getLogFilter();
  }

  private startCreateWizard(): void {
    let me = this;
    if (me.wizard)
      me.wizard.create();
  }

  private hideWizard(): void {
    let me = this;
    if (me.wizard)
      me.wizard.hide();
  }

  private isVDisk(item: BaseHypervisorModel): boolean {
    return item && ((item.type || '').toLowerCase() === 'vdisk' || item.resourceType === 'vdisk');
  }

  private isVM(item: BaseHypervisorModel): boolean {
    return item && ((item.type || '').toLowerCase() === 'vm' || item.resourceType === 'vm');
  }

  private isTopLevel(item: any): boolean {
    return item && !item.resource;
  }

  private loadOptions(item: BaseHypervisorModel, testOnLoad?: boolean): void {
    let me = this, observable = item.getRecord<HypervisorBackupOptionsModel>(HypervisorBackupOptionsModel,
      'options', me.vmbrowseService.proxy);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.hypervisorOptionsComponent.setOptions(record);
          if (testOnLoad) {
            me.onTestClick(false);
          }
        },
        err => me.handleError(err, false)
      );
    }
  }

  private clearFilter(): void {
    let me = this;
    // Clear filters.
    if (me.filters.length > 0)
      me.filters.splice(0);

    if (me.slas && me.slas.length > 0)
      me.sla = me.slas[0];
  }

  private closeAllCollapse() {
    this.onRemoveClass(this.vmoptionsCollapseRef);
    this.onRemoveClass(this.policyCollapseRef);
  }

  private emptyResourceSelection(): void {
    let me = this;
    if (me.vmselectbackupTable)
      me.vmselectbackupTable.emptySelection();
  }

  private refreshResourceTable(): void {
    let me = this;
    if (me.vmselectbackupTable)
      me.vmselectbackupTable.onRefresh();
  }

  private refreshPolicyStatusTable(): void {
    let me = this;
    if (me.policyStatusTable)
      me.policyStatusTable.onRefresh();
  }

  private emptyPolicySelection(): void {
    let me = this;
    if (me.policySelectTable)
      me.policySelectTable.emptySelection();
  }

  private getResourceSelection(): Array<BaseHypervisorModel> {
    let me = this;
    if (me.vmselectbackupTable)
      return me.vmselectbackupTable.getValue();
    return [];
  }

  private getPolicySelection(): Array<BaseModel> {
    let me = this;
    if (me.policySelectTable)
      return me.policySelectTable.getValue();
    return [];
  }

  private buttonIsPressed(target: any): boolean {
    return target && $(target).hasClass('btn-toggle');
  }

  private toggleButton(target: any, pressed?: boolean) {
    if (target) {
      if (pressed) {
        if (!$(target).hasClass('btn-toggle'))
          $(target).addClass('btn-toggle');
      } else {
        if ($(target).hasClass('btn-toggle'))
          $(target).removeClass('btn-toggle');
      }
    }
  }

  private onRerunClick(): void {
    let resource: BaseHypervisorModel = this.getResourceSelection()[0];
    this.selectedRerunVm = resource;
    if (resource.storageProfiles.length > 1) {
      if (this.rerunModal)
        this.rerunModal.show();
    } else {
      this.rerunJob(resource);
    }
  }

  private rerunJob(item: BaseHypervisorModel, slaName?: string): void {
    let message: string,
      observable: Observable<object>;
    if (item) {
      this.maskScreen();
      if (this.rerunModal)
        this.rerunModal.hide();
      message = SharedService.formatString(this.textRerunSlaInit,
        (slaName || item.storageProfiles[0]), item.name);
      observable = this.vmbackupService.rerun(item, this.hypervisorType, slaName);
      if (observable) {
        observable.takeUntil(this.subs).subscribe(
          (data) => {
            this.unmaskScreen();
            this.info(message, undefined, AlertType.INFO);
            this.selectedRerunSla = undefined;
            this.selectedRerunVm = undefined;
            },
          (err) => {
            this.unmaskScreen();
            this.handleError(err, true);
          }
        );
      }
    }
  }

  private canRerun(): boolean {
    let resources = this.getResourceSelection() || [];
    return resources.length === 1 && this.isVM(resources[0]) && resources[0].hasPolicyAssociation;
  }

  // private hasUnprotectedFilter(): boolean {
  //   let me = this, idxUnprotectedFilter = me.filters.findIndex(function (item) {
  //     return item.property === 'unprotected';
  //   });
  //   return idxUnprotectedFilter !== -1;
  // }

  // private removeUnprotectedFilter(): void {
  //   let me = this, idxUnprotectedFilter = me.filters.findIndex(function (item) {
  //     return item.property === 'unprotected';
  //   });
  //   if (idxUnprotectedFilter !== -1) {
  //     // Remove unprotected filter from filters.
  //     me.filters.splice(idxUnprotectedFilter, 1);
  //   }
  //   // Set the toggle state.
  //   me.toggleButton(me.targetUnprotectedBtn, false);
  // }

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

  private onCardCollapse(value: string) {
    if (value === 'option') {
      this.onRemoveClass(this.policyCollapseRef);
      this.scrollIntoView(this.vmoptionsCollapseRef);
    } else if (value === 'permission') {
      this.onRemoveClass(this.vmoptionsCollapseRef);
      this.onRemoveClass(this.policyCollapseRef);
    } else if (value === 'policy') {
      this.onRemoveClass(this.vmoptionsCollapseRef);
      this.scrollIntoView(this.policyCollapseRef);
    }
  }

  private scrollIntoView(element: ElementRef, duration: number = 500,
                         minusOffset: number = 150, className: string = 'in'): void {
    if (element && element.nativeElement &&
      !$(element.nativeElement).hasClass(className)) {
      setTimeout(() => {
        $('html, body').animate({
          scrollTop: $(element.nativeElement).offset().top - minusOffset
        }, duration);
      }, 100);
    }
  }

  private onAddClass(element: ElementRef, className: string = 'in'): void {
    if (element && !$(element.nativeElement).hasClass(className)) {
      this.renderer.setElementClass(element.nativeElement, className, true);
    }
  }

  private onRemoveClass(element: ElementRef, className: string  = 'in'): void {
    if (element && $(element.nativeElement).hasClass(className)) {
      this.renderer.setElementClass(element.nativeElement, className, false);
    }
  }

  private refreshJobDisplayFields(target: JobModel, updated: JobModel): void {
    let inProgress = this.inventoryInProgress;
    target.name = updated.name;
    target.type  = updated.type;
    target.status  = updated.status;
    target.typeDisplayName  = updated.typeDisplayName;
    target.statusDisplayName  = updated.statusDisplayName ;
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

  private onRunInventoryClick(): void {
    let me = this, job = me.inventoryJob;
    if (job) {
      if (job.hasLink('start'))
        me.doAction(job, 'start');
      else if (job.status  === 'HELD') {
        // Release schedule first in order to run it.
        me.forceRunPending = true;
        me.doAction(job, 'release Schedule', undefined, function() {
          me.forceRunPending = false;
        });
      }
    }
  }

  private retrieveInventoryJob() {
    let me = this, filter = [new FilterModel('serviceId', 'serviceprovider.catalog.hypervisor')],
      observable = JobsModel.retrieve<JobModel, JobsModel>(JobsModel,
        me.vmbrowseService.proxy, filter, undefined, 0);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset && dataset.records && dataset.records.length > 0) {
            me.inventoryJob = dataset.records[0];
          }
        },
        err => {}
      );
    }
  }

  private refreshInventory(): void {
    let me = this, item = me.inventoryJob, observable: Observable<JobModel>;
    if (!item) {
      me.retrieveInventoryJob();
      return;
    }
    observable = item.getRecord<JobModel>(JobModel, 'self');
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.refreshJobDisplayFields(item, record);
          if (me.forceRunPending && item.hasLink('start')) {
            me.doAction(item, 'start', function () {
              me.forceRunPending = false;
            }, function () {
              me.forceRunPending = false;
            });
          }
        },
        err => {}
      );
  }

  private getSearchPattern(): string {
    let me = this;
    return (me.searchBarComponent && me.searchBarComponent.pattern !== '') ? me.searchBarComponent.pattern : '*';
  }

  private onTestClick(saveFirst?: boolean): void {
    if (saveFirst)
      this.onApplyOptionsClick(true);
    else
      this.doTestAction(this.selectedSingleModel, this.hypervisorOptionsComponent.getExistingUserHref()
        || this.hypervisorOptionsComponent.getExistingKeyHref());
  }

  private getTestActionPayload(userHref: string): Object {
    return name === 'test' ? { identityHref : userHref } : {};
  }

  private onAbortTestClick(): void {
    this.testAborted = true;
    this.unmask();
    this.alert.hide();
  }

  private presentTestResult(item: BaseHypervisorModel, result: ConfigGroupsTestTaskModel): void {
    if (this.configGroupsComponent) {
      this.testResult = result;
      this.alert.show(SharedService.formatString(this.textTestResultTpl, item.name),
        this.configGroupsComponent.template, AlertType.TEMPLATE, undefined, undefined,
        0, !result.testsComplete);
    }
  }

  private waitTestComplete(item: BaseHypervisorModel, task: ConfigGroupsTestTaskModel,
                           delay: number,
                           mask?: boolean): void {
    let me = this, observable: Observable<ConfigGroupsTestTaskModel>;

    if (me.testAborted) {
      me.unmask();
      return;
    }

    if (mask)
      me.mask();

    me.presentTestResult(item, task);

    observable = task.query();
    if (observable)
      observable.delay(delay).takeUntil(me.subs).subscribe(
        record => {
          if (!record.testsComplete)
            me.waitTestComplete(item, record, 5000, false);
          else {
            me.unmask();
            if (!me.testAborted)
              me.presentTestResult(item, record);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
    else {
      me.unmask();
    }
  }

  private doTestAction(item: BaseHypervisorModel, userHref: string): void {
    let me = this, payload = {identityHref: userHref},
      observable = item.doAction<ConfigGroupsTestTaskModel>(ConfigGroupsTestTaskModel,
        'test', payload, me.vmbrowseService.proxy);
    if (observable) {
      me.mask();
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.unmask();
          if (record) {
            me.testAborted = false;
            me.waitTestComplete(item, record, 500, true);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
    } else {
      me.unmask();
    }
  }

  private getLogTypeDropdownList(): Array<any> {
    return this.logTyps.filter(function (item) {
      return String(item.value);
    });
  }

  private getLogTypeInitSelectedList(): Array<any> {
    let me = this;
    return this.logTyps.filter(function (item) {
      let target = String(item.value);
      return (me.jobLogTypes || []).indexOf(target) !== -1;
    });
  }

  onLogTypeSelect(item: any): void {
    this.logFilters = this.getLogFilter();
    this.jobLogTypes = this.extractJobLogTypes();
  }

  onLogTypeDeselect(item: any): void {
    this.logFilters = this.getLogFilter();
    this.jobLogTypes = this.extractJobLogTypes();
  }

  private extractJobLogTypes(): string[] {
    let result = [];
    (this.selectedLogTypes || []).forEach(function (item) {
      result.push(item.value);
    });
    return result;
  }

  private getLogFilter(): FilterModel[] {
    let me = this, list = [];
    (me.selectedLogTypes || []).forEach(function (item) {
      list.push(item.value);
    });
    return [new FilterModel('type', list, 'IN')];
  }

  private resourceSelectionCount(): number {
    let me = this, result = 0;
    if (me.vmselectbackupTable)
      result = me.vmselectbackupTable.selectionCount();
    return result;
  }

  private setJobLogTypes(types: string[]): void {
    let session = SessionService.getInstance(), userModel = session.getUserModel();
    session.syncMetadata('jobLogTypes', types);
    userModel.updateMetadata('jobLogTypes', types, this._vmbrowse.proxy);
  }

  private getJobLogTypes(): string[] {
    let userModel = SessionService.getInstance().getUserModel();
    return userModel && userModel.metadata ?
      userModel.metadata['jobLogTypes'] : null;
  }
}
