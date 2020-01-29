import {Component, Input, Output, OnInit, EventEmitter, OnChanges, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/delay';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent, ErrorHandlerComponent, PagingToolbarComponent} from 'shared/components';
import {RestService, SessionService, HelpService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {JobLogModel} from '../job-log.model';
import {JobLogsModel} from '../job-logs.model';
import {JobSessionModel} from '../job-session.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {BaseModel} from 'shared/models/base.model';
import {SharedService} from 'shared/shared.service';
import { Subject } from 'rxjs/Subject';
import { Sortable, SortUtil } from 'shared/util/sortable';

export class JobLogLoadEndEventParam {
  constructor(public success: boolean, public jobSession?: JobSessionModel, public dataset?: JobLogsModel) {
  }
}

type PagingParam = {
  pageStartIndex: number;
  pageSize: number;
};

@Component({
  selector: 'job-log-table',
  templateUrl: './job-log-table.component.html',
  styleUrls: ['./job-log-table.component.scss'],
  providers: [/*RestService*/]
})
export class JobLogTableComponent implements OnInit, OnDestroy, Sortable, OnChanges {
  @Input() autoLoad: boolean = false;
  @Input() autoRefreshMode: boolean = false;
  @Input() locateMode: boolean = false;
  @Input() locateLogId: string;
  @Input() jobSession: JobSessionModel;
  @Input() filters: Array<FilterModel>;
  @Input() infiniteScrollingMode: boolean = false;
  @Input() jumpToLastPageEnabled: boolean = false;
  @Input() isDifferentJobSessionClicked: boolean = false;

  @Output() loadStart = new EventEmitter<JobSessionModel>();
  @Output() loadEnd = new EventEmitter<JobLogLoadEndEventParam>();
  @Output() logLocated = new EventEmitter<JobLogModel>();

  @ViewChild(PagingToolbarComponent) pagingToolbar: PagingToolbarComponent;
  // @ViewChild('infiniteScrollContainer') infiniteScrollContainer: ElementRef;

  private model: PaginateModel<JobLogModel>;
  private subs: Subject<void> = new Subject<void>();
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private sorters: Array<SorterModel>;
  private isModelLoading: boolean = false;
  private typeSort: SorterModel;
  private logTimeSort: SorterModel;
  private originalPageSize: number = 0;
  private entryStartIndex: number = 0;
  private jumpToPending: boolean = false;
  private loaded: boolean = false;
  private logIdStorage: string[] = [];
  // private messageLinkTypes = ['warn','error']; Until messageid content is filled in for warn
  private messageLinkTypes = ['error'];

  get displayedCount(): number {
    return this.model && this.model.records ? this.model.records.length : 0;
  }

  set infiniteScrollLoadingIndicator(status: boolean) {
    if (this.pagingToolbar)
      this.pagingToolbar.infiniteScrollLoadingIndicator = status;
  }

  set infiniteScrollDisabled(disabled: boolean) {
    if (this.pagingToolbar)
      this.pagingToolbar.infiniteScrollDisabled = disabled;
  }

  constructor(private translate: TranslateService, private restService: RestService, private helpService: HelpService) {
  }

  ngOnChanges(): void {
    if (this.loaded === true) {
      this.loadLogs(this.jobSession, undefined, undefined, true);
    }
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
    this.loadData();
  }

  isLoading(): boolean {
    return this.isModelLoading;
  }

  isMessageLink(job: JobLogModel): boolean {
    return this.messageLinkTypes.indexOf((job.type || '').toLowerCase()) > -1;
  }

  onMessageIdClick(job: JobLogModel): void {
    SharedService.openUrl(this.helpService.getMessageId(job.messageId), job.messageId);
  }

  belongTo(jobSession: JobSessionModel): boolean {
    return this.jobSession && jobSession && this.jobSession.id === jobSession.id;
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  resetLogs(): void {
    let me = this;
    if (me.model) {
      me.model.reset();
      // Reset page size to original size
      me.model.itemsPerPage = me.originalPageSize;
    }
  }

  loadData(jobSession?: JobSessionModel, autoRefreshMode?: boolean, jumpToStartIndex?: number) {
    let me = this, param: PagingParam, jumpTo = jumpToStartIndex !== undefined, startIndex: number,
      silent = autoRefreshMode, observable: Observable<JobLogsModel>,
      jobSessionChanged = false;

    if (jobSession) {
      jobSessionChanged = !me.jobSession || me.jobSession.id !== jobSession.id;
      me.jobSession = jobSession;
    }
    if (me.jobSession) {
      me.loadLogs(me.jobSession, autoRefreshMode, jumpToStartIndex, jobSessionChanged);
      return;
    }

    if (!me.isModelLoading || jobSessionChanged) {

      me.isModelLoading = true;
      me.loadStart.emit();

      param = me.getPagingParam(jumpToStartIndex);
      me.setPagingParam(param);

      // SPP-8740.
      // The user may be confused because of the delayed response of new data and the showing of old data.
      // workaround: If job session changed, immediately clean up the records of model to reflect the change.
      if (jobSessionChanged) {
        me.model.reset();
        // Reset page size to original size
        me.model.itemsPerPage = me.originalPageSize;
      }
      startIndex = jobSessionChanged ? 0 : param.pageStartIndex;
      observable = JobLogsModel.retrieve<JobLogModel, JobLogsModel>(JobLogsModel,
        me.restService, me.filters, me.sorters, startIndex, me.model.pageSize());
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          dataset => {

            me.model.update(dataset);
            me.isModelLoading = false;

            me.entryStartIndex = startIndex;

            if (jumpTo) {
              me.jumpToPending = true;
              me.resetScroll();
            } else {
              me.jumpToPending = false;
            }
            me.infiniteScrollDisabled = false;

            me.loadEnd.emit(new JobLogLoadEndEventParam(true, undefined, dataset));
          },
          err => {
            if (!silent)
              me.handleError(err);
            me.model.reset();
            me.isModelLoading = false;
            me.infiniteScrollDisabled = false;

            me.loadEnd.emit(new JobLogLoadEndEventParam(false));
          }
        );
      } else {
        me.isModelLoading = false;
        me.infiniteScrollDisabled = false;
        me.loadEnd.emit(new JobLogLoadEndEventParam(false));
      }
    } else {
      me.infiniteScrollDisabled = false;
    }
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  ngOnInit() {
    let me = this,
      paginationId: string = `job-log-table-pagination-${(new Date()).valueOf()}`;

    if (me.jobSession)
      paginationId += me.jobSession.id;

    me.model = new PaginateModel({id: paginationId, classObject: JobLogsModel});
    me.model.itemsPerPage = 25;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    me.originalPageSize = me.model.pageSize();

    // Initialize sorters.
    me.typeSort = new SorterModel('type', 'ASC');
    me.logTimeSort = new SorterModel('logTime', 'ASC');
    me.sorters = [new SorterModel('logTime', 'ASC')];

    if (me.jobSession && me.jobSession.logDs) {
      me.model.update(me.jobSession.logDs);
      me.model.currentPage = me.jobSession.logDs.page || 1;
    }

    if (me.locateMode) {
      me.locate(me.locateLogId);
    } else if (me.autoLoad) {
      me.loadData(undefined, me.autoRefreshMode);
    }
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
    this.logIdStorage = [];
  }

  locate(logId: string): void {
    let me = this, target: JobLogModel = (me.model.records || []).find(function (log) {
      return log.id === logId;
    });
    if (target) {
      me.logLocated.emit(target);
    } else {
      me.model.reset();
      me.getLogLocatePage(logId);
    }
  }

  applyFilters(jobFilters: Array<FilterModel>, preventLoadData?: boolean): void {
    let typeFilterValues = [];
    // workaround for backend filters. Add filter value into value array instead of separate filter.
    (jobFilters || []).forEach((filter: FilterModel) => {
      typeFilterValues.push(filter.value);
    });
    this.filters = [];
    this.filters.push(new FilterModel('type', typeFilterValues, 'IN'));
    if (!preventLoadData)
      this.loadData();
  }

  onBeforeRefresh(ismode: boolean): void {
    this.infiniteScrollDisabled = true;
    this.entryStartIndex = 0;
    this.model.itemsPerPage = this.originalPageSize;
  }

  onJumpTo(entryNum: number): void {
    this.infiniteScrollDisabled = true;
    this.loadData(undefined, undefined, entryNum - 1);
  }

  onScrollDown(): void {
    this.onInfiniteScroll(false);
  }

  onScrollUp(): void {
    if (this.jumpToPending) {
      this.jumpToPending = false;
      return;
    }
    this.onInfiniteScroll(true);
  }

  private onInfiniteScroll(up: boolean): void {
    let me = this, pageStartIndex, jobSession = me.jobSession, observable: Observable<JobLogsModel>;

    if (!jobSession || !up && !me.hasNextPage() || up && !me.hasPrevPage())
      return;

    me.isModelLoading = true;

    me.infiniteScrollLoadingIndicator = true;
    if (!up) {
      me.model.currentPage++;
    }

    pageStartIndex = me.infiniteScrollPageStartIndex(up);

    observable = jobSession.getDataset<JobLogModel, JobLogsModel>(JobLogsModel, 'log', me.filters,
      me.sorters, pageStartIndex, me.infiniteScrollPageSize(up));
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.model.refresh(dataset.total);
            up ? me._onScrollUp(dataset) : me._onScrollDown(dataset);
          }
          if (up)
            me.entryStartIndex = pageStartIndex;

          me.infiniteScrollLoadingIndicator = false;
          me.isModelLoading = false;
        },
        err => {
          me.infiniteScrollLoadingIndicator = false;
          me.isModelLoading = false;
          me.handleError(err);
        }
      );
    } else {
      me.infiniteScrollLoadingIndicator = false;
      me.isModelLoading = false;
    }
  }

  private hasPrevPage(): boolean {
    return this.entryStartIndex > 0;
  }

  private hasNextPage(): boolean {
    return this.entryStartIndex + this.displayedCount < this.model.totalItems;
  }

  private infiniteScrollPageStartIndex(up: boolean): number {
    let me = this, pageSize = me.model.pageSize();
    return up ? (me.entryStartIndex >= pageSize ? me.entryStartIndex - pageSize : 0 ) :
      me.entryStartIndex + me.displayedCount;
  }

  private infiniteScrollPageSize(up: boolean): number {
    let me = this, pageSize = me.model.pageSize();
    return up ? (me.entryStartIndex >= pageSize ? pageSize : me.entryStartIndex) : pageSize;
  }

  private getLogLocatePage(logId: string): void {
    let me = this, jobSession = me.jobSession,
      observable = jobSession.getDataset<JobLogModel, JobLogsModel>(JobLogsModel, 'log', me.filters,
      me.sorters,
      me.model.pageStartIndex(), me.model.pageSize());
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {

          if (dataset) {
            let target = (dataset.records || []).find(function (item) {
              return item.id === logId;
            });
            if (target || logId === undefined) { // Support locate the first page.
              me.model.update(dataset);
              me.logLocated.emit(target);
            } else {
              me.model.currentPage++;
              me.getLogLocatePage(logId);
            }
          } else {
            me.logLocated.emit();
          }
        },
        err => {
          me.model.reset();
          me.logLocated.emit();
        }
      );
    } else {
      me.logLocated.emit();
    }
  }

  private resetScroll(): void {
    if (this.pagingToolbar)
      this.pagingToolbar.scrollToTop();
  }

  private getPagingParam(jumpToStartIndex?: number): PagingParam {
    let me = this, result: PagingParam = { pageStartIndex: me.model.pageStartIndex(), pageSize: me.model.pageSize()},
      jumpTo = jumpToStartIndex !== undefined,
      startIndex = jumpTo ?  jumpToStartIndex : me.entryStartIndex;

    if (me.infiniteScrollingMode) {
      result.pageStartIndex = startIndex;
      result.pageSize = Math.max(me.displayedCount, result.pageSize);
    }
    return result;
  }

  private setPagingParam(param: PagingParam): void {
    let me = this;
    me.model.itemsPerPage = param.pageSize;
    if (me.infiniteScrollingMode)
      me.model.currentPage = 1;
  }

  private isJobSessionIdentical(session: JobSessionModel): boolean {
    let me = this, latestJobSession = me.jobSession;
    return latestJobSession && latestJobSession.id === session.id;
  }

  private loadLogs(jobSession: JobSessionModel, autoRefreshMode?: boolean, jumpToStartIndex?: number,
                   resetPageStartIndex?: boolean): void {
    let me = this, param: PagingParam, jumpTo = jumpToStartIndex !== undefined, startIndex: number,
      silent = autoRefreshMode, observable: Observable<JobLogsModel>;
    
    me.loaded=true;

    if (!me.isModelLoading || resetPageStartIndex) {
      me.isModelLoading = true;
      me.loadStart.emit(jobSession);

      param = me.getPagingParam(jumpToStartIndex);
      me.setPagingParam(param);

      // SPP-8740.
      // The user may be confused because of the delayed response of new data and the showing of old data.
      // workaround: If resetPageStartIndex is true, immediately clean up the records of model to reflect the change.
      if (resetPageStartIndex) {
        me.model.reset();
        // Reset page size to original size
        me.model.itemsPerPage = me.originalPageSize;
      }

      startIndex = resetPageStartIndex ? 0 : param.pageStartIndex;
      observable = jobSession.getDataset<JobLogModel, JobLogsModel>(JobLogsModel, 'log', me.filters,
        me.sorters,
        startIndex, me.model.pageSize());
      if (observable) {
        if (autoRefreshMode)
          observable = observable.delay(200);
        observable.takeUntil(me.subs).subscribe(
          dataset => {

            if (resetPageStartIndex && !me.isJobSessionIdentical(jobSession)) {
              // SPP-8740.
              // If current job session isn't identical to the latest job session, abandon the data.
              // Need more test.
            } else {
              jobSession.logDs = dataset;
              me.model.update(dataset);

              me.entryStartIndex = startIndex;
            }
            me.isModelLoading = false;


            if (jumpTo) {
              me.jumpToPending = true;
              me.resetScroll();
            } else {
              me.jumpToPending = false;
            }
            me.infiniteScrollDisabled = false;

            me.loadEnd.emit(new JobLogLoadEndEventParam(true, jobSession, dataset));
          },
          err => {
            if (resetPageStartIndex && !me.isJobSessionIdentical(jobSession)) {
              // SPP-8740.
              // If current job session isn't identical to the latest job session, abandon the data.
              // Need more test.
            } else {
              if (!silent)
                me.handleError(err);
              jobSession.logDs = undefined;
              me.model.reset();
            }
            me.isModelLoading = false;
            me.infiniteScrollDisabled = false;
            me.loadEnd.emit(new JobLogLoadEndEventParam(false, jobSession));
          }
        );
      } else {
        me.isModelLoading = false;
        me.infiniteScrollDisabled = false;
        me.loadEnd.emit(new JobLogLoadEndEventParam(false, jobSession));
      }
    } else {
      me.infiniteScrollDisabled = false;
    }
  }

  private onPageChange(param: { page: number, dataset: DatasetModel<any> }): void {
    let me = this, dataset: JobLogsModel = <JobLogsModel> param.dataset;
    if (me.jobSession)
      me.jobSession.logDs = dataset;
    me.infiniteScrollDisabled = false;
    if (param.page && me.model)
      me.entryStartIndex = (param.page - 1) * me.model.pageSize();
    me.loadEnd.emit(new JobLogLoadEndEventParam(true, me.jobSession, dataset));
  }

  private ellipsisPath(value: string, length: number): string {
    return SharedService.ellipsisPath(value, length);
  }

  private changeSorter(name: string): void {
    if (name === 'type') {
      this.sorters = [this.typeSort];
    } else if (name === 'logTime') {
      this.sorters = [this.logTimeSort];
    }
  }

  private _onScrollDown(model: JobLogsModel): void {
    let me = this,
      count = me.getModelRecordCount(model);
    if (count > 0) {
      me.appendPageRecords(model);
    }
  }

  private _onScrollUp(model: JobLogsModel): void {
    let me = this,
      count = me.getModelRecordCount(model);
    if (count > 0) {
      me.prependPageRecords(model);
    }
  }

  private addPageRecords(up: boolean, model: JobLogsModel): void {
    let me = this;
    if (up) {
      me.model.records.unshift(...(model.records || []).reverse());
    } else {
      me.model.records.push(...(model.records || []));
    }
  }

  private prependPageRecords(model: JobLogsModel): void {
    this.addPageRecords(true, model);
  }

  private appendPageRecords(model: JobLogsModel): void {
    this.addPageRecords(false, model);
  }

  private getModelRecordCount(model: JobLogsModel): number {
    return model && model.records ? model.records.length : 0;
  }

  private getLogId(log: JobLogModel, i: number) {
    let me = this;
    if (me.logIdStorage.indexOf(log.id) < 0) {
      me.logIdStorage.push(log.id);
    } else {
      me.logIdStorage.splice(me.logIdStorage.indexOf(log.id), 1);
    }
  }
}
