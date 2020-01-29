import {Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent, ErrorHandlerComponent, PagingDockbarComponent} from 'shared/components';
import {RestService, SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {SharedService} from 'shared/shared.service';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {Subject} from 'rxjs';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {ApplicationService} from 'applications/shared/application.service';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {InstancesModel} from 'applications/shared/instances.model';
import {DatabaseGroupsModel} from 'applications/shared/databasegroups.model';
import {AppServerModel} from 'appserver/appserver.model';
import {ApplicationsAssignPolicyService} from '../assign-policy/applications-assign-policy.service';

@Component({
  selector: 'application-table',
  templateUrl: './application-table.component.html',
  styleUrls: ['./application-table.component.scss']
})
export class ApplicationTableComponent implements OnInit, OnDestroy, Sortable {

  @Input() model: AppServerModel;
  @Input() view: NvPairModel;
  @Output() refreshSearchEvent = new EventEmitter<void>();
  @Output() loadEvent: EventEmitter<Array<BaseApplicationModel>> = new EventEmitter<Array<BaseApplicationModel>>();
  @Output() onAssignPolicy = new EventEmitter<BaseApplicationModel>();
  @Output() onEditRunSettings = new EventEmitter<BaseApplicationModel>();

  @ViewChild(PagingDockbarComponent) paging: PagingDockbarComponent;

  records: Array<BaseApplicationModel>;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  filters: Array<FilterModel>;

  private namePattern: string = '';
  private searchResultView: boolean = false;
  private processingRequestMsg: string;
  private nameSort: SorterModel;
  private storageProfileNameSort: SorterModel;
  private sorters: Array<SorterModel>;
  private mask: boolean = false;
  private destroy$ = new Subject();

  private standaloneText: string;
  private instanceText: string;
  private agText: string;
  private nameText: string;
  private slaPolicyText: string;
  private subs: Subject<void> = new Subject<void>();

  constructor(private translate: TranslateService,
              private applicationService: ApplicationService,
              private assignPolicyService: ApplicationsAssignPolicyService) {
    let paginationId: string = `application-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  get applicationType(): string {
    return this.model ? this.model.applicationType : '';
  }

  get isDbGrpView(): boolean {
    return this.view && this.view.value === 'databasegroupview';
  }

  private get isDbLevel(): boolean {
    return this.applicationService && this.applicationService.isDbLevel;
  }

  private get isDb2(): boolean {
    return this.applicationType === 'db2';
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.nameSort = new SorterModel('name', 'ASC');
    me.sorters = [me.nameSort];

    me.translate.get([
      'application.standaloneText',
      'application.textName',
      'application.textSlaPolicy',
      'application.instancesText',
      'application.agGroupText',
      'common.processingRequestMsg'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.nameText = resource['application.textName'];
      me.slaPolicyText = resource['application.textSlaPolicy'];
      me.standaloneText = resource['application.standaloneText'];
      me.processingRequestMsg = resource['common.processingRequestMsg'];
      me.instanceText = resource['application.instancesText'];
      me.agText = resource['application.agGroupText'];

      me.loadData(me.isDbGrpView);
    });

    this.assignPolicyService.policiesAssignedSuccess$()
      .takeUntil(this.destroy$)
      .subscribe(item => {
        this.records = this.records.map(record => {
          if (record.id === item.id) {
            record.storageProfiles = item.storageProfiles;
          }
          return record;
        });
      });
  }

  isAsc(name: string): boolean {
    return SortUtil.has(this.sorters, name, false);
  }

  isDesc(name: string): boolean {
    return SortUtil.has(this.sorters, name, true);
  }

  onSort(name: string): void {
    this.changeSorter(name);
    SortUtil.toggle(this.sorters, name);
    this.onRefresh();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    } else if (name === 'storageProfileName') {
      this.sorters = [this.storageProfileNameSort];
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  loadData(isAlwaysOn: boolean = false): void {
    let me = this,
      crumb,
      crumbTitle;

    crumbTitle = isAlwaysOn ? me.agText : me.instanceText;
    crumb = new BreadcrumbModel(crumbTitle, me.applicationService.getEcxApiEndpoint());
    me.applicationService.resetBreadcrumbs(crumb, me.applicationType);
    me.mask = true;

    me.applicationService.getApplications(me.applicationType, isAlwaysOn, me.mergeTypeFilter(me.filters, true), 'hlo',
      me.paginateConfig.pageStartIndex(), me.paginateConfig.pageSize(), me.sorters).takeUntil(me.subs)
      .subscribe(
        (dataset: InstancesModel | DatabaseGroupsModel) => {
          me.mask = false;
          me.records = dataset.getRecords();
          me.paginateConfig.refresh(dataset.total);

        },
        err => {
          me.mask = false;
          me.handleError(err);
        }
      );
  }

  dbSearch(applicationType: string, mode: string, payload, filters: Array<FilterModel>, isDbGroup: boolean): void {
    let me = this, title: string = isDbGroup ? me.agText : me.instanceText, resourceTypes: [string],
      crumb = new BreadcrumbModel(title,
        me.applicationService.getEcxApiEndpoint(applicationType, isDbGroup, 'recovery'));
    me.applicationService.resetBreadcrumbs(crumb);
    me.mask = true;

    if (applicationType === 'office365') {
      resourceTypes = ['folder'];
    } else {
      resourceTypes = ['database'];
    }

    me.applicationService.dbSearch(applicationType, mode, payload, filters, me.paginateConfig.pageStartIndex(),
      RestService.pageSize, resourceTypes, me.model.id, me.sorters)
      .takeUntil(me.subs).subscribe(
      db => {
        me.mask = false;
        me.records = db.getRecords();
        me.paginateConfig.refresh(db.total);

      },
      err => {
        me.mask = false;
        me.handleError(err);
      }
    );
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onPageSizeChange(page: number): void {
    let me = this;
    me.paginateConfig.pageSizeChanged(page);
    me.onRefresh();
  }

  onRefresh() {
    let me = this,
      dbGroupView: boolean = me.isDbGrpView,
      crumb = me.applicationService.currentBreadcrumb();

    if (me.applicationService.isDbSearch) {
      me.refreshSearchEvent.emit();
    } else if (crumb.resource) {
      me.navigate(<any>crumb.resource);
    } else {
      me.loadData(dbGroupView);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  setView(view: NvPairModel): void {
    this.view = view;
    this.namePattern = '';
  }

  setFilters(filters: Array<FilterModel>): void {
    this.filters = filters;
  }

  canNavigate(item: BaseApplicationModel): boolean {
    return !!item && (item.resourceType === 'applicationinstance' && item.type !== 'saphana' ||
      item.resourceType === 'databasegroup' || item.resourceType === 'folder');
  }

  navigate(item: any, event?: any) {
    let me = this, view;
    if (this.applicationType === 'sql' || this.applicationType === 'exch') {
      if (!me.filters) {
        me.filters = [new FilterModel('databaseGroupPk', undefined, 'NOT EXISTS')];
      }
    }
    if (me.canNavigate(item)) {
      if (me.view === undefined) {
        me.view = new NvPairModel(me.standaloneText, 'applicationview');
      }
      view = me.applicationService.navigate(item, me.view.value,
        me.mergeTypeFilter(me.filters, false), me.sorters);
      if (view) {

        me.mask = true;
        (view).takeUntil(me.subs).subscribe(
          (dataset: any) => {
            me.mask = false;
            me.records = dataset.getRecords();
            me.paginateConfig.refresh(dataset.total);

          },
          err => {
            me.mask = false;
            me.handleError(err);
          }
        );
      }
    }
  }

  inSearchResultView(): boolean {
    return this.searchResultView;
  }

  onClickAssignPolicy(item: BaseApplicationModel): void {
    this.onAssignPolicy.emit(item);
  }

  onClickEditRunSettings(item: BaseApplicationModel): void {
    this.onEditRunSettings.emit(item);
  }

  private mergeTypeFilter(filters: Array<FilterModel>, isRoot: boolean): Array<FilterModel> {
    return (filters || []).concat(isRoot ? [
      new FilterModel('providerNodeId', this.model.id)
    ] : []);
  }

  private hideLogBackupCol(): boolean {
    return (this.applicationService.isDbSearch || this.applicationService.isDbLevel) &&
      this.applicationType !== 'office365';
  }

  private ellipsisPath(item: BaseApplicationModel | string): string {
    let path = typeof item === 'string' ? item : item ? (item as BaseApplicationModel).location || '' : '';
    return SharedService.ellipsisPath(path, 33);
  }
}
