import {
  Component, OnInit, Input, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef,
  TemplateRef
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { AlertComponent, AlertType } from 'shared/components';
import {JobService} from '../job.service';
import {SessionService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {JobSessionModel} from '../job-session.model';
import {SorterModel} from 'shared/models/sorter.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {DownloaderComponent} from 'shared/components/downloader/downloader.component';
import {Subscription} from 'rxjs/Subscription';
import {JobLogLoadEndEventParam, JobLogTableComponent} from '../job-log-table/job-log-table.component';
import {SharedService} from 'shared/shared.service';
import {BaseModel} from 'shared/models/base.model';
import { JobModel } from '../job.model';
import { RunningTasksModel } from 'vadp/running-tasks.model';
import {LinkModel} from 'shared/models/link.model';

@Component({
  selector: 'job-status-table',
  templateUrl: './job-status-table.component.html',
  styleUrls: ['./job-status-table.component.scss'],
  providers: [JobService]
})
export class JobStatusTableComponent implements OnInit, OnDestroy {

  @ViewChild('postRestoreTemplate', {read: TemplateRef}) restoreInfotemplate: TemplateRef<any>;
  @Input() providerType: string;
  // This property is passed in by the parent as array of serviceIds(strings).
  // ex: ['serviceprovider.recovery.hypervisor']
  @Input() serviceIds: Array<string>;
  @Input() autoLoad: boolean = true;
  @Input() jobTaskFromProxy: RunningTasksModel;
  @Input() defaultState: boolean = true;
  @Input() hideAutoRefreshBtn: boolean = false;
  jobs: Array<JobSessionModel>;
  jobPaginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  downloader: DownloaderComponent;
  selectableLogTypes: Array<any>;
  selectedLogTypes: Array<any>;
  jobLogTypes: string[];
  dropdownSettings: Object;
  logFilters: Array<FilterModel>;

  private logSub: Subscription;
  private jobSub: Subscription;
  private transSub: Subscription;
  private actionsSub: Subscription;
  private infoTitle: string;
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private jobSessionWithPostRestoreInfo: JobSessionModel;
  private logTypes: Array<any> = [
    {id: 0, itemName: 'INFO', value: 'INFO'},
    {id: 1, itemName: 'WARN', value: 'WARN'},
    {id: 2, itemName: 'ERROR', value: 'ERROR'},
    {id: 3, itemName: 'DETAIL', value: 'DETAIL'},
    {id: 4, itemName: 'SUMMARY', value: 'SUMMARY'}];

  private scrollUniqueHandler: any;
  @ViewChild('overflowTable')
  private overflowTable: ElementRef;
  @ViewChildren(JobLogTableComponent)
  private logTables: QueryList<JobLogTableComponent>;
  private isModelLoading: boolean = false;

  constructor(private translate: TranslateService,
              private jobService: JobService) {
  }

  ngOnDestroy() {

    this.setJobLogTypes(this.jobLogTypes);

    if (this.logSub) {
      this.logSub.unsubscribe();
    }
    if (this.jobSub) {
      this.jobSub.unsubscribe();
    }
    if (this.actionsSub) {
      this.actionsSub.unsubscribe();
    }
    if (this.transSub) {
      this.transSub.unsubscribe();
    }
    if (this.overflowTable)
      SharedService.scrollUnique(this.overflowTable.nativeElement, true, this.scrollUniqueHandler);
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

  setjobTaskFromProxy(task: RunningTasksModel): void {
    this.jobTaskFromProxy = task;
  }

  loadData(autoRefreshMode?: boolean) {
    let me = this, silent = autoRefreshMode,
        job: JobModel | RunningTasksModel = me.jobTaskFromProxy;
    if (!me.isModelLoading) {

      me.isModelLoading = true;

      me.jobSub = me.jobService.getJobSessions(job, me.filters, me.sorters,
        me.jobPaginateConfig.pageSize(),
        me.jobPaginateConfig.pageStartIndex()).subscribe(
        records => {
          if (autoRefreshMode)
            me.refreshOnDemandSessions(records);
          me.jobs = records;
          me.jobPaginateConfig.refresh(me.jobService.jobSessionTotalItems);
          me.isModelLoading = false;
        },
        err => {
          if (!silent)
            me.handleError(err);
          me.jobPaginateConfig.reset();
          me.isModelLoading = false;
        }
      );
    }
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  trackByLinkModel(idx: number, model: LinkModel) {
    return model.href;
  }

  ngOnInit() {
    let me = this;

    me.dropdownSettings = {
      singleSelection: false,
      enableSearchFilter: false,
      enableCheckAll: false
    };
    me.jobPaginateConfig = new PaginateConfigModel({id: 'job-session-table'});
    me.downloader = SessionService.getInstance().context['downloader'];
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    if (me.providerType) {
      me.filters = me.filters || [];
      me.filters.push(new FilterModel('subType', me.providerType));
    }

    if (me.serviceIds && me.serviceIds.length > 0) {
      me.filters = me.filters || [];
      me.filters.push(new FilterModel('serviceId', me.serviceIds, 'IN'));
    }

    // Initialize sorters.
    me.sorters = [new SorterModel('start', 'DESC')];

    me.transSub = me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.processingRequestMsg',
      'common.filterJobLogLabel.textWarn',
      'common.filterJobLogLabel.textError',
      'common.filterJobLogLabel.textInfo',
      'common.filterJobLogLabel.textDetail',
      'common.filterJobLogLabel.textSummary'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.logTypes = [
          {id: 0, itemName: resource['common.filterJobLogLabel.textInfo'], value: 'INFO'},
          {id: 1, itemName: resource['common.filterJobLogLabel.textWarn'], value: 'WARN'},
          {id: 2, itemName: resource['common.filterJobLogLabel.textError'], value: 'ERROR'},
          {id: 3, itemName: resource['common.filterJobLogLabel.textDetail'], value: 'DETAIL'},
          {id: 4, itemName: resource['common.filterJobLogLabel.textSummary'], value: 'SUMMARY'}];
        // me.setTypes();
        me.selectableLogTypes = me.getLogTypeDropdownList();
        me.jobLogTypes = me.getJobLogTypes();
        me.jobLogTypes = me.jobLogTypes || ['INFO', 'WARN', 'ERROR', 'SUMMARY'];
        me.selectedLogTypes = me.getLogTypeInitSelectedList();
        me.logFilters = me.getLogFilter();

        if (me.autoLoad) {
          me.loadData();
        }
      });
    if (me.overflowTable)
      me.scrollUniqueHandler = SharedService.scrollUnique(me.overflowTable.nativeElement);
  }

  onPageChange(page: number): void {
    let me = this;
    me.jobPaginateConfig.pageChanged(page);
    me.loadData();
  }

  onLogClick(item: JobSessionModel, autoRefreshMode?: boolean): void {
    let me = this;
    if (!me.isLogsLoading(item) && (!item.hasLogs() || autoRefreshMode)) {

      me.loadLogs(item, autoRefreshMode);

    }
    if (!autoRefreshMode)
      me.addCollapsibleListeners(item);
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

  private refreshOnDemandSessions(sessions: Array<JobSessionModel>): void {
      let me = this, records = me.jobs || [], newRecords = sessions || [];
    newRecords.forEach(function(item) {
      let target = records.find(function (record) {
        return (record.getId() === item.getId());
      });
      if (target) {
        item.metadata = target.metadata;
        // If the corresponding row is expanded then refresh it.
        if (me.isExpanded(target)) {
          item.logDs = target.logDs;
          me.onLogClick(item, true);
        } else {
          item.metadata['autoLoad'] = false;
        }
      }
    });
  }

  private loadLogs(jobSession: JobSessionModel, autoRefreshMode?: boolean): void {
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
      if (target) {
        jobSession.proxy = me.jobService.proxy;
        target.loadData(jobSession, autoRefreshMode);
      }
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

  private canDownloadLogs(item: JobSessionModel): boolean {
    return item.hasLink('csv');
  }

  private onDownloadLogs(item: JobSessionModel): void {
    this.jobService.downloadLogs(item, this.downloader);
  }

  private onExecuteAction(item: JobSessionModel, href: string): void {
    this.toggleDropDown(item);
    this.actionsSub = this.jobService.postByUrl(href).subscribe(
      res => console.log('execute action...'),
      err => this.handleError(err));
  }

  private getCollapsibleOperatorId(item?: JobSessionModel): string {
    return 'job-status-table-collapsible-icon-' + item.id;
  }

  private getCollapsibleContainerId(item: JobSessionModel): string {
    return 'job-status-table-session-' + item.id;
  }

  private addCollapsibleListeners(item: JobSessionModel): void {
    let me = this, selector = '#' + me.getCollapsibleContainerId(item), element = jQuery(selector),
      operatorId = me.getCollapsibleOperatorId(item),
      context = {operatorId: operatorId, done: false};
    if (element) {
      element.off('shown.bs.collapse').on('shown.bs.collapse',
        context, function (eventObject) {
          if (!eventObject.data.done) {
            eventObject.data.done = true;
            element.off('shown.bs.collapse');
            element.off('hidden.bs.collapse');
            me.setExpanded(item);
            me.setCollapsibleIcon(eventObject.data.operatorId, 'ion-chevron-right', 'ion-chevron-down');
          }
        });
      element.off('hidden.bs.collapse').on('hidden.bs.collapse',
        context, function (eventObject) {
          if (!eventObject.data.done) {
            eventObject.data.done = true;
            element.off('hidden.bs.collapse');
            element.off('shown.bs.collapse');
            me.setCollapsed(item);
            me.setCollapsibleIcon(eventObject.data.operatorId, 'ion-chevron-down', 'ion-chevron-right');
          }
        });
    }
  }

  private isExpanded(session: JobSessionModel): boolean {
    if (session) {
      return !! session.metadata['expanded'];
    }
    return false;
  }

  private setExpanded(session: JobSessionModel): void {
    if (session) {
      session.metadata['expanded'] = true;
    }
  }

  private setCollapsed(session: JobSessionModel): void {
    if (session) {
      session.metadata['expanded'] = false;
    }
  }

  private setCollapsibleIcon(operatorId: string, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + operatorId);
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }

  private getDropDownActionId(item: JobSessionModel): string {
    return 'job-status-table-dropdown-action-' + item.id;
  }

  private getDropDownMenuId(item: JobSessionModel): string {
    return 'job-status-table-dropdown-menu-' + item.id;
  }

  private isDropDown(item: JobSessionModel): boolean {
    if (item) {
      return !!item.metadata['dropdown'];
    }
    return false;
  }

  private toggleDropDown(item: JobSessionModel): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = !item.metadata['dropdown'];
      if ( item.metadata['dropdown'] )
        me.setCollapsibleIcon(operatorId, 'hide', 'show');
      else
        me.setCollapsibleIcon(operatorId, 'show', 'hide');
    }
  }

  private setLoading(loading: boolean, session: JobSessionModel): void {
    if (session) {
      session.metadata['loading'] = loading;
    }
  }

  private onLoadLogsStart(jobSession?: JobSessionModel): void {
    if (jobSession) {
      this.setLoading(true, jobSession);
    }
  }

  private onLoadLogsEnd(param: JobLogLoadEndEventParam): void {
    if (param && param.jobSession) {
      this.setLoading(false, param.jobSession);
    }
  }

  private onRestoreInfoClick(jobSession: JobSessionModel): void {
    this.jobSessionWithPostRestoreInfo = jobSession;
    if (this.alert && this.restoreInfotemplate)
      this.alert.show(this.infoTitle, this.restoreInfotemplate, AlertType.TEMPLATE);
  }

  private onClickDropDownOutside(item: JobSessionModel): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = false;
      me.setCollapsibleIcon(operatorId, 'show', 'hide');
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
    userModel.updateMetadata('jobLogTypes', types, this.jobService.proxy);
  }

  private getJobLogTypes(): string[] {
    let userModel = SessionService.getInstance().getUserModel();
    return userModel && userModel.metadata ?
      userModel.metadata['jobLogTypes'] : null;
  }
}
