import {Component, OnInit, Input, ViewChildren, QueryList, ViewChild, HostListener} from '@angular/core';
import 'rxjs/Rx';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent} from 'shared/components';
import {JobService} from 'job/shared/job.service';
import {SlapolicyService} from '../slapolicy.service';
import {SessionService} from 'core';
import {SlapolicyModel} from '../slapolicy.model';
import {JobSessionModel} from 'job/shared/job-session.model';
import {SorterModel} from 'shared/models/sorter.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {DurationDisplayPipe} from 'job/shared/duration-display.pipe';
import {LinkModel} from 'shared/models/link.model';
import {JobModel} from 'job/shared/job.model';
import {JobSchemaModel} from 'job/shared/job-schema.model';
import {JobParameterModel, JobParameterNvPairModel} from 'job/shared/job-parameter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {JobLogLoadEndEventParam, JobLogTableComponent} from 'job/shared/job-log-table/job-log-table.component';
import {DownloaderComponent} from 'shared/components/downloader/downloader.component';
import {BaseModel} from 'shared/models/base.model';
import {isObject} from 'util';
import {RefreshButtonBasicComponent} from
  'shared/components/refresh-button/refresh-button-basic/refresh-button-basic.component';
import { Subject } from 'rxjs/Subject';
import {PostScriptsModalComponent}
  from 'shared/components/post-scripts/post-scripts-modal/post-scripts-modal.component';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';
import {PolicyModel} from 'job/shared/policy.model';
import {NodeService} from 'core';
import {MD5} from 'shared/util/md5';

@Component({
  selector: 'policy-status-table',
  templateUrl: './policyStatusTable.component.html',
  styleUrls: ['./policyStatusTable.component.scss'],
  providers: [
    DurationDisplayPipe,
    JobService
  ]
})
export class PolicyStatusTableComponent implements OnInit {

  @Input() subtype: string;
  @Input() objType: string = '';
  @Input() showOptions: boolean = false;
  @Input() showInventoryBackupOption = true;
  @Input() showInventoryTimeoutOption = false;
  @Input() isScriptServerOnly: boolean = false;
  @Input() jobTypeFilters: string;

  paginateConfig: PaginateConfigModel;
  records: Array<SlapolicyModel>;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  downloader: DownloaderComponent;
  @ViewChild(PostScriptsModalComponent) scriptsModal: PostScriptsModalComponent;

  private infoTitle: string;
  private showJobSchema: boolean = false;
  private jobSchema: JobSchemaModel;
  private pendingItem: { model: SlapolicyModel, action: string };
  private isModelLoading: boolean = false;
  private textActionOptions: string;
  private textStartOptions: string;
  private textCancelOptions: string;
  private mask: boolean = false;
  private oldAutoRefresh: boolean = true;
  private subs: Subject<void> = new Subject<void>();
  private collapseAll: Subject<boolean> = new Subject<boolean>();
  private slaPolicy: SlapolicyModel;
  private options: PostScriptsModel;

  @ViewChildren(JobLogTableComponent)
  private logTables: QueryList<JobLogTableComponent>;

  @ViewChild(RefreshButtonBasicComponent)
  private autoRefreshBtn: RefreshButtonBasicComponent;

  constructor(private translate: TranslateService,
              private policyService: SlapolicyService, private jobService: JobService) {
    let paginationId: string = `policy-status-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId, pageSize: NodeService.pageSize});
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

  hasActions(item: SlapolicyModel): Boolean {
    if (item.getActionLinks().length === 1 && item.getActionLinks()[0].name === 'applyPolicyOptions')  {
         return false;
    }

    return item.hasActionLinks();
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }


  loadData(autoRefreshMode?: boolean, mask?: boolean) {
    let me = this, silent = autoRefreshMode;
    if (!me.isModelLoading && !me.isAnyChildLoading(me.records)) {
      me.mask = mask || false;
      me.isModelLoading = true;
      me.policyService.getSLAPolicyStatus(me.subtype, me.paginateConfig.pageStartIndex())
        .subscribe(
        dataset => {
          let records = [], total = 0;
          me.mask = false;
          if (dataset) {
            total = dataset.total;
            records = dataset.slapolicies;
          }
          if (autoRefreshMode)
            me.refreshOnDemandJobs(records);
          me.records = records;
          me.paginateConfig.refresh(total);
          me.isModelLoading = false;
        },
        err => {
          me.mask = false;
          if (!silent)
            me.handleError(err, true);
          me.records = [];
          me.paginateConfig.reset();
          me.isModelLoading = false;
        }
      );
    }
  }

  onRefresh(): void {
    this.collapseAll.next(true);
    this.loadData(false, true);
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  ngOnInit() {
    let me = this;

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.downloader = SessionService.getInstance().context['downloader'];
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'job.textStartOptions',
      'job.textCancelOptions']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textStartOptions = resource['job.textStartOptions'];
        me.textCancelOptions = resource['job.textCancelOptions'];
        me.loadData(false, true);
      });
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement): void {
    let me = this;
    if (!targetElement)
      return;

    (me.records || []).forEach(function (item) {
      if (me.isDropDown(item)) {
        me.collapseDropDown(item);
      }
    });
  }

  onDetailClick(item: SlapolicyModel, autoRefreshMode?: boolean, mask?: boolean): void {
    let me = this, silent = autoRefreshMode;
    if (!me.isLoading(item) && !me.isAnyChildLoading(undefined, item)
      && (!item.hasSessions() || autoRefreshMode)) {
        me.setLoading(true, item);
        item.metadata['sessionMask'] = mask || false;
        me.policyService.getJobSessions(item, me.subtype)
          .subscribe(
          records => {
            if (autoRefreshMode)
              me.refreshOnDemandSessions(item, records);
            item.sessions = records;
            me.setLoading(false, item);
            item.metadata['sessionMask'] = false;
          },
          err => {
            if (!silent)
              me.handleError(err, true);
            item.sessions = undefined;

            me.setLoading(false, item);
            item.metadata['sessionMask'] = false;
          }
        );
    }
  }

  onLogClick(policy: SlapolicyModel, item: JobSessionModel, autoRefreshMode?: boolean): void {
    let me = this, silent = autoRefreshMode;
    if (!me.isLogsLoading(item) && !me.isAnyChildLoading(undefined, policy, item)
      && (!item.hasLogs() || autoRefreshMode)) {

      me.loadLogs(item, autoRefreshMode);
    }
  }

  onShowModal(): void {
    let me = this;
    // Disable the auto refresh to avoid impacting the user input.
    me.disableAutoRefresh();
  }

  onHideModal(): void {
    let me = this, autoRefresh = this.oldAutoRefresh;
    if (autoRefresh)
      me.enableAutoRefresh();
  }

  private enableAutoRefresh(): void {
    let me = this, autoRefreshBtn = me.autoRefreshBtn;
    if (autoRefreshBtn && !autoRefreshBtn.isEnabled) {
      autoRefreshBtn.isEnabled = true;
    }
  }

  private disableAutoRefresh(): void {
    let me = this, autoRefreshBtn = me.autoRefreshBtn;
    if (autoRefreshBtn) {
      me.oldAutoRefresh = autoRefreshBtn.isEnabled;
      autoRefreshBtn.isEnabled = false;
    }
  }

  private autoRefresh(): void {
    this.loadData(true);
  }

  private refreshOnDemandJobs(model: Array<SlapolicyModel>): void {
    let me = this, records = me.records || [], newRecords = model || [];
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

  private refreshOnDemandSessions(policy: SlapolicyModel, sessions: Array<JobSessionModel>): void {
    let me = this, records = policy.sessions || [], newRecords = sessions || [];
    newRecords.forEach(function(item) {
      let target = records.find(function (record) {
        return (record.getId() === item.getId());
      });
      if (target) {
        item.metadata = target.metadata;
        // If the corresponding row is expanded then refresh it.
        if (me.isExpanded(policy, target)) {
          item.logDs = target.logDs;
          me.onLogClick(policy, item, true);
        } else {
          item.metadata['autoLoad'] = false;
        }
      }
    });
  }

  private isAnyChildLoading(model?: Array<SlapolicyModel>,
                            policy?: SlapolicyModel, session?: JobSessionModel): boolean {
    let me = this;
    if (session) {
      return false;
    } else if (policy) {
      return (policy.sessions || []).findIndex(function (record) {
        return !!(record && me.isLogsLoading(record));
      }) !== -1;
    } else if (model) {
      return (model || []).findIndex(function (record) {
        return !!(record && me.isAnyChildLoading(undefined, record));
      }) !== -1;
    }
    return false;
  }

  private isLoading(item: SlapolicyModel): boolean {
    if (item) {
      return !!item.metadata['loading'];
    }
    return false;
  }

  private setLoading(loading: boolean, item: SlapolicyModel, session?: JobSessionModel): void {
    if (session) {
      session.metadata['loading'] = loading;
    } else if (item) {
      item.metadata['loading'] = loading;
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

  private needActionSchema(item: SlapolicyModel, link: LinkModel): boolean {
    return (link.name === 'start' || link.name === 'cancel') && item.hasActionSchema(link.name);
  }

  private onExecuteAction(item: SlapolicyModel, link: LinkModel): void {
    this.needActionSchema(item, link) ? this.loadActionSchema(link.name, item) : this.doAction(item, link.name);
  }

  private loadActionSchema(actionName: string, item: SlapolicyModel): void {
    let me = this,
      observable = item.getActionSchema(actionName, me.jobService.proxy);
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

  private doAction(item: SlapolicyModel, name: string, params?: Array<JobParameterModel>): void {
    let me = this, payload = me.getActionPayload(params),
      observable = item.doAction<JobModel>(JobModel, name, payload, me.jobService.proxy);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        updated => {
          setTimeout(() => {
            me.loadData(true);
          }, 4000);
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

  private setCollapsibleIcon(operatorId: string, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + operatorId);
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }

  private getDropDownActionId(item: SlapolicyModel): string {
    return 'policy-status-table-dropdown-action-' + MD5.encode(item.getId());
  }

  private getDropDownMenuId(item: SlapolicyModel): string {
    return 'policy-status-table-dropdown-menu-' + MD5.encode(item.getId());
  }

  private isDropDown(item: SlapolicyModel): boolean {
    if (item) {
      return !!item.metadata['dropdown'];
    }
    return false;
  }

  private toggleDropDown(item: SlapolicyModel, event: MouseEvent): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = !item.metadata['dropdown'];
      if ( item.metadata['dropdown'] )
        me.setCollapsibleIcon(operatorId, 'hide', 'show');
      else
        me.setCollapsibleIcon(operatorId, 'show', 'hide');
    }
    event.stopPropagation();
  }

  private canDownloadLogs(item: JobSessionModel): boolean {
    return item.hasLink('csv');
  }

  private onDownloadLogs(session: JobSessionModel): void {
    this.jobService.downloadLogs(session, this.downloader);
  }

  private collapseDropDown(item: SlapolicyModel): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    item.metadata['dropdown'] = false;
    me.setCollapsibleIcon(operatorId, 'show', 'hide');
  }

  private isExpanded(item: SlapolicyModel, session?: JobSessionModel): boolean {
    if (session) {
      return !!(item && item.metadata['expanded'] && session.metadata['expanded']);
    } else if (item) {
      return !!item.metadata['expanded'];
    }
    return false;
  }

  private setExpanded(item: SlapolicyModel, session?: JobSessionModel): void {
    if (session) {
      session.metadata['expanded'] = true;
    } else if (item) {
      item.metadata['expanded'] = true;
    }
  }

  private setCollapsed(item: SlapolicyModel, session?: JobSessionModel): void {
    if (session) {
      session.metadata['expanded'] = false;
    } else if (item) {
      item.metadata['expanded'] = false;
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

  private canConfigureOptions(item: SlapolicyModel): boolean {
    return item.hasLink('options') && item.hasLink('applyOptions');
  }

  private onShowScripts(item: SlapolicyModel): void {
    if (this.scriptsModal) {
      this.slaPolicy = item;
      this.scriptsModal.show();
      this.loadOptions(item);
    }
  }

  private getOptionsByPolicy(policy: PolicyModel): PostScriptsModel {
    let options = new PostScriptsModel();
    if (policy.script) {
      options.postGuest = policy.script.postGuest;
      options.preGuest = policy.script.preGuest;
      options.continueScriptsOnError = policy.script.continueScriptsOnError;
    }
    if (policy.spec) {
      options.policyOption.excluderesources = policy.spec.option.excluderesources;
      options.policyOption.forcebaseresources =  policy.spec.option.forcebaseresources;
      options.policyOption.runInventory = policy.spec.option.runInventory;
      options.policyOption.protectionInventoryWaitTimeout = policy.spec.option.protectionInventoryWaitTimeout; 
    }
    return options;
  }

  private loadOptions(item: SlapolicyModel): void {
    let me = this, observable = item.getRecord<PolicyModel>(PolicyModel, 'options',
      me.jobService.proxy);

    me.options = new PostScriptsModel();
    if (observable) {
      me.scriptsModal.showMask();
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.scriptsModal.hideMask();
          me.options = me.getOptionsByPolicy(record);
        },
        err => {
          me.scriptsModal.hideMask();
          me.scriptsModal.hide();
          me.handleError(err, false);
        }
      );
    }
  }

  private applyOptions(item: SlapolicyModel, options: PostScriptsModel): void {
    let me = this, observable = this.policyService.applyScripts(item, options, me.subtype, me.showOptions);
    if (observable) {
      me.scriptsModal.showMask();
      observable.takeUntil(me.subs).subscribe(
        () => {
          me.scriptsModal.hideMask();
          me.scriptsModal.hide();
          me.onRefresh();
        },
        err => {
          me.scriptsModal.hideMask();
          me.handleError(err, true);
        }
      );
    }
  }
}
