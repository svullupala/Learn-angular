import { Component, ElementRef, forwardRef, Input, OnDestroy, OnInit, Renderer, ViewChild } from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';

import { NvPairModel } from 'shared/models/nvpair.model';
import { PolicySelectTableComponent }
  from '../../slapolicy/shared/policySelectTable/policySelectTable.component';
import { AlertComponent, AlertType } from 'shared/components/msgbox/alert.component';
import { ApplicationService } from '../shared/application.service';
import { SessionService, ScreenId } from 'core';
import { FilterModel } from 'shared/models/filter.model';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { BaseModel } from 'shared/models/base.model';
import { ApplicationBackupService } from './application-backup.service';
import { DbBackupTableComponent } from './db-backup-table/db-backup-table.component';
import { JobModel } from 'job/shared/job.model';
import { JobsModel } from 'job/shared/jobs.model';
import { RestService } from 'core';
import { RbacModel } from 'shared/rbac/rbac.model';
import { BaseApplicationModel } from '../shared/base-application-model.model';
import { InstancesModel } from '../shared/instances.model';
import { ApplicationBackupOptionsModel } from '../shared/application-backup-options.model';
import { SdlSearchBarComponent } from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import { SlapolicyModel } from '../../slapolicy/shared/slapolicy.model';
import { ApplicationBackupOptionsComponent } from
  'applications/backup/application-backup-options/application-backup-options.component';
import { SharedService } from 'shared/shared.service';
import { BaseModalComponent } from 'shared/components/base-modal/base-modal.component';
import { JobWizardComponent } from 'wizard/job-wizard.component';
import { WizardAllowedCategory } from 'shared/components/wizard/wizard-registry';
import { WIZARD_CATEGORY_SNAPSHOT_RESTORE } from 'wizard/snapshot-restore/snapshot-restore-wizard.model';
import { WIZARD_CATEGORY_BACKUP } from 'wizard/on-demand-backup/backup-wizard.model';
import { Workflow } from 'shared/components/wizard/wizard.model';
import { RefreshSameUrl } from 'shared/util/refresh-same-url';
import { GlobalState } from '../../../global.state';

@Component({
  selector: 'application-backup',
  templateUrl: 'application-backup.component.html',
  styleUrls: ['application-backup.component.scss'],
  providers: [ApplicationBackupService]
})

export class ApplicationBackupComponent extends RefreshSameUrl {

  cardTitle: string;

  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(DbBackupTableComponent) dbBackupTable: DbBackupTableComponent;
  @ViewChild(PolicySelectTableComponent) policySelectTable: PolicySelectTableComponent;
  @ViewChild(ApplicationBackupOptionsComponent) applicationBackupOptionsComponent: ApplicationBackupOptionsComponent;
  @ViewChild('collapsepolicy') policyElementRef: ElementRef;
  @ViewChild('collapseoptions') optionElementRef: ElementRef;
  @ViewChild(BaseModalComponent) rerunModal: BaseModalComponent;

  @ViewChild(forwardRef(() => JobWizardComponent)) wizard: JobWizardComponent;

  public errorHandler: ErrorHandlerComponent;
  public breadcrumbs: Array<any>;
  public alert: AlertComponent;
  public views: Array<NvPairModel> = [];
  public view: NvPairModel;
  public slas: Array<NvPairModel> = [];
  public sla: NvPairModel;
  public filters: Array<FilterModel> = [];
  public namePattern: string = '';
  public applicationType: string = '';


  selectableLogTypes: Array<any>;
  selectedLogTypes: Array<any>;
  jobLogTypes: string[];
  dropdownSettings: Object;
  logFilters: Array<FilterModel>;

  private selectedRerunSla: string;
  private selectedRerunDb: BaseApplicationModel;
  private selectedPolicyNames: string[];
  private standaloneText: string;
  private alwaysonText: string;
  private textNamespace: string;
  private textLabel: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textSelect: string;
  private selectSLAText: string;
  private selectOptionsText: string;
  private searchForText: string;
  private textAllSla: string;
  private textConfirm: string;
  private textSwitchView: string;
  private textLastInventoryAt: string;
  private textDatabaseAvailGroups: string;
  private subs: Subject<void> = new Subject<void>();
  private inventoryJob: JobModel;
  private forceRunPending: boolean = false;
  private includeLogBackup: boolean = true;
  private textUnProtectedDatabases: string;
  private textAllDatabases: string;
  private textAllMailboxes: string;
  private textAllPVCs: string;
  private canDiscover: boolean = false;
  private showOsType: boolean = false;
  private textRerunSlaInit: string;
  private textRerun: string;
  private textClearSelectionsTpl: string = '';
  private textInfo: string;
  private textWarning: string;
  private textDetail: string;
  private textError: string;
  private textSummary: string;
  private maskSelf: boolean = false;
  private isCreatingRestoreJob: boolean = false;
  private isPoliciesLengthZero: boolean = false;
  private logTyps: Array<any> = [
    { id: 0, itemName: 'INFO', value: 'INFO' },
    { id: 1, itemName: 'WARN', value: 'WARN' },
    { id: 2, itemName: 'ERROR', value: 'ERROR' },
    { id: 3, itemName: 'DETAIL', value: 'DETAIL' },
    { id: 4, itemName: 'SUMMARY', value: 'SUMMARY' }
  ];

  get textBackToTarget(): string {
    let mapping = {
      oracle: 'menubar.submenu.textOracle',
      sql: 'menubar.submenu.textSQL',
      db2: 'menubar.submenu.textDB2',
      mongo: 'menubar.submenu.textMongoDb',
      exch: 'menubar.submenu.textExchange',
      office365: 'menubar.submenu.textExchangeOnline',
      k8s: 'menubar.submenu.textKubernetes'
    };
    return mapping[this.applicationType] || '';
  }

  get allowedCategories(): WizardAllowedCategory[] {
    return [
      { type: WIZARD_CATEGORY_SNAPSHOT_RESTORE, subType: this.applicationType as Workflow },
      { type: WIZARD_CATEGORY_BACKUP, subType: this.applicationType as Workflow }
    ];
  }

  get textClearSelections(): string {
    return SharedService.formatString(this.textClearSelectionsTpl, this.resourceSelectionCount());
  }

  get showCreateRestoreJobButton(): boolean {
    let instance = SessionService.getInstance();
    let me = this;
    switch (me.applicationType) {
      case 'oracle':
        return instance.hasScreenPermission(ScreenId.ORACLE_RESTORE);
      case 'sql':
        return instance.hasScreenPermission(ScreenId.SQL_RESTORE);
      case 'exch':
        return instance.hasScreenPermission(ScreenId.EXCH_RESTORE);
      case 'office365':
        return instance.hasScreenPermission(ScreenId.EXCHONLINE_RESTORE);
      case 'db2':
        return instance.hasScreenPermission(ScreenId.DB2_RESTORE);
      case 'mongo':
        return instance.hasScreenPermission(ScreenId.MONGO_RESTORE);
      case 'k8s':
        return instance.hasScreenPermission(ScreenId.KUBERNETES_RESTORE);
      default:
        return false;
    }
  }

  private get inventoryInProgress(): boolean {
    return this.forceRunPending ||
      !!(this.inventoryJob && this.inventoryJob.status !== 'IDLE' && this.inventoryJob.status !== 'HELD');
  }

  private get filterEnabled(): boolean {
    return this.namePattern !== '' || (this.applicationService && this.applicationService.isDbLevel);
  }

  private get isDbSearch(): boolean {
    return this.applicationService && this.applicationService.isDbSearch;
  }

  constructor(protected globalState: GlobalState,
    protected activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private rest: RestService,
    private renderer: Renderer,
    private applicationService: ApplicationService,
    private applicationBackupService: ApplicationBackupService) {
    super(globalState, activatedRoute);
    this.breadcrumbs = this.applicationService.breadcrumbs;
    this.cardTitle = activatedRoute.snapshot.data['cardTitle'] || '';
  }

  protected onRefreshSameUrl(): void {
    this.onWizardCancel();
  }

  mask() {
    let me = this;
    if (me.alert) {
      me.alert.show('', me.processingRequestMsg, AlertType.MASK);
    }
  }

  unmask() {
    let me = this;
    if (me.alert)
      me.alert.hide();
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  confirm(message: string, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onClearSearch() {
    let me = this, crumb = me.applicationService.firstBreadcrumb();
    if (crumb)
      me.onBreadcrumbClick(crumb);
  }

  onUnProtectedDatabasesClick(): void {
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
      // Add filter to get unprotected Databases.
      me.filters.push(new FilterModel('unprotected', true));
    }
    if (me.applicationService.isDbSearch) {
      me.startSearch(me.namePattern);
    } else {
      me.dbBackupTable.onRefresh();
    }
  }


  onAllClick(): void {
    let me = this, crumb = me.applicationService.currentBreadcrumb();
    if (me.searchBarComponent) {
      me.searchBarComponent.reset();
    }
    // Empty name pattern.
    me.namePattern = '';
    if (me.filterEnabled) {
      me.clearFilter();
      me.startSearch(me.namePattern);
    } else {
      if (crumb) {
        me.clearFilter();
        me.dbBackupTable.onRefresh();
      }
    }
  }

  onViewClick(item: NvPairModel): void {
    let me = this, handler;
    if (me.view.value !== item.value) {
      handler = function () {
        let crumb;
        me.unmask();

        me.emptyResourceSelection();

        me.view = item;
        crumb = me.applicationService.firstBreadcrumb();
        if (me.applicationType === 'sql' || me.applicationType === 'exch' || me.applicationType === 'office365') {
          me.setSqlFilters();
          me.dbBackupTable.setView(me.view);
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
        me.onUnProtectedDatabasesClick();
      } else if (item.value === 'all') {
        me.onAllClick();
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
        me.startSearch(me.namePattern);
      }
    }
  }

  startSearch(searchPattern: string): void {
    let me = this, crumb = me.applicationService.currentBreadcrumb(), payload;

    if (searchPattern !== undefined) {
      me.namePattern = searchPattern;
    }
    if (crumb) {
      if (me.applicationType === 'office365') {
        payload = { location: me.namePattern || '' };
      } else {
        payload = { name: me.namePattern || '' };
      }
      me.emptyResourceSelection();
      me.setSqlFilters();
      me.dbBackupTable.setFilters(me.filters);
      me.dbBackupTable.dbSearch(me.applicationType, 'hlo',
        payload, me.filters,
        me.view.value === InstancesModel.DATABASE_GROUP_VIEW);
    }
  }

  setSqlFilters(): void {
    let me = this,
      dbGroupFilterIdx = me.filters.findIndex((item) => {
        return item.property === 'databaseGroupPk';
      });
    if (dbGroupFilterIdx !== -1 && me.view) {
      me.filters[dbGroupFilterIdx].op = me.view.value === InstancesModel.DATABASE_GROUP_VIEW ? 'EXISTS' : 'NOT EXISTS';
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
    let me = this, viewLabelOption1: string = undefined, viewLabelOption2: string = undefined;

    super.ngOnInit();

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

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.activatedRoute.url.takeUntil(me.subs).subscribe(
      (url: UrlSegment[]) => {
        // This is the url split into array from the current route. The first index will always have the app type.
        // ex: http://localhost:3000/#/databases/sql/backup
        // It starts from /sql/backup
        if (url[0] && typeof url[0]['path'] === 'string') {
          me.applicationType = url[0]['path'];
          if (this.applicationType === 'sql' || this.applicationType === 'exch' || this.applicationType === 'office365') {
            if (!me.filters.some(item => item.property === 'databaseGroupPk')) {
              me.filters.push(new FilterModel('databaseGroupPk', undefined, 'NOT EXISTS'));
            }
          }
          me.includeLogBackup = !(me.applicationType === 'db2' || me.applicationType === 'mongo' || me.applicationType === 'office365');
          me.canDiscover = me.canDoDiscover(me.applicationType);
        }
      }
    );
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textLastInventoryAt',
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
      'application.standaloneText',
      'application.alwaysonText',
      'application.textNamespace',
      'application.textLabel',
      'application.textSelect',
      'application.textSwitchView',
      'application.textAllSla',
      'application.textSwitchView',
      'application.textSelectPolicy',
      'application.textSelectOptions',
      'application.textSearchFor',
      'application.textUnProtectedDatabases',
      'application.textDatabaseAvailGroups',
      'application.textAllDatabases',
      'application.textAllPVCs',
      'application.textAllMailboxes'
    ]).takeUntil(this.subs)
      .subscribe((resource: Object) => {
        me.textInfo = resource['common.textInfo'];
        me.textWarning = resource['common.textWarning'];
        me.textDetail = resource['common.textDetail'];
        me.textError = resource['common.textError'];
        me.textSummary = resource['common.textSummary'];
        me.initLogFilter();
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textAllSla = resource['application.textAllSla'];
        me.textSwitchView = resource['application.textSwitchView'];
        me.standaloneText = resource['application.standaloneText'];
        me.alwaysonText = resource['application.alwaysonText'];
        me.textNamespace = resource['application.textNamespace'];
        me.textLabel = resource['application.textLabel'];
        me.textSelect = resource['application.textSelect'];
        me.selectSLAText = resource['application.textSelectPolicy'];
        me.selectOptionsText = resource['application.textSelectOptions'];
        me.searchForText = resource['application.textSearchFor'];
        me.textUnProtectedDatabases = resource['application.textUnProtectedDatabases'];
        me.textAllDatabases = resource['application.textAllDatabases'];
        me.textAllPVCs = resource['application.textAllPVCs'];
        me.textAllMailboxes = resource['application.textAllMailboxes'];
        me.textLastInventoryAt = resource['common.textLastInventoryAt'];
        me.textDatabaseAvailGroups = resource['application.textDatabaseAvailGroups'];
        me.textRerunSlaInit = resource['job.textRerunSlaInit'];
        me.textRerun = resource['common.textRerunSelection'];

        me.textClearSelectionsTpl = resource['common.textClearSelectionsTpl'];

        switch (me.applicationType) {
          case 'exch':
            viewLabelOption1 = me.standaloneText;
            viewLabelOption2 = me.textDatabaseAvailGroups;
            break;
          case 'k8s':
            viewLabelOption1 = me.textNamespace;
            viewLabelOption2 = me.textLabel;
            break;
          default:
            viewLabelOption1 = me.standaloneText;
            viewLabelOption2 = me.alwaysonText;
            break;
        }
        // groupText = me.applicationType === 'exch' ? me.textDatabaseAvailGroups : me.alwaysonText;
        // Initialize views.
        me.views.push(
          new NvPairModel(viewLabelOption1, 'applicationview'),
          me.applicationType === 'k8s' ? new NvPairModel(viewLabelOption2, 'labelview') : new NvPairModel(viewLabelOption2, 'databasegroupview'));
        me.view = me.views[0];

        // Update all & unprotected labels. SPP-5920.
        (me.slas || []).forEach(function (sla) {
          if (sla.value === 'unprotected')
            sla.name = me.textUnProtectedDatabases;
          else if (sla.value === 'all')
            sla.name = me.textAllDatabases;
        });
      });
    this.refreshInventory();
  }

  ngAfterViewInit() {
    // set initial view
    if (this.dbBackupTable) {
      this.dbBackupTable.setView(this.view);
    }
  }

  onPoliciesLoad(policies: Array<SlapolicyModel>): void {
    if (policies != null && policies.length === 0) {
      this.isPoliciesLengthZero = true;
    }

    let me = this, hasPolicy = policies && policies.length > 0;
    me.slas.splice(0);
    switch (me.applicationType) {
      case 'office365':
        me.slas.push(new NvPairModel(me.textAllMailboxes, 'all'));
        break;
      case 'k8s':
        me.slas.push(new NvPairModel(me.textAllPVCs, 'all'));
        break;
      default:
        me.slas.push(new NvPairModel(me.textAllDatabases, 'all'));
        break;
    }
    me.slas.push(new NvPairModel(me.textUnProtectedDatabases, 'unprotected'));

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
    let me = this,
      selection = me.getResourceSelection(),
      singleSelected = (selection && selection.length === 1),
      resetLogBackupValid = true;

    me.selectedPolicyNames = singleSelected ? selection[0].storageProfiles : [];

    // Leaving this here for later
    if (singleSelected && selection[0].hasLink('options')) {
      me.setSelections(selection);
      me.loadOptions(selection[0], resetLogBackupValid, selection);
    }
    else {
      me.setSelections(undefined);
      me.setOptions(undefined, resetLogBackupValid, selection);
    }

    this.collapseAll();
  }

  /**
   * Checks LogBackup is valid or not.
   *
   * 1. For all applications except Exchange, we want the Enable Log Backup option to be enabled so that the user can
   * either check or uncheck the option.
   * 2. For Exchange only at the instance level, we want the Enable Log Backup option to be enabled so that the user
   * can either check or uncheck the option.
   * 3. For Exchange only at the db level, we want the Enable Log Backup option to be enabled only if there is at least
   * one selection with "Eligible for Log Backup" is true ("yes"). If none of the selections are eligible for log
   * backup, then the Enable Log Backup option should be disabled. If one or more selections are eligible for log
   * backup, the the Enable Log Backup option should be enabled to allow the user to check or uncheck the option.
   *
   * @param {Array<BaseApplicationModel>} selections
   * @returns {boolean}
   */
  // checkLogBackupValid(selections: Array<BaseApplicationModel>) {
  //   let me = this, result = false;
  //
  //   if (this.applicationType === 'exch') {
  //     if (selections.length > 0 && selections[0].resourceType === 'applicationinstance')
  //       result = true;
  //     else {
  //       result = selections.findIndex(function (item) {
  //         if (item.isLogBackupEligible())
  //           return true;
  //       }) !== -1;
  //     }
  //   } else {
  //     result = true;
  //   }
  //
  //   return result;
  // }

  onBreadcrumbClick(item: any, event?: any): void {
    let me = this,
      dbView: boolean = false;

    me.searchBarComponent.reset();

    if (item && item.resource) {
      me.dbBackupTable.navigate(item.resource, event);
      return;
    }
    if (me.dbBackupTable) {
      me.dbBackupTable.setView(me.view);
      me.dbBackupTable.setFilters(me.filters);
      if (me.view.value === 'databasegroupview') {
        dbView = true;
      }
      me.dbBackupTable.loadData(dbView, true);
    }

  }

  canNavigateBreadCrumb(item): boolean {
    let resourceType;
    if (item && item.resource) {
      resourceType = item.resource.resourceType;
      if (resourceType === 'databasegroup' || (resourceType === 'applicationinstance' && this.applicationType !== 'office365')) {
        return false;
      }
    }
    return true;
  }

  onApplyPolicyClick(): void {
    let me = this, resources = me.getResourceSelection(),
      policies = me.getPolicySelection();
    if (resources.length > 0) {
      // Apply SLA policies.
      me.maskSelf = true;
      me.applicationBackupService.applyPolicies(resources, policies, me.applicationType).takeUntil(me.subs)
        .subscribe(
          success => {
            me.maskSelf = false;
            me.resetOptions();
            me.emptyPolicySelection();
            me.dbBackupTable.onRefresh();
          },
          err => {
            me.maskSelf = false;
            me.handleError(err, true);
          }
        );
    }
  }

  onApplyOptionsClick(applicationBackupOptionsModel: ApplicationBackupOptionsModel): void {
    let me = this, resources = me.getResourceSelection();
    if (resources.length > 0) {
      me.maskSelf = true;
      // Apply options.
      me.applicationBackupService.applyOptions(resources,
        applicationBackupOptionsModel.getPersistentJson(), me.applicationType).takeUntil(me.subs)
        .subscribe(
          success => {
            me.maskSelf = false;
            me.setOptions();
            me.resetOptions();
            me.emptyPolicySelection();
            me.dbBackupTable.onRefresh();
          },
          err => {
            me.maskSelf = false;
            me.handleError(err, true);
          }
        );
    }
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
      { id: 0, itemName: me.textInfo, value: 'INFO' },
      { id: 1, itemName: me.textWarning, value: 'WARN' },
      { id: 2, itemName: me.textError, value: 'ERROR' },
      { id: 3, itemName: me.textDetail, value: 'DETAIL' },
      { id: 4, itemName: me.textSummary, value: 'SUMMARY' }
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

  private getSearchPattern(): string {
    let me = this;
    return (me.searchBarComponent && me.searchBarComponent.pattern !== '') ? me.searchBarComponent.pattern : '*';
  }

  private clearFilter(): void {
    let me = this;
    // Clear filters.
    if (me.filters.length > 0)
      me.filters.splice(0);

    if (me.slas && me.slas.length > 0)
      me.sla = me.slas[0];
  }

  private loadOptions(item: BaseApplicationModel,
    resetLogBackupValid?: boolean,
    selections?: Array<BaseApplicationModel>): void {
    let me = this, observable = item.getRecord<ApplicationBackupOptionsModel>(ApplicationBackupOptionsModel,
      'options', me.rest);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        (record: ApplicationBackupOptionsModel) => {
          me.setOptions(record, resetLogBackupValid, selections);
        },
        err => me.handleError(err, false)
      );
    }
  }

  private onRerunClick(): void {
    let resource: BaseApplicationModel = this.getResourceSelection()[0];
    this.selectedRerunDb = resource;
    if (resource.storageProfiles.length > 1) {
      if (this.rerunModal)
        this.rerunModal.show();
    } else {
      this.rerunJob(resource);
    }
  }

  private rerunJob(item: BaseApplicationModel, slaName?: string): void {
    let message: string,
      observable: Observable<object>;
    if (item) {
      this.mask();
      if (this.rerunModal)
        this.rerunModal.hide();
      message = SharedService.formatString(this.textRerunSlaInit,
        (slaName || item.storageProfiles[0]), item.name);
      observable = this.applicationBackupService.rerun(item, this.applicationType, slaName);
      if (observable) {
        observable.takeUntil(this.subs).subscribe(
          (data) => {
            this.unmask();
            this.info(message, undefined);
            this.selectedRerunSla = undefined;
            this.selectedRerunDb = undefined;
          },
          (err) => {
            this.unmask();
            this.handleError(err, true);
          }
        );
      }
    }
  }

  private canRerun(): boolean {
    let resources = this.getResourceSelection() || [];
    return resources.length === 1 && (this.isDb(resources[0]) || this.isUser(resources[0])) && resources[0].hasPolicyAssociation;
  }

  private isDb(item: BaseApplicationModel): boolean {
    return item && item.resourceType === 'database';
  }

  private isUser(item: BaseApplicationModel): boolean {
    return item && item.subType === 'user';
  }

  private setOptions(options?: ApplicationBackupOptionsModel,
    resetLogBackupValid?: boolean,
    selections?: Array<BaseApplicationModel>): void {

    if (resetLogBackupValid)
      this.applicationBackupOptionsComponent.resetLogBackupValid(selections);

    this.applicationBackupOptionsComponent.setOptions(options);
  }

  private setSelections(selections: Array<BaseApplicationModel>) {
    this.applicationBackupOptionsComponent.setSelections(selections, this.view.value);
  }

  private collapseAll() {
    this.onRemoveClass(this.policyElementRef);
    this.onRemoveClass(this.optionElementRef);
  }

  private onCardCollapse(value: string) {
    if (value === 'options') {
      this.onRemoveClass(this.policyElementRef);
      this.scrollIntoView(this.optionElementRef);
    } else if (value === 'policy') {
      this.onRemoveClass(this.optionElementRef);
      this.scrollIntoView(this.policyElementRef);
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

  private onRemoveClass(element: ElementRef, className: string = 'in'): void {
    if (element && $(element.nativeElement).hasClass(className)) {
      this.renderer.setElementClass(element.nativeElement, className, false);
    }
  }

  private hasResourceSelection(): boolean {
    let me = this;
    if (me.dbBackupTable)
      return me.dbBackupTable.hasSelection();
    return false;
  }

  private emptyResourceSelection(): void {
    let me = this;
    if (me.dbBackupTable)
      me.dbBackupTable.emptySelection();
  }

  private emptyPolicySelection(): void {
    let me = this;
    if (me.policySelectTable)
      me.policySelectTable.emptySelection();
  }

  private getResourceSelection(): Array<any> {
    let me = this;
    if (me.dbBackupTable)
      return me.dbBackupTable.getValue();
    return [];
  }

  private getPolicySelection(): Array<BaseModel> {
    let me = this;
    if (me.policySelectTable)
      return me.policySelectTable.getValue();
    return [];
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
      this.dbBackupTable.onRefresh();
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
    let me = this, job = me.inventoryJob,
      refreshObservable: Observable<any> = Observable.interval(30000).takeUntil(me.subs);
    if (job) {
      if (job.hasLink('start')) {
        me.doAction(job, 'start', () => {
          refreshObservable.subscribe(
            () => {
              if (!me.inventoryInProgress) {
                // interrupt observable and stop refresh
                me.subs.next();
              }
              me.refreshInventory();
            }
          );
        });
      } else if (job.status === 'HELD') {
        // Release schedule first in order to run it.
        me.forceRunPending = true;
        me.doAction(job, 'release Schedule', undefined, function () {
          me.forceRunPending = false;
        });
      }
    }
  }

  private retrieveInventoryJob() {
    let me = this, filter = [new FilterModel('serviceId', 'serviceprovider.catalog.application')],
      observable = JobsModel.retrieve<JobModel, JobsModel>(JobsModel,
        me.rest, filter, undefined, 0);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset && dataset.records && dataset.records.length > 0) {
            me.inventoryJob = dataset.records[0];
          }
        },
        err => { }
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
        err => { }
      );
  }

  private canDoDiscover(applicationType): boolean {
    return applicationType === 'oracle' || applicationType === 'mongo';
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
    if (me.dbBackupTable)
      result = me.dbBackupTable.selectionCount();
    return result;
  }

  private setJobLogTypes(types: string[]): void {
    let session = SessionService.getInstance(), userModel = session.getUserModel();
    session.syncMetadata('jobLogTypes', types);
    if (userModel) {
      userModel.updateMetadata('jobLogTypes', types, this.rest);
    }
  }

  private getJobLogTypes(): string[] {
    let userModel = SessionService.getInstance().getUserModel();
    return userModel && userModel.metadata ?
      userModel.metadata['jobLogTypes'] : null;
  }

  private getDisplayName() {
    switch (this.applicationType) {
      case 'k8s':
        return 'application.textManageClusters';
      default: 
        return 'application.manageApplicationsText';
    }
  }
}
