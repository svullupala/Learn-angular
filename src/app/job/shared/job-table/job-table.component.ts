import {
  Component, Output, OnInit, OnDestroy, ViewChildren, QueryList, EventEmitter, ViewChild, ElementRef
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/delay';
import { Subject } from 'rxjs/Subject';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {RestService} from 'core';
import {SessionService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {LinkModel} from 'shared/models/link.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {JobLogsModel} from '../job-logs.model';
import {JobSessionModel} from '../job-session.model';
import {JobSessionsModel} from '../job-sessions.model';
import {JobModel} from '../job.model';
import {JobsModel} from '../jobs.model';
import {JobParameterModel, JobParameterNvPairModel} from '../job-parameter.model';
import {JobSchemaModel} from '../job-schema.model';
import {DownloaderComponent} from 'shared/components/downloader/downloader.component';
import {JobLogLoadEndEventParam, JobLogTableComponent} from '../job-log-table/job-log-table.component';
import {BaseModel} from 'shared/models/base.model';
import {MD5} from 'shared/util/md5';
import {SortUtil, Sortable} from 'shared/util/sortable';
import {isNumber, isObject} from 'util';
import {RefreshButtonBasicComponent}
  from 'shared/components/refresh-button/refresh-button-basic/refresh-button-basic.component';
import {JobLogModel} from '../job-log.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'job-table',
  templateUrl: './job-table.component.html',
  styleUrls: ['./job-table.component.scss'],
  providers: [/*RestService*/]
})
export class JobTableComponent implements OnInit, OnDestroy, Sortable {

  static sessionPageSize: number = 10;

  @Output() jobsLoad = new EventEmitter<JobsModel>();

  model: PaginateModel<JobModel>;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  downloader: DownloaderComponent;
  selectableLogTypes: Array<any>;
  selectedLogTypes: Array<any>;
  jobLogTypes: string[];
  dropdownSettings: Object;
  logFilters: Array<FilterModel>;

  private infoTitle: string;
  private subs: Subject<void> = new Subject<void>();
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private lastRunSort: SorterModel;
  private nextRunSort: SorterModel;
  private statusSort: SorterModel;
  private nameSort: SorterModel;
  private showJobSchema: boolean = false;
  private jobSchema: JobSchemaModel;
  private pendingItem: { model: JobModel, action: string };
  private isModelLoading: boolean = false;
  private textActionOptions: string;
  private textStartOptions: string;
  private textCancelOptions: string;
  private textDownloadJobLog: string;
  private textDownloadInit: string;
  private collapseAllSubject: Subject<boolean> = new Subject<boolean>();
  private logTypes: Array<any> = [
    {id: 0, itemName: 'INFO', value: 'INFO'},
    {id: 1, itemName: 'WARN', value: 'WARN'},
    {id: 2, itemName: 'ERROR', value: 'ERROR'},
    {id: 3, itemName: 'DETAIL', value: 'DETAIL'},
    {id: 4, itemName: 'SUMMARY', value: 'SUMMARY'}];

  @ViewChildren(JobLogTableComponent)
  private logTables: QueryList<JobLogTableComponent>;

  @ViewChild(RefreshButtonBasicComponent)
  private autoRefreshBtn: RefreshButtonBasicComponent;

  private locateCtx: {jobId: string, jobSessionId: string, logId: string, running: boolean,
  job?: JobModel, session?: JobSessionModel, log?: JobLogModel, autoRefresh?: boolean};

  private viewLogParams: any;
  private locateMode: boolean = false;
  private enableLocateSessionLog: boolean = false;

  constructor(private translate: TranslateService,
              private restService: RestService) {
    let paginationId: string = `job-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: JobsModel});
  }

  allSessionPaginationInit(dataset: JobsModel): void {
    let me = this;
    (dataset.records || []).forEach(function (item, idx) {
      me.sessionPaginationInit(item, idx);
    });
  }

  sessionPaginationInit(job: JobModel, idx: number): void {
    let paginationSessionId: string = `job-table-session-pagination-${idx}-${(new Date()).valueOf()}`;
    job.metadata['sessionModel'] =  new PaginateModel({id:  paginationSessionId,
      pageSize: JobTableComponent.sessionPageSize,
      classObject: JobSessionsModel});
  }

  sessionPaginationReady(job: JobModel): boolean {
    return !!job.metadata['sessionModel'];
  }

  sessionPaginationModel(job: JobModel): PaginateModel<JobSessionModel> {
    return job.metadata['sessionModel'];
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  loadData(autoRefreshMode?: boolean) {
    let me = this, silent = autoRefreshMode, observable: Observable<JobsModel>;
    if (!me.isModelLoading && !me.isAnyChildLoading(me.model)) {

      me.isModelLoading = true;
      observable = JobsModel.retrieve<JobModel, JobsModel>(JobsModel,
        me.restService, me.filters, me.sorters, me.model.pageStartIndex(), me.model.pageSize());
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          dataset => {
            if (dataset) {
              me.allSessionPaginationInit(dataset);
              if (autoRefreshMode) {
                me.refreshOnDemandJobs(dataset);
              }
              me.model.update(dataset);
            }
            me.isModelLoading = false;
            me.jobsLoad.emit(dataset);
          },
          err => {
            if (!silent)
              me.handleError(err);
            me.model.reset();
            me.isModelLoading = false;
          }
        );
      } else {
        me.isModelLoading = false;
      }
    }
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  trackByLinkModel(idx: number, model: LinkModel) {
    return model.href;
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
    this.refresh();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    } else if (name === 'status') {
      this.sorters = [this.statusSort];
    } else if (name === 'nextFireTime') {
      this.sorters = [this.nextRunSort];
    } else {
      this.sorters = [this.lastRunSort];
    }
  }

  ngOnInit() {
    let me = this;

    me.dropdownSettings = {
      singleSelection: false,
      enableSearchFilter: false,
      enableCheckAll: false
    };
    me.model.itemsPerPage = 50;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.downloader = SessionService.getInstance().context['downloader'];
    me.viewLogParams = me.enableLocateSessionLog ? SessionService.getInstance().context['viewLogParams'] : null;

    // Initialize filters.
    // Refer to ECX 2.x portal, use the following filter for now.
    // filter:[{"property":"serviceId","op":"IN","value": [
    //  ".serviceprovider.catalog.vmware",
    //  "serviceprovider.protection.vmware",
    //  "serviceprovider.recovery.vmware"
    // ]}]
    // TODO: Change it when the job API has new filter support.
    // me.filters = [new FilterModel('serviceId', [
    //   'serviceprovider.catalog.vmware',
    //   'serviceprovider.protection.vmware',
    //   'serviceprovider.recovery.vmware'
    // ], 'IN')];

    // Initialize sorters.
    me.nameSort = new SorterModel('name', 'ASC');
    me.statusSort = new SorterModel('status', 'ASC');
    me.lastRunSort = new SorterModel('lastRunTime', 'DESC');
    me.nextRunSort = new SorterModel('nextFireTime', 'DESC');
    me.sorters = [me.lastRunSort];

    me.selectableLogTypes = me.getLogTypeDropdownList();
    me.jobLogTypes = me.getJobLogTypes();
    me.jobLogTypes = me.jobLogTypes || ['INFO', 'WARN', 'ERROR', 'SUMMARY'];
    me.selectedLogTypes = me.getLogTypeInitSelectedList();
    me.logFilters = me.getLogFilter();

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textDownloadInitiatedMsg',
      'job.textStartOptions',
      'job.textDownloadJobLog',
      'job.textCancelOptions',
      'common.filterJobLogLabel.textWarn',
      'common.filterJobLogLabel.textError',
      'common.filterJobLogLabel.textInfo',
      'common.filterJobLogLabel.textDetail',
      'common.filterJobLogLabel.textSummary']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textStartOptions = resource['job.textStartOptions'];
        me.textCancelOptions = resource['job.textCancelOptions'];
        me.textDownloadJobLog = resource['job.textDownloadJobLog'];
        me.textDownloadInit = resource['common.textDownloadInitiatedMsg'];
        me.logTypes = [
          {id: 0, itemName: resource['common.filterJobLogLabel.textInfo'], value: 'INFO'},
          {id: 1, itemName: resource['common.filterJobLogLabel.textWarn'], value: 'WARN'},
          {id: 2, itemName: resource['common.filterJobLogLabel.textError'], value: 'ERROR'},
          {id: 3, itemName: resource['common.filterJobLogLabel.textDetail'], value: 'DETAIL'},
          {id: 4, itemName: resource['common.filterJobLogLabel.textSummary'], value: 'SUMMARY'}];
        me.selectableLogTypes = me.getLogTypeDropdownList();
        me.jobLogTypes = me.getJobLogTypes();
        me.jobLogTypes = me.jobLogTypes || ['INFO', 'WARN', 'ERROR', 'SUMMARY'];
        me.selectedLogTypes = me.getLogTypeInitSelectedList();
        me.logFilters = me.getLogFilter();
      });
    // Check if need to locate job session or log.
    if (me.enableLocateSessionLog)
      SessionService.getInstance().context['viewLogContainer'] = me;
    if ( me.viewLogParams) {
      let jobId = me.viewLogParams['jobId'];
      let jobSessionId = me.viewLogParams['jobSessionId'];
      let logId = me.viewLogParams['logId'];

      // console.log(`jobid=${jobId}, jobSessionId=${jobSessionId}, logId=${logId}`);
      SessionService.getInstance().context['viewLogParams'] = undefined;
      me.locate(jobId, jobSessionId, logId);
    } else {
      me.loadData();
    }
  }

  ngOnDestroy(): void {

    this.setJobLogTypes(this.jobLogTypes);

    if (this.enableLocateSessionLog)
      SessionService.getInstance().context['viewLogContainer'] = undefined;
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  locate(jobId: string, jobSessionId: string, logId: string): void {
    let me = this;
    me.locateInit(jobId, jobSessionId, logId);
    me.disableAutoRefresh();
    me.locateJob();
  }

  onPageChange(data: number | { page: number, dataset: DatasetModel<any>, link: LinkModel }): void {
    let me = this;
    if (data && !isNumber(data) && data.dataset) {
      me.allSessionPaginationInit(data.dataset as JobsModel);
    }
  }

  onRefresh(dataset: DatasetModel<any>): void {
    let me = this;
    if (dataset) {
      me.collapseAllSubject.next(true);
      me.allSessionPaginationInit(dataset as JobsModel);
    }
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

  private refreshOnDemandJobs(dataset: JobsModel): void {
    let me = this, model = me.model, records = model.records || [], newRecords = dataset ? dataset.records || [] : [];
    newRecords.forEach(function(item) {
      let target = records.find(function (record) {
        return (record.getId() === item.getId());
      });
      if (target) {
        item.metadata = target.metadata;

        // If the corresponding row is expanded then refresh it.
        if (me.isExpanded(target)) {
          item.sessions = target.sessions;
          me.onDetailClick(item, true);
        }
      }
    });
  }
  private refreshOnDemandSessions(job: JobModel, dataset: JobSessionsModel): void {
    let me = this, records = job.sessions || [], newRecords = dataset ? dataset.records || [] : [];
    newRecords.forEach(function(item) {
      let target = records.find(function (record) {
        return (record.getId() === item.getId());
      });
      if (target) {
        item.metadata = target.metadata;
        // If the corresponding row is expanded then refresh it.
        if (me.isExpanded(job, target)) {
          item.logDs = target.logDs;
          me.onLogClick(job, item, true);
        } else {
          item.metadata['autoLoad'] = false;
        }
      }
    });
  }

  private isAnyChildLoading(model?: PaginateModel<JobModel>, job?: JobModel, session?: JobSessionModel): boolean {
    let me = this;
    if (session) {
      return false;
    } else if (job) {
      return (job.sessions || []).findIndex(function (record) {
          return !!(record && me.isLogsLoading(record));
      }) !== -1;
    } else if (model) {
      return (model.records || []).findIndex(function (record) {
        return !!(record && me.isAnyChildLoading(undefined, record));
      }) !== -1;
    }
    return false;
  }

  private isLoading(item: JobModel): boolean {
      if (item) {
        return !!item.metadata['loading'];
      }
      return false;
  }

  private setLoading(loading: boolean, item: JobModel, session?: JobSessionModel): void {
    if (session) {
      session.metadata['loading'] = loading;
    } else if (item) {
      item.metadata['loading'] = loading;
    }
  }

  private onDetailClick(item: JobModel, autoRefreshMode?: boolean): void {
    let me = this, silent = autoRefreshMode, observable: Observable<JobSessionsModel>;
    if (!me.isLoading(item) && !me.isAnyChildLoading(undefined, item)
      && (!item.hasSessions() || autoRefreshMode)) {

      me.setLoading(true, item);

      observable = item.getDataset<JobSessionModel, JobSessionsModel>(JobSessionsModel, 'jobsessions', undefined,
        [new SorterModel('start', 'DESC')],
        me.sessionPaginationReady(item) ? me.sessionPaginationModel(item).pageStartIndex() : 0,
        JobTableComponent.sessionPageSize);
      if (observable) {
        if (autoRefreshMode)
          observable = observable.delay(200);

        observable.takeUntil(me.subs).subscribe(
          dataset => {
            if (dataset) {
              if (autoRefreshMode)
                me.refreshOnDemandSessions(item, dataset);
              item.sessions = dataset.records;
              if (me.sessionPaginationReady(item)) {
                me.sessionPaginationModel(item).update(dataset);
                me.sessionPaginationModel(item).refresh(dataset.total);
              }
            }
            item.metadata['hasNoSessions'] = !item.hasSessions();
            me.setLoading(false, item);
          },
          err => {
            if (!silent)
              me.handleError(err);
            item.sessions = undefined;
            if (me.sessionPaginationReady(item)) {
              me.sessionPaginationModel(item).reset();
            }
            me.setLoading(false, item);
          }
        );
      } else {
        me.setLoading(false, item);
      }
    }
  }

  private onLogClick(job: JobModel, item: JobSessionModel, autoRefreshMode?: boolean): void {
    let me = this, silent = autoRefreshMode, observable: Observable<JobLogsModel>;
    if (!me.isLogsLoading(item) && !me.isAnyChildLoading(undefined, job, item)
      && (!item.hasLogs() || autoRefreshMode)) {

      me.loadLogs(job, item, autoRefreshMode);

    }
  }

  private loadLogs(job: JobModel, jobSession: JobSessionModel, autoRefreshMode?: boolean): void {
    let me = this, target: JobLogTableComponent;
    if (autoRefreshMode) {
      jobSession.metadata['autoLoad'] = true;
    }
    if (me.logTables) {
      target = me.logTables.find(function(item) {
        if (item.belongTo(jobSession)) {
          return true;
        }
      });
      if (target)
        target.loadData(jobSession, autoRefreshMode);
    }
  }

  private isLogsLoading(jobSession: JobSessionModel): boolean {
    let me = this, target: JobLogTableComponent;
    if (me.logTables) {
      target = me.logTables.find(function(item) {
        if (item.belongTo(jobSession)) {
          return true;
        }
      });
      if (target)
        return target.isLoading();
    }
    return !!jobSession.metadata['loading'];
  }

  private getActionLinks(item: JobModel): LinkModel[] {
    let retVal =  item.getActionLinks();
    retVal.forEach(item => { item.title = (item.title) ? item.title : SharedService.formatCamelCase(item.name); });
    return retVal;
  }

  private needActionSchema(item: JobModel, link: LinkModel): boolean {
    return (link.name === 'start' || link.name === 'cancel') && item.hasActionSchema(link.name);
  }

  private onExecuteAction(item: JobModel, link: LinkModel): void {
    this.needActionSchema(item, link) ? this.loadActionSchema(link.name, item) : this.doAction(item, link.name);
  }

  private loadActionSchema(actionName: string, item: JobModel): void {
    let me = this,
      observable = item.getActionSchema(actionName);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.jobSchema = record;
          me.pendingItem = { model: item, action: actionName };
          me.textActionOptions = actionName === 'start' ? me.textStartOptions :
            actionName === 'cancel' ? me.textCancelOptions : undefined;
          me.showJobSchema = true;
        },
        err => me.handleError(err)
      );
    }
  }

  private doAction(item: JobModel, name: string, params?: Array<JobParameterModel>): void {
    let me = this, payload = me.getActionPayload(params),
      observable = item.doAction<JobModel>(JobModel, name, payload);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        updated => {
          if (updated)
            me.refreshDisplayFields(item, updated);
        },
        err => me.handleError(err)
      );

  }

  private getActionPayload(params?: Array<JobParameterModel>): Object {
    let payload;
    if (params) {
      payload = {};
      params.forEach(function (item) {
        let values = [];
        if (item.allowMultipleValues) {
          (item.values || []).forEach(function (value: JobParameterNvPairModel | any) {
            if (value instanceof JobParameterNvPairModel)
              values.push(value.value);
            else
              values.push(value);
          });
          payload[item.key] = values;
        } else {
          if (isObject(item.value))
            payload[item.key] = item.value.value;
          else
            payload[item.key] = item.value;
        }
      });
    }
    return payload;
  }

  private onJobRun(params: Array<JobParameterModel>): void {
    let me = this, item = me.pendingItem, payload = me.getActionPayload(params);
    if (item) {
      me.doAction(item.model, item.action, params);
      me.resetSchemaRelated();
    }
  }

  private resetSchemaRelated(): void {
    let me = this;
    me.jobSchema = undefined;
    me.pendingItem = undefined;
    me.showJobSchema = false;
  }

  private onAbort(): void {
    this.resetSchemaRelated();
  }

  private refresh(): void {
    this.loadData(true);
  }

  private canDownloadLogs(item: JobSessionModel): boolean {
    return item.hasLink('diagnostics');
  }

  private onDownloadLogs(item: JobSessionModel): void {
    let me = this, link = item.getLink('diagnostics');
    me.info(me.textDownloadInit, me.textDownloadJobLog);
    if (me.downloader && link) {
      me.downloader.download(link.href);
    }
  }

  private refreshDisplayFields(target: JobModel, updated: JobModel): void {
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
  }

  private getCollapsibleOperatorId(item: JobModel, session?: JobSessionModel): string {
    return 'job-table-collapsible-icon-' + item.id + (session ? 'session' + session.id : '');
  }

  private getCollapsibleContainerId(item: JobModel, session?: JobSessionModel): string {
    return 'job-table-' + item.id + (session ? 'session' + session.id : '');
  }

  private offParentListeners(item: JobModel): void {
    let me = this, selector = '#' + me.getCollapsibleContainerId(item), element = jQuery(selector);
    if (element) {
      element.off('shown.bs.collapse');
      element.off('hidden.bs.collapse');
    }
  }

  private offChildrenListeners(item: JobModel): void {
    let me = this;
    (item.sessions || []).forEach(function (session) {
      let selector = '#' + me.getCollapsibleContainerId(item, session), element = jQuery(selector);
      if (element) {
        element.off('shown.bs.collapse');
        element.off('hidden.bs.collapse');
      }
    });
  }

  private isExpanded(item: JobModel, session?: JobSessionModel): boolean {
    if (session) {
      return !!(item && item.metadata['expanded'] && session.metadata['expanded']);
    } else if (item) {
      return !!item.metadata['expanded'];
    }
    return false;
  }

  private setExpanded(item: JobModel, session?: JobSessionModel): void {
    if (session) {
      session.metadata['expanded'] = true;
    } else if (item) {
      item.metadata['expanded'] = true;
    }
  }

  private setCollapsed(item: JobModel, session?: JobSessionModel): void {
    if (session) {
      session.metadata['expanded'] = false;
    } else if (item) {
      item.metadata['expanded'] = false;
    }
  }

  private setCollapsibleIcon(operatorId: string, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + operatorId);
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }

  private getDropDownActionId(item: BaseModel): string {
    return 'job-table-dropdown-action-' + MD5.encode(item.getId());
  }

  private getDropDownMenuId(item: BaseModel): string {
    return 'job-table-dropdown-menu-' + MD5.encode(item.getId());
  }

  private isDropDown(item: JobModel): boolean {
    if (item) {
      return !!item.metadata['dropdown'];
    }
    return false;
  }

  private setDropDownClass(operatorId: string, removeClass?: string, addClass?: string): void {
    let element = jQuery('div#' + operatorId);
    if (element) {
      if (addClass)
        element.addClass(addClass);
      if (removeClass)
        element.removeClass(removeClass);
    }
  }

  private toggleDropDown(item: BaseModel): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = !item.metadata['dropdown'];
      if ( item.metadata['dropdown'] )
        me.setCollapsibleIcon(operatorId, 'hide', 'show');
      else
        me.setCollapsibleIcon(operatorId, 'show', 'hide');
    }
  }

  private onClickDropDownOutside(item: BaseModel): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = false;
      me.setCollapsibleIcon(operatorId, 'show', 'hide');
    }
  }

  private onLoadLogsStart(jobSession?: JobSessionModel): void {
    if (jobSession) {
      this.setLoading(true, undefined, jobSession);
    }
  }

  private onLoadLogsEnd(param: JobLogLoadEndEventParam): void {
    if (param && param.jobSession) {
      this.setLoading(false, undefined, param.jobSession);
    }
  }

  private refreshSessionDisplayFields(target: JobSessionModel, updated: JobSessionModel): void {
    target.status = updated.status;
    target.start = updated.start;
    target.end = updated.end;
    target.duration = updated.duration;
    target.properties = updated.properties;
    target.links = updated.links;
  }

  private onExecuteSessionAction(item: JobSessionModel, link: LinkModel): void {
    let me = this, observable;
    me.toggleDropDown(item);
    observable = item.doAction<JobSessionModel>(JobSessionModel, link.name);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        updated => {
          if (updated)
            me.refreshSessionDisplayFields(item, updated);
        },
        err => me.handleError(err)
      );
  }

  private locateInit(jobId: string, jobSessionId: string, logId: string): void {
    let me = this;
    me.locateMode = true;
    me.locateCtx = {
      jobId: jobId,
      jobSessionId: jobSessionId,
      logId: logId,
      running: true
    };
    me.disableAutoRefresh();

    // Reset the selected log types & log filters.
    me.selectedLogTypes = me.getLogTypeInitSelectedList();
    me.logFilters = me.getLogFilter();
  }

  private scrollIntoView(elementId: string): void {
    let arrowDownClass: string = 'ion-chevron-down';
    setTimeout(() => {
      let element;
      if (elementId) {
        element = jQuery('#' + elementId);
        if (element && element[0]) {
          if (!$(element[0]).hasClass(arrowDownClass)) {
            $(element[0]).click();
          }
          this.scrollIntoComponent(element[0], 100, 125, arrowDownClass, 0);
        }
      }
    }, 100);
  }

  private scrollIntoComponent(element: ElementRef, duration: number = 500,
                         minusOffset: number = 150, className: string = 'in',
                         delay: number = 100): void {
    let elRef: ElementRef = (element instanceof ElementRef) ? element : new ElementRef(element);
    if (elRef && elRef.nativeElement &&
      !$(elRef.nativeElement).hasClass(className)) {
      setTimeout(() => {
        $('html, body').animate({
          scrollTop: $(elRef.nativeElement).offset().top - minusOffset
        }, duration);
      }, delay);
    }
  }

  private locateDone(): void {
    let me = this,
      sessionId = me.locateCtx.job ? (me.getCollapsibleOperatorId(me.locateCtx.job, me.locateCtx.session)) : undefined,
      domId = me.locateCtx.job ? (me.getCollapsibleOperatorId(me.locateCtx.job)) : undefined,
      autoRefresh = me.locateCtx.autoRefresh;

    if (domId && sessionId) {
      me.scrollIntoView(sessionId);
      me.scrollIntoView(domId);
    }

    me.locateCtx.running = false;
    me.jobsLoad.emit();
    if (autoRefresh)
      me.enableAutoRefresh();
    me.locateMode = false;
  }

  private locateJobLog(): void {
    let me = this, done = true, session = me.locateCtx.session, logId = me.locateCtx.logId,
      target: JobLogTableComponent;

    if (me.logTables) {
      target = me.logTables.find(function(item) {
        if (item.belongTo(session)) {
          return true;
        }
      });
      if (target) {
        done = false;
        target.locate(logId);
      }
    }
    if (!target) {
      session.metadata['locateLogMode'] = true;
      session.metadata['locateLogId'] = logId;
    }
  }

  private onLogLocated(target: JobLogModel): void {
    let me = this;
    me.locateCtx.log = target;
    me.locateDone();
  }

  private locateJobSession(): void {
    let me = this, job = me.locateCtx.job,
      jobSessionId = me.locateCtx.jobSessionId,
      target: JobSessionModel = (job.sessions || []).find(function (item) {
      return item.id === jobSessionId;
    });
    if (target) {
      me.setExpanded(job, target);
      me.locateCtx.session = target;
      me.locateJobLog();
    } else {
      me.getSessionLocatePage();
    }
  }

  private getJobLocatePage(one?: boolean): void {
    let me = this, jobId = me.locateCtx.jobId,
      observable = JobsModel.retrieve<JobModel, JobsModel>(JobsModel,
      me.restService, one ? [new FilterModel('policyId', jobId, 'IN')] : undefined,
        undefined, me.model.pageStartIndex(), me.model.pageSize());
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {

          if (dataset) {

            me.allSessionPaginationInit(dataset);

            let target = (dataset.records || []).find(function (item) {
              return item.id === jobId;
            });
            if (target) {
              me.setExpanded(target);
              me.locateCtx.job = target;
            }
            if (one) {
              if (target) {
                me.model.records.splice(0, 1, target);
                me.getSessionLocatePage();
              } else {
                me.locateDone();
              }
            } else {
              me.model.update(dataset);

              if (!target) {
                me.getJobLocatePage(true);
              } else {
                me.getSessionLocatePage();
              }
            }
          } else {
            me.locateDone();
          }
        },
        err => {
          if (one)
            me.model.reset();
          me.locateDone();
        }
      );
    }
  }

  private getSessionLocatePage(one?: boolean): void {
    let me = this, job = me.locateCtx.job, jobSessionId = me.locateCtx.jobSessionId,
      observable = job.getDataset<JobSessionModel, JobSessionsModel>(JobSessionsModel,
        'jobsessions',
        one ? [new FilterModel('id', [jobSessionId], 'IN')] : undefined,
        [new SorterModel('start', 'DESC')],
        0, JobTableComponent.sessionPageSize);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            if (!one) {
            }
            let target = (dataset.records || []).find(function (item) {
              return item.id === jobSessionId;
            });
            if (target) {
              me.setExpanded(job, target);
              me.locateCtx.session = target;
            }
            if (one) {
              if (target) {
                job.sessions.splice(0, 1, target);
                me.locateJobLog();
              } else {
                me.locateDone();
              }
            } else {
              job.sessions = dataset.records;
              if (me.sessionPaginationReady(job)) {
                me.sessionPaginationModel(job).update(dataset);
                me.sessionPaginationModel(job).refresh(dataset.total);
              }
              if (!target) {
                me.getSessionLocatePage(true);
              } else {
                me.locateJobLog();
              }
            }
          } else {
            me.locateDone();
          }
        },
        err => {
          if (!one) {
            job.sessions = undefined;
            if (me.sessionPaginationReady(job)) {
              me.sessionPaginationModel(job).reset();
            }
          }
          me.locateDone();
        }
      );
    }
  }

  private locateJob(): void {
    let me = this, jobId = me.locateCtx.jobId, target: JobModel = (me.model.records || []).find(function (job) {
      return job.id === jobId;
    });
    if (target) {
      me.setExpanded(target);
      me.locateCtx.job = target;
      me.locateJobSession();
    } else {
      me.getJobLocatePage();
    }
  }

  private enableAutoRefresh(): void {
    let me = this, autoRefreshBtn = me.autoRefreshBtn;
    if (autoRefreshBtn && !autoRefreshBtn.isEnabled) {
      autoRefreshBtn.isEnabled = true;
      me.locateCtx.autoRefresh = false;
    }
  }

  private disableAutoRefresh(): void {
    let me = this, autoRefreshBtn = me.autoRefreshBtn;
    if (autoRefreshBtn) {
      autoRefreshBtn.isEnabled = false;
      me.locateCtx.autoRefresh = true;
    }
  }

  private getLogTypeDropdownList(): Array<any> {
    return this.logTypes.filter(function (item) {
      return String(item.value).toUpperCase();
    });
  }

  private getLogTypeInitSelectedList(): Array<any> {
    let me = this;
    return this.logTypes.filter(function (item) {
      let target = String(item.value).toUpperCase();
      return (me.jobLogTypes || []).indexOf(target) !== -1;
    });
  }

  private setJobLogTypes(types: string[]): void {
    let session = SessionService.getInstance(), userModel = session.getUserModel();
    session.syncMetadata('jobLogTypes', types);
    userModel.updateMetadata('jobLogTypes', types, this.restService);
  }

  private getJobLogTypes(): string[] {
    let userModel = SessionService.getInstance().getUserModel();
    return userModel && userModel.metadata ?
      userModel.metadata['jobLogTypes'] : null;
  }
}
