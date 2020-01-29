import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SorterModel } from 'shared/models/sorter.model';
import { Subject } from 'rxjs/Subject';
import { BaseModel } from 'shared/models/base.model';
import { JobSessionsModel } from 'job/shared/job-sessions.model';
import { DownloaderComponent } from 'shared/components/downloader/downloader.component';
import { JobSessionModel } from 'job/shared/job-session.model';
import {AlertComponent, ErrorHandlerComponent, PagingToolbarComponent} from 'shared/components';
import { RestService, SessionService } from 'core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { FilterModel } from 'shared/models/filter.model';
import { PaginateModel } from 'shared/models/paginate.model';
import { SortUtil } from 'shared/util/sortable';
import { Selectable } from 'shared/util/selectable';
import { applyMixins } from 'rxjs/util/applyMixins';
import { MonitorSharedService } from '../../monitor-shared.service';
import {SharedService} from 'shared/shared.service';
import { FilterCatagoriesModel, FilterCatagoryModel } from 'shared/components/filter-dropdown/filter-catagories.model';
import { FilterDropdownComponent } from 'shared/components/filter-dropdown/filter-dropdown.component';
import * as _ from 'lodash';

type PagingParam = {
  pageStartIndex: number;
  pageSize: number;
};

@Component({
  selector: 'job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit, Selectable {
  static sessionPageSize: number = 10;
  static logTyps: Array<any> = [
    {id: 0, itemName: 'INFO'},
    {id: 1, itemName: 'WARN'},
    {id: 2, itemName: 'ERROR'},
    {id: 3, itemName: 'DETAIL'}];

  @ViewChild(FilterDropdownComponent) filterComponent: FilterDropdownComponent;
  @ViewChild(PagingToolbarComponent) pagingToolbar: PagingToolbarComponent;
  @Output() jobsLoad = new EventEmitter<JobSessionsModel>();
  @Output() selectionChange = new EventEmitter();
  @Output() differentJobSessionClicked = new EventEmitter<Boolean>();
  @Output() alertSession = new EventEmitter<JobSessionModel>();
  @Input() isHistory: boolean = false;
  @Input() filterCatagories: Array<FilterCatagoriesModel> = [];
  @Input() hideChart: boolean = false;

  model: PaginateModel<JobSessionModel>;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  downloader: DownloaderComponent;
  dropdownSettings: Object;
  isSelected: (item: BaseModel, singleSelect: boolean) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent, singleSelect: boolean) => void;
  selectedItems: Array<JobSessionModel> = [];

  private infoTitle: string;
  private subs: Subject<void> = new Subject<void>();

  private filters: Array<FilterModel>;
  private searchFilter: Array<FilterModel> = [];
  private sorters: Array<SorterModel>;
  private activeSorter: SorterModel;
  private runningSorters: Array<SorterModel>;
  private historySorters: Array<SorterModel>;
  private lastRunSort: SorterModel;
  private durationSort: SorterModel;
  private statusSort: SorterModel;
  private typeSort: SorterModel;
  private nameSort: SorterModel;
  private isModelLoading: boolean = false;
  private textStartOptions: string;
  private textCancelOptions: string;
  private textDownloadJobLog: string;
  private textSearchFor: string;
  private textDownloadInit: string;

  private autoRefreshState: boolean = true;
  private originalPageSize: number = 0;
  private entryStartIndex: number = 0;
  private jumpToPending: boolean = false;

  private runningJobs: boolean = true;
  private isDifferentJobSessionClicked: boolean = false;

  private DEFAULT_RUNNING_STATUS_FILTER = new FilterModel('status', ['RUNNING', 'PENDING', 'HELD', 'CANCELING'], 'IN');
  private DEFAULT_HISTORY_STATUS_FILTER = new FilterModel('status', ['COMPLETED', 'PARTIAL', 'FAILED', 'ABORTED', 'CANCELLED'], 'IN');

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

  constructor(private translate: TranslateService,
              private sharedMonitorService: MonitorSharedService,
              private restService: RestService) {
    let paginationId: string = `job-list-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: JobSessionsModel});
    this.originalPageSize = this.model.pageSize();
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

  loadData(silent: boolean = false, selectFirstItem: boolean = true, jumpToStartIndex?: number,
           locating?: boolean,
           locatingJobSession?: JobSessionModel) {
    let me = this, param: PagingParam, jumpTo = jumpToStartIndex !== undefined, startIndex: number,
      observable: Observable<JobSessionsModel>;
    if (!me.isModelLoading || locating) {

      me.isModelLoading = true;

      param = me.getPagingParam(silent, jumpToStartIndex);
      me.setPagingParam(param);

      startIndex = locating ? 0 : param.pageStartIndex;

      observable = JobSessionsModel.retrieve<JobSessionModel, JobSessionsModel>(JobSessionsModel,
        me.restService, me.filters.concat(me.searchFilter), [me.activeSorter],
        startIndex, me.model.pageSize());
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          dataset => {
            if (dataset) {
              me.model.update(dataset);
            }
            if (!locating) {
              if (me.model.records.length > 0) {
                if (selectFirstItem) {
                  me.selectedItems = [me.model.records[0]];
                } else {
                  me.selectedItems = me.selectedItems.length > 0
                    ? me.selectedItems
                    : [me.model.records[0]];
                }
              } else {
                me.selectedItems = [];
              }
            } else {
              me.locate(locatingJobSession);
            }

            me.sharedMonitorService.getJobSession(me.selectedItems.length > 0 ? me.selectedItems[0] : undefined);
            me.isModelLoading = false;

            me.entryStartIndex = startIndex;

            if (jumpTo) {
              me.jumpToPending = true;
              me.resetScroll();
            } else {
              me.jumpToPending = false;
            }
            me.infiniteScrollDisabled = false;

            me.jobsLoad.emit(dataset);

            me.runningJobs =  Array.isArray(this.model.records) && this.model.records.length > 0;
          },
          err => {
            if (!silent)
              me.handleError(err);
            me.model.reset();
            me.isModelLoading = false;
            me.infiniteScrollDisabled = false;
          }
        );
      } else {
        me.isModelLoading = false;
        me.infiniteScrollDisabled = false;
      }
    } else {
      me.infiniteScrollDisabled = false;
    }
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  isAsc(name: string): boolean {
    return SortUtil.has(this.sorters, name, false);
  }

  isDesc(name: string): boolean {
    return SortUtil.has(this.sorters, name, true);
  }

  ngOnInit() {
    let me = this;
    me.dropdownSettings = {
      singleSelection: false,
      enableSearchFilter: false,
      enableCheckAll: false
    };
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.downloader = SessionService.getInstance().context['downloader'];

    // Initialize filters and sorters.
    if (!me.isHistory){
      me.filters = [ me.DEFAULT_RUNNING_STATUS_FILTER ];
    } else {
      me.filters = [ me.DEFAULT_HISTORY_STATUS_FILTER ];
    }

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textDownloadInitiatedMsg',
      'common.sorters.textStart',
      'common.sorters.textDuration',
      'common.sorters.textStatus',
      'common.sorters.textType',
      'common.sorters.textJobName',
      'job.textStartOptions',
      'job.textSearchFor',
      'job.textDownloadJobLog',
      'job.textCancelOptions']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textStartOptions = resource['job.textStartOptions'];
        me.textCancelOptions = resource['job.textCancelOptions'];
        me.textDownloadJobLog = resource['job.textDownloadJobLog'];
        me.textSearchFor = resource['job.textSearchFor'];
        me.textDownloadInit = resource['common.textDownloadInitiatedMsg'];
        me.setExternalizeMessages(
          resource['common.sorters.textJobName'],
          resource['common.sorters.textStatus'],
          resource['common.sorters.textType'],
          resource['common.sorters.textStart'],
          resource['common.sorters.textDuration']
         );
      });
      // Only initial once, incase user navigate to another part or app detect subscribe first
      if (!me.nameSort && !me.statusSort && !me.typeSort && !me.lastRunSort && !me.durationSort) {
        me.setExternalizeMessages('', '', '', '', '');
      }
      me.selectionChange.takeUntil(me.subs).subscribe(
        (selectedItems: Array<JobSessionModel>) => {
          me.sharedMonitorService.getJobSession(selectedItems[0]);
        }
      );
  }

  ngOnDestroy(): void {
    SessionService.getInstance().context['viewLogContainer'] = undefined;
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  setExternalizeMessages(jobName: string, status: string, type: string, start: string, duration: string) {
    let me = this;
    me.nameSort = new SorterModel('jobName', 'ASC', jobName);
    me.statusSort = new SorterModel('status', 'ASC', status);
    me.typeSort = new SorterModel('type', 'ASC', type);
    me.lastRunSort = new SorterModel('start', 'DESC', start);
    me.durationSort = new SorterModel('duration', 'DESC', duration);
    me.runningSorters = [me.lastRunSort, me.typeSort, me.durationSort, me.nameSort];
    me.historySorters = [me.lastRunSort, me.typeSort, me.statusSort, me.nameSort, me.durationSort];
    me.sorters = me.runningSorters;
    me.activeSorter = me.runningSorters[0];
  }

  setFilters(jobFilters: Array<FilterModel>) {
    let filterSet: Set<string> = new Set<string>();
    this.filters = jobFilters;
    if (this.filterComponent) {
      (this.filters || []).forEach((filter: FilterModel) => {
        filterSet.add(filter.value);
      });
      this.filterComponent.setValue(filterSet);
    }
    this.refresh(true, true);
  }

  applyFilters(jobFilters: Array<FilterModel>): void {
    let statusFilterValues = [],
        typeFilterValues = [],
        dateFilters: Array<FilterModel> = [];
    // workaround for backend filters. Add filter value into value array instead of separate filter.
    (jobFilters || []).forEach((filter: FilterModel) => {
      if (filter.property === 'status') {
        statusFilterValues.push(filter.value);
      } else if (filter.property === 'type') {
        typeFilterValues.push(filter.value);
      }
      if (statusFilterValues.indexOf('PARTIAL') != -1) {
        statusFilterValues.push('CANCELLED', 'ABORTED');
      }
    });
    // lets store the date filters
    (this.filters || []).forEach((filter: FilterModel) => {
      if (filter.property === 'range' || filter.property === 'rangeunit')
        dateFilters.push(filter);
    });
    this.filters = dateFilters;

    if (statusFilterValues.length > 0) {
      this.filters.push(new FilterModel('status', statusFilterValues, 'IN'));
    }  else if (!this.isHistory) {
      this.filters.push(this.DEFAULT_RUNNING_STATUS_FILTER);
    }

    if (typeFilterValues.length > 0) {
      this.filters.push(new FilterModel('type', typeFilterValues, 'IN'));
    }

    this.refresh(true, true);
  }

  startSearch(namePattern: string) {
    if (namePattern && namePattern.trim().length > 0)
      this.searchFilter = [new FilterModel('jobName', SharedService.wildcardEx(namePattern.trim()))];
    else {
      this.searchFilter = [];
    }
    this.refresh(false, true);
  }

  switchSorters(type: string) {
    if (type === 'runningJobs') {
      this.sorters = this.runningSorters;
      this.activeSorter = this.sorters[0];
    } else {
      this.sorters = this.historySorters;
      this.activeSorter = this.sorters[0];
    }
  }

  reverseSorter() {
    if (this.activeSorter.direction === 'DESC'){
      this.activeSorter.direction = 'ASC';
    } else {
      this.activeSorter.direction = 'DESC';
    }
    this.refresh();
  }

  onChangeSort(sorter: SorterModel){
    if (this.activeSorter !== sorter){
      this.activeSorter = sorter;
      this.refresh();
    }
  }

  getLinkDisplayName(value: string): string {
    return SharedService.formatCamelCase(value);
  }

  public locate(session: JobSessionModel): void {
    let me = this, jobSessionId, jobSession: JobSessionModel,
      observable: Observable<JobSessionModel>;

    if (!session)
      return;

    jobSessionId = session.id;

    if (me.model && Array.isArray(me.model.records) && me.model.records.length > 0) {
      jobSession = me.model.records.find((item: JobSessionModel) => {
        return jobSessionId === item.id;
      });
    }
    if (jobSession) {
      me.selectedItems = [jobSession];
    } else {
      me.selectedItems = [session];
      me.model.records.splice(0, 1, session);
    }
  }

  public getJobSessionInstance(jobSessionId: string): void {
    let me = this, jobSession: JobSessionModel,
      observable: Observable<JobSessionModel>;

    me.autoRefreshState = false;
    if (me.model && Array.isArray(me.model.records) && me.model.records.length > 0) {
      jobSession = me.model.records.find((session: JobSessionModel) => {
        return jobSessionId === session.id;
      });
    }
    if (jobSession) {
      me.alertSession.emit(jobSession);
    } else {
      observable = me.sharedMonitorService.getSingleJobSession(jobSessionId);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          (session: JobSessionModel) => {
            session.proxy = me.restService;
            me.alertSession.emit(session);
          }
        );
      }
    }
  }

  public refresh(silent?: boolean, selectFirstItem?: boolean): void {
    this.loadData(silent || true, selectFirstItem || false);
  }

  onBeforeRefresh(ismode: boolean): void {
    this.infiniteScrollDisabled = true;
    this.entryStartIndex = 0;
    this.model.itemsPerPage = this.originalPageSize;
  }

  onJumpTo(entryNum: number): void {
    this.infiniteScrollDisabled = true;
    this.loadData(false, true, entryNum - 1);
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
    let me = this, pageStartIndex, observable: Observable<JobSessionsModel>;

    if (!up && !me.hasNextPage() || up && !me.hasPrevPage())
      return;

    me.isModelLoading = true;

    me.infiniteScrollLoadingIndicator = true;
    if (!up) {
      me.model.currentPage++;
    }

    pageStartIndex = me.infiniteScrollPageStartIndex(up);

    observable = JobSessionsModel.retrieve<JobSessionModel, JobSessionsModel>(JobSessionsModel,
      me.restService, me.filters.concat(me.searchFilter), [me.activeSorter],
      pageStartIndex, me.infiniteScrollPageSize(up));
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

  private _onScrollDown(model: JobSessionsModel): void {
    let me = this,
      count = me.getModelRecordCount(model);
    if (count > 0) {
      me.appendPageRecords(model);
    }
  }

  private _onScrollUp(model: JobSessionsModel): void {
    let me = this,
      count = me.getModelRecordCount(model);
    if (count > 0) {
      me.prependPageRecords(model);
    }
  }

  private addPageRecords(up: boolean, model: JobSessionsModel): void {
    let me = this;
    if (up) {
      me.model.records.unshift(...(model.records || []).reverse());
    } else {
      me.model.records.push(...(model.records || []));
    }
  }

  private prependPageRecords(model: JobSessionsModel): void {
    this.addPageRecords(true, model);
  }

  private appendPageRecords(model: JobSessionsModel): void {
    this.addPageRecords(false, model);
  }

  private getModelRecordCount(model: JobSessionsModel): number {
    return model && model.records ? model.records.length : 0;
  }

  private getPagingParam(autoRefreshMode?: boolean, jumpToStartIndex?: number): PagingParam {
    let me = this, result: PagingParam = { pageStartIndex: me.model.pageStartIndex(), pageSize: me.model.pageSize()},
      jumpTo = jumpToStartIndex !== undefined,
      startIndex = jumpTo ? jumpToStartIndex : me.entryStartIndex;

    if (autoRefreshMode || jumpTo) {
      result.pageStartIndex = startIndex;
      result.pageSize = Math.max(me.displayedCount, result.pageSize);
    }
    return result;
  }

  private setPagingParam(param: PagingParam): void {
    let me = this;
    me.model.itemsPerPage = param.pageSize;
    me.model.currentPage = 1;
  }

  private resetScroll(): void {
    if (this.pagingToolbar)
      this.pagingToolbar.scrollToTop();
  }


  private toggleSelectJobSession() {
    this.isDifferentJobSessionClicked = !this.isDifferentJobSessionClicked;
    this.differentJobSessionClicked.emit(this.isDifferentJobSessionClicked);
  }
}
applyMixins(JobListComponent, [Selectable]);
