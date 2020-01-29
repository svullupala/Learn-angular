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
import {Subject} from 'rxjs/Subject';
import {ApplicationTableComponent} from '../';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {SlapoliciesModel} from 'slapolicy/shared/slapolicies.model';
import {SlapolicyService} from 'slapolicy/shared/slapolicy.service';
import {AppServerModel} from 'appserver/appserver.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {ApplicationService} from 'applications/shared/application.service';
import {InstancesModel} from 'applications/shared/instances.model';

export class BreadcrumbExModel extends BreadcrumbModel {
  constructor(public title: string,
              public url: string,
              public resource?: BaseApplicationModel) {
    super(title, url, resource);
  }
}

@Component({
  selector: 'application-viewer',
  templateUrl: './application-viewer.component.html',
  styleUrls: ['./application-viewer.component.scss']
})
export class ApplicationViewerComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() model: AppServerModel;
  @Input() textBackToTarget: string;
  @Input() view: NvPairModel;
  @Output() backTo = new EventEmitter();
  @Output() onAssignPolicy = new EventEmitter<BaseApplicationModel>();
  @Output() onEditRunSettings = new EventEmitter<BaseApplicationModel>();

  dropdownSettings: Object;
  breadcrumbs: Array<BreadcrumbExModel>;

  public isScriptServerOnly: boolean = true;

  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(ApplicationTableComponent) table: ApplicationTableComponent;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  views: Array<NvPairModel> = [];
  slas: Array<NvPairModel> = [];
  sla: NvPairModel;
  filters: Array<FilterModel> = [];
  namePattern: string = '';

  protected navigateRootPending: boolean = false;
  protected viewReady: boolean = false;

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
  private textUnProtectedDatabases: string;
  private textAllDatabases: string;
  private textAllMailboxes: string;
  private textRerunSlaInit: string;
  private textRerun: string;
  private textClearSelectionsTpl: string = '';
  private textInfo: string;
  private textWarning: string;
  private textDetail: string;
  private textError: string;
  private textSummary: string;

  private masked: boolean = false;

  constructor(private translate: TranslateService,
              private policyService: SlapolicyService,
              private applicationService: ApplicationService) {
    this.breadcrumbs = this.applicationService.breadcrumbs as Array<BreadcrumbExModel>;
  }

  get applicationType(): string {
    return this.model ? this.model.applicationType : '';
  }

  get canSelectView(): boolean {
    return ['sql', 'exch', 'k8s'].indexOf(this.applicationType) !== -1;
  }

  get isDbGrpView(): boolean {
    return this.view && this.view.value === 'databasegroupview';
  }

  get title(): string {
    return this.model ? this.model.name : '';
  }

  get subtitle(): string {
    let result: string;
    switch (this.applicationType) {
      case 'sql':
        result = 'inventory.textSQL';
        break;
      case 'db2':
        result = 'inventory.textDB2';
        break;
      case 'oracle':
        result = 'inventory.textOracle';
        break;
      case 'exch':
        result = 'inventory.textExchange';
        break;
      case 'office365':
        result = 'inventory.textOffice365';
        break;
      case 'mongo':
        result = 'inventory.textMongo';
        break;
      default:
        break;
    }
    return result;
  }

  private get filterEnabled(): boolean {
    return this.namePattern !== '' || (this.applicationService && this.applicationService.isDbLevel);
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
      me.table.onRefresh();
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
        me.table.onRefresh();
      }
    }
  }

  onViewClick(item: NvPairModel): void {
    let me = this, handler;
    if (me.view.value !== item.value) {
      handler = function () {
        let crumb;
        me.unmask();

        me.view = item;
        crumb = me.applicationService.firstBreadcrumb();
        if (me.applicationType === 'sql' || me.applicationType === 'exch' || me.applicationType === 'office365') {
          me.setSqlFilters();
          me.table.setView(me.view);
        }
        if (crumb)
          me.onBreadcrumbClick(crumb);
      };
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

  onClearSearch() {
    let me = this, crumb = me.applicationService.firstBreadcrumb();
    if (crumb)
      me.onBreadcrumbClick(crumb);
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

  startSearch(searchPattern?: string): void {
    let me = this, crumb = me.applicationService.currentBreadcrumb(), payload;

    if (searchPattern !== undefined) {
      me.namePattern = searchPattern;
    }
    if (crumb) {
      if (me.applicationType === 'office365') {
        payload = {location: me.namePattern || ''};
      } else {
        payload = {name: me.namePattern || ''};
      }
      me.setSqlFilters();
      me.table.setFilters(me.filters);
      me.table.dbSearch(me.applicationType, 'hlo',
        payload, me.filters,
        me.view.value === InstancesModel.DATABASE_GROUP_VIEW);
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
    let me = this, viewLabelOption1: string = undefined, viewLabelOption2: string = undefined;

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
      'application.textAllMailboxes']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textInfo = resource['common.textInfo'];
        me.textWarning = resource['common.textWarning'];
        me.textDetail = resource['common.textDetail'];
        me.textError = resource['common.textError'];
        me.textSummary = resource['common.textSummary'];

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
        // Initialize views.
        me.views.push(
          new NvPairModel(viewLabelOption1, 'applicationview'),
          new NvPairModel(viewLabelOption2, 'databasegroupview'));
        me.view = me.view || me.views[0];

        // Update all & unprotected labels. SPP-5920.
        (me.slas || []).forEach(function (sla) {
          if (sla.value === 'unprotected')
            sla.name = me.textUnProtectedDatabases;
          else if (sla.value === 'all')
            sla.name = me.textAllDatabases;
        });
      });
    me.loadPolicies();
  }

  onBreadcrumbClick(item: BreadcrumbModel, event?: any) {
    let me = this,
      dbGroupView: boolean = me.isDbGrpView;

    me.searchBarComponent.reset();

    if (item && item.resource) {
      me.table.navigate(item.resource, event);
      return;
    }
    if (me.table) {
      me.table.setView(me.view);
      me.table.setFilters(me.filters);
      me.table.loadData(dbGroupView);
    }
  }

  onLoad(resources: BaseApplicationModel[]): void {
    let me = this;
    if (me.viewReady)
      me.navigateRoot(resources);
    else
      me.navigateRootPending = true;
  }

  navigateRoot(resources?: BaseApplicationModel[]): void {
    let me = this, model = me.model,
      crumb: BreadcrumbModel,
      target: BaseApplicationModel;

    if (!resources)
      resources = me.table ? me.table.records : [];
    target = (resources || []).find(function (item) {
      return item.id === model.id && item.type === model.type;
    });
    if (me.table && target) {
      crumb = me.applicationService.firstBreadcrumb();
      me.applicationService.resetBreadcrumbs(crumb);
      me.table.navigate(target);
    }
  }

  onPoliciesLoad(policies: Array<SlapolicyModel>): void {
    let me = this, hasPolicy = policies && policies.length > 0;
    me.slas.splice(0);
    if (me.applicationType === 'office365') {
      me.slas.push(new NvPairModel(me.textAllMailboxes, 'all'));
    } else {
      me.slas.push(new NvPairModel(me.textAllDatabases, 'all'));
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

  onBackToClick(): void {
    this.backTo.emit();
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

  onClickAssignPolicy(item: BaseApplicationModel): void {
    this.onAssignPolicy.emit(item);
  }

  onClickEditRunSettings(item: BaseApplicationModel): void {
    this.onEditRunSettings.emit(item);
  }

  private clearFilter(): void {
    let me = this;
    // Clear filters.
    if (me.filters.length > 0)
      me.filters.splice(0);

    if (me.slas && me.slas.length > 0)
      me.sla = me.slas[0];
  }
}
