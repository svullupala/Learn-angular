import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MonitorSharedService } from '../../monitor-shared.service';
import { JobSessionModel } from 'job/shared/job-session.model';
import { JobLogTableComponent } from 'job/shared/job-log-table';
import { JobLogLoadEndEventParam } from 'job/shared/job-log-table/job-log-table.component';
import { Subject, Observable } from 'rxjs';
import { SessionService } from 'core';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { TranslateService } from '@ngx-translate/core';
import { DownloaderComponent } from 'shared/components/downloader/downloader.component';
import {
  FilterCatagoriesModel,
  FilterCatagoryModel
} from 'shared/components/filter-dropdown/filter-catagories.model';
import { FilterModel } from 'shared/models/filter.model';
import { LinkModel } from 'shared/models/link.model';
import { JobModel } from 'job/shared/job.model';
import { BaseModel } from 'shared/models/base.model';
import { MD5 } from 'shared/util/md5';
import { JobSessionTableComponent } from '../job-session-table/job-session-table.component';
import { SharedService } from 'shared/shared.service';
import { LocaleService } from 'shared/locale.service';
import { JobSchemaModel } from 'job/shared/job-schema.model';
import { JobParameterModel, JobParameterNvPairModel } from 'job/shared/job-parameter.model';
import { isObject } from 'util';
import { ProgressTableComponent } from '../progress-table/progress-table.component';

@Component({
  selector: 'job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss']
})
export class JobDetailsComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild(JobLogTableComponent) logTable: JobLogTableComponent;
  @ViewChild(JobSessionTableComponent) sessionTable: JobSessionTableComponent;
  @ViewChild(ProgressTableComponent) progressTable: ProgressTableComponent;
  @Input() isHistory: boolean = false;
  @Input() isDifferentJobSessionClicked: boolean = false;
  @Output() expandClicked = new EventEmitter<boolean>();
  @Output() rerunJobEvent: EventEmitter<void> = new EventEmitter<void>();
  private jobLogTypes: string[];
  private progressVmsTypes: string[];
  private filterCatagories: Array<FilterCatagoriesModel> = [];
  private progressFilterCategories: Array<FilterCatagoriesModel> = [];
  private downloader: DownloaderComponent;
  private jobSession: JobSessionModel = new JobSessionModel();
  private jobLog: JobLogLoadEndEventParam;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private subs: Subject<void> = new Subject<void>();
  private textDownloadJobLog: string;
  private textDownloadInit: string;
  private textRerunConfirmation: string;
  private textRerun: string;
  private tabContentDisplayed: string = undefined;
  private expandJobLog: boolean = false;
  private isHistoryOld: boolean = false;
  private isJobLogMasked: boolean = false;
  private showJobSchema: boolean = false;
  private jobSchema: JobSchemaModel;
  private pendingItem: { model: JobSessionModel; action: string };
  private textStartOptions: string = 'Start Options';
  private textCancelOptions: string = 'Cancel Options';
  private textActionOptions: string = 'Action Options';

  constructor(private sharedMonitorService: MonitorSharedService, private translate: TranslateService) {}

  get hasJobSession(): boolean {
    return !!this.jobSession && !this.jobSession.phantom;
  }

  get showLogFilters(): boolean {
    return this.hasJobSession && this.tabContentDisplayed === 'JOB_LOG';
  }

  get showProgressFilters(): boolean {
    return this.hasJobSession && this.tabContentDisplayed === 'PROGRESS';
  }

  get totalOperations(): number {
    return this.jobLog && this.jobLog.dataset ? this.jobLog.dataset.total : 0;
  }

  ngOnInit() {
    let me = this;
    me.jobLogTypes = me.getJobLogTypes();
    me.jobLogTypes = me.jobLogTypes || ['WARN', 'ERROR', 'SUMMARY'];
    me.progressVmsTypes = ['running'];

    this.translate
      .get([
        'job.textDownloadJobLog',
        'job.textRerunConfirmation',
        'job.textCancelOptions',
        'job.textStartOptions',
        'common.textRerunFailed',
        'common.textDownloadInitiatedMsg'
      ])
      .takeUntil(this.subs)
      .subscribe(stringObj => {
        this.textDownloadJobLog = stringObj['job.textDownloadJobLog'];
        this.textDownloadInit = stringObj['common.textDownloadInitiatedMsg'];
        this.textRerunConfirmation = stringObj['job.textRerunConfirmation'];
        this.textRerun = stringObj['common.textRerunFailed'];
        this.textCancelOptions = stringObj['job.textCancelOptions'];
        this.textStartOptions = stringObj['job.textStartOptions'];

        // initialize filter component
        let typeFilterCatagory: Array<FilterCatagoryModel> = [
          new FilterCatagoryModel(
            'job.textStatusInfo',
            me.jobLogTypes.indexOf('INFO') !== -1,
            'type',
            'INFO'
          ),
          new FilterCatagoryModel(
            'common.textDetail',
            me.jobLogTypes.indexOf('DEBUG') !== -1,
            'type',
            'DEBUG'
          ),
          new FilterCatagoryModel(
            'job.textStatusError',
            me.jobLogTypes.indexOf('ERROR') !== -1,
            'type',
            'ERROR'
          ),
          new FilterCatagoryModel(
            'common.textSummary',
            me.jobLogTypes.indexOf('SUMMARY') !== -1,
            'type',
            'SUMMARY'
          ),
          new FilterCatagoryModel(
            'common.warningTitle',
            me.jobLogTypes.indexOf('WARN') !== -1,
            'type',
            'WARN'
          )
        ];
        this.filterCatagories = [new FilterCatagoriesModel('job.textJobLog', typeFilterCatagory)];

        let typeProgressFilterCategory: Array<FilterCatagoryModel> = [
          new FilterCatagoryModel(
            'job.textComplete',
            me.progressVmsTypes.indexOf('complete') !== -1,
            'status',
            'complete'
          ),
          new FilterCatagoryModel(
            'job.textPartial',
            me.progressVmsTypes.indexOf('partial') !== -1,
            'status',
            'partial'
          ),
          new FilterCatagoryModel(
            'job.textFailed',
            me.progressVmsTypes.indexOf('failed') !== -1,
            'status',
            'failed'
          ),
          new FilterCatagoryModel(
            'job.textRunning',
            me.progressVmsTypes.indexOf('running') !== -1,
            'status',
            'running'
          )
        ];
        this.progressFilterCategories = [
          new FilterCatagoriesModel('job.textProgress', typeProgressFilterCategory)
        ];
      });
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.downloader = SessionService.getInstance().context['downloader'];
    this.tabContentDisplayed = this.isProgressTabDisplayed() ? 'PROGRESS' : 'JOB_LOG';
  }

  ngAfterViewInit() {
    this.sharedMonitorService.getJobSessionSub
      .takeUntil(this.subs)
      .subscribe((jobSession: JobSessionModel) => {
        if (!this.isJobSessionIdentical(jobSession)) {
          this.resetLogs();
        }
        this.jobSession = jobSession;
        if (this.logTable && this.jobSession) {
          this.logTable.loadData(this.jobSession);
          this.sessionTable.loadData(this.jobSession);
          if (this.progressTable) {
            this.progressTable.loadData(this.jobSession);
          }
        }
      });
    // After Angular initializes the component's views and child views, call applyFilter by customer filter types
    let filterArray: Array<FilterModel> = [];
    this.jobLogTypes.forEach(value => {
      filterArray.push(new FilterModel('type', value, '='));
    });

    let progressFilterArray: Array<FilterModel> = [];
    this.progressVmsTypes.forEach(value => {
      progressFilterArray.push(new FilterModel('status', value, '='));
    });

    this.onApplyLogFilters(filterArray);
    this.onApplyProgressFilters(progressFilterArray);
  }

  ngOnDestroy(): void {
    this.setJobLogTypes(this.jobLogTypes);
    this.jobSession = undefined;
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['isHistory'] && !changes['isHistory'].isFirstChange()) {
      let oldValue = me.isHistoryOld,
        newValue = me.isHistory;
      if (oldValue !== newValue) {
        me.isHistoryOld = newValue;
        me.resetLogs();
      }
    }
  }

  onSelectTab(value: string) {
    this.tabContentDisplayed = value;
  }

  toggleExpandJobLog() {
    this.expandJobLog = !this.expandJobLog;
    this.expandClicked.emit(this.expandJobLog);
  }

  trackByLinkModel(idx: number, model: LinkModel) {
    return model.href;
  }

  private isJobSessionIdentical(session: JobSessionModel): boolean {
    let me = this,
      latestJobSession = me.jobSession;
    return (
      (latestJobSession && session && latestJobSession.id === session.id) || latestJobSession === session
    );
  }

  private resetLogs(): void {
    let me = this;
    if (me.logTable) me.logTable.resetLogs();
  }

  private onExecuteSessionAction(item: JobSessionModel, link: LinkModel): void {
    this.toggleDropDown(item);
    this.onExecuteAction(item, link);
  }

  private refreshSessionDisplayFields(target: JobSessionModel, updated: JobSessionModel): void {
    target.status = updated.status;
    target.start = updated.start;
    target.end = updated.end;
    target.duration = updated.duration;
    target.properties = updated.properties;
    target.links = updated.links;
  }

  private isDropDown(item: JobModel): boolean {
    if (item) {
      return !!item.metadata['dropdown'];
    }
    return false;
  }

  private toggleDropDown(item: BaseModel): void {
    let me = this,
      operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = !item.metadata['dropdown'];
      if (item.metadata['dropdown']) me.setCollapsibleIcon(operatorId, 'hide', 'show');
      else me.setCollapsibleIcon(operatorId, 'show', 'hide');
    }
  }

  private setCollapsibleIcon(operatorId: string, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + operatorId);
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }

  private getDropDownMenuId(item: BaseModel): string {
    return 'job-details-dropdown-menu-' + MD5.encode(item.getId());
  }

  private needActionSchema(item: JobSessionModel, link: LinkModel): boolean {
    return (link.name === 'start' || link.name === 'cancel') && item.hasActionSchema(link.name);
  }

  private onExecuteAction(item: JobSessionModel, link: LinkModel): void {
    this.needActionSchema(item, link)
      ? this.loadActionSchema(link.name, item)
      : this.doAction(item, link.name);
  }

  private loadActionSchema(actionName: string, item: JobSessionModel): void {
    let me = this,
      observable = item.getActionSchema(actionName);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.jobSchema = record;
          me.pendingItem = { model: item, action: actionName };
          me.textActionOptions =
            actionName === 'start'
              ? me.textStartOptions
              : actionName === 'cancel'
              ? me.textCancelOptions
              : undefined;
          me.showJobSchema = true;
        },
        err => me.handleError(err)
      );
    }
  }

  private doAction(
    item: JobSessionModel,
    name: string,
    params?: Array<JobParameterModel>,
    fn?: Function
  ): void {
    let me = this,
      payload = me.getActionPayload(params),
      observable = item.doAction<JobSessionModel>(JobSessionModel, name, payload);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        updated => {
          me.refreshSessionDisplayFields(item, updated);
          if (typeof fn === 'function') {
            fn.call(this);
          }
        },
        err => me.handleError(err)
      );
  }

  private getActionPayload(params?: Array<JobParameterModel>): Object {
    let payload;
    if (params) {
      payload = {};
      params.forEach(function(item) {
        let values = [];
        if (item.allowMultipleValues) {
          (item.values || []).forEach(function(value: JobParameterNvPairModel | any) {
            if (value instanceof JobParameterNvPairModel) values.push(value.value);
            else values.push(value);
          });
          payload[item.key] = values;
        } else {
          if (isObject(item.value)) payload[item.key] = item.value.value;
          else payload[item.key] = item.value;
        }
      });
    }
    return payload;
  }

  private onJobRun(params: Array<JobParameterModel>): void {
    let me = this,
      item = me.pendingItem,
      payload = me.getActionPayload(params);
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

  private onRerunClick(): void {
    this.confirm(this.textRerunConfirmation, this.textRerun, () => {
      this.doAction(this.jobSession, 'rerun', null, () => {
        this.rerunJobEvent.emit();
      });
    });
  }

  private loadLog(log: JobLogLoadEndEventParam, isMask: boolean): void {
    this.jobLogMask(isMask);
    this.jobLog = log;
  }

  private jobLogMask(value: boolean) {
    let me = this;
    Observable.of({})
      .delay(1)
      .takeUntil(me.subs)
      .subscribe(() => {
        me.isJobLogMasked = value;
      });
  }

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler) me.errorHandler.handle(err, node);
  }

  private info(message: string, title?: string) {
    let me = this;
    if (me.alert) me.alert.show(title, message);
  }

  private confirm(message: string, title: string, fn: Function) {
    let me = this;
    if (me.alert) me.alert.show(title, message, AlertType.CONFIRMATION, fn);
  }

  private onDownloadLogs(event: MouseEvent): void {
    let me = this,
      link = this.jobSession && this.jobSession.getLink('diagnostics');
    let ctrlLink = this.jobSession && this.jobSession.getLink('csv');
    if (me.downloader && link) {
      me.info(me.textDownloadInit, me.textDownloadJobLog);
      if (event.ctrlKey) {
        me.downloader.download(this.addLocaleToRequestLink(ctrlLink.href));
      } else {
        me.downloader.download(this.addLocaleToRequestLink(link.href));
      }
    }
  }

  /**
   * Add locale to request link
   * @param url The request link
   */
  private addLocaleToRequestLink(url: string): string {
    return url + '&locale=' + LocaleService.getHeaderLangID();
  }

  private onApplyLogFilters(filters: Array<FilterModel>): void {
    if (this.logTable) this.logTable.applyFilters(filters, !this.hasJobSession);

    this.jobLogTypes = this.extractJobLogTypes(filters);
  }

  private extractJobLogTypes(filters: Array<FilterModel>): string[] {
    let result = [];
    (filters || []).forEach((filter: FilterModel) => {
      result.push(filter.value);
    });
    return result;
  }

  private onApplyProgressFilters(filters: Array<FilterModel>): void {
    if (this.progressTable) {
      this.progressTable.applyFilters(filters, !this.hasJobSession);
    }
    this.progressVmsTypes = this.extractJobLogTypes(filters);
  }

  private setJobLogTypes(types: string[]): void {
    let session = SessionService.getInstance(),
      userModel = session.getUserModel();
    session.syncMetadata('jobLogTypes_JobsOps', types);
    userModel.updateMetadata('jobLogTypes_JobsOps', types, this.sharedMonitorService.proxy);
  }

  private getJobLogTypes(): string[] {
    let userModel = SessionService.getInstance().getUserModel();
    return userModel && userModel.metadata ? userModel.metadata['jobLogTypes_JobsOps'] : null;
  }

  private isProgressTabDisplayed() {
    return this.jobSession && (this.jobSession.serviceId !== 'serviceprovider.maintenance' && this.jobSession.serviceId !== 'serviceprovider.report');
  }
}
