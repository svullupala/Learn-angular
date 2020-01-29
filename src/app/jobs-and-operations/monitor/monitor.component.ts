import {AfterViewInit, Component, forwardRef, TemplateRef, ViewChild} from '@angular/core';
import {JobRunningStatsComponent} from './shared/job-running-stats/job-running-stats.component';
import {JobListComponent} from './shared/job-list-component/job-list.component';
import {FilterModel} from 'shared/models/filter.model';
import {JobHistoryStatsComponent} from './shared/job-history-stats/job-history-stats.component';
import {ActiveResourcesComponent} from './shared/active-resources/active-resources.component';
import {DynamicTabEntry, DynamicTabsetComponent} from 'shared/components';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs/Subject';
import { FilterCatagoriesModel, FilterCatagoryModel } from 'shared/components/filter-dropdown/filter-catagories.model';
import { SessionService, ScreenId } from 'core';
import {JobSessionModel} from 'job/shared/job-session.model';
import {JobScheduleTableComponent} from 'job/shared/job-schedule-table/job-schedule-table.component';
import {JobWizardRegistry} from 'wizard/job-wizard-registry';
import {SharedService} from 'shared/shared.service';
import {JobModel} from 'job/shared/job.model';
import {JobWizardComponent} from 'wizard/job-wizard.component';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})

export class MonitorComponent extends RefreshSameUrl implements AfterViewInit {

  @ViewChild(JobRunningStatsComponent) jobMonitorStats: JobRunningStatsComponent;
  @ViewChild(JobHistoryStatsComponent) jobHistoryStats: JobHistoryStatsComponent;
  @ViewChild(ActiveResourcesComponent) activeResources: ActiveResourcesComponent;
  @ViewChild(JobScheduleTableComponent) jobSchedule: JobScheduleTableComponent;
  @ViewChild(JobListComponent) jobList: JobListComponent;
  @ViewChild(DynamicTabsetComponent) tabSet: DynamicTabsetComponent;

  @ViewChild('runningJobs', {read: TemplateRef})
  public runningJobs: TemplateRef<any>;
  @ViewChild('jobHistory', {read: TemplateRef})
  public jobHistory: TemplateRef<any>;
  @ViewChild('activeResourcesTab', {read: TemplateRef})
  public activeResourcesTab: TemplateRef<any>;
  @ViewChild('jobScheduleTab', {read: TemplateRef})
  public jobScheduleTab: TemplateRef<any>;
  @ViewChild('jobListTab', {read: TemplateRef})
  public jobListTab: TemplateRef<any>;

  @ViewChild(forwardRef(() => JobWizardComponent)) wizard: JobWizardComponent;

  tabs: DynamicTabEntry[];
  lastRefreshedAt: Date;

  private subs: Subject<void> = new Subject<void>();
  private mode: string = SessionService.getInstance().context['jobMonitorModeParam'] || 'runningJobs';
  private tabRunningTitle: string;
  private tabHistoryTitle: string;
  private tabActiveResourcesTitle: string;
  private tabJobScheduleTitle: string;
  private tabListTitle: string;
  private filterCatagories: Array<FilterCatagoriesModel> = [];
  private loadStatsDataInit: boolean = true;
  private locateJobSessionId: string;
  private locateSessionLogPending: boolean = false;

  private isCreatingJob: boolean = false;
  private expandJobLog: boolean = false;
  private isDifferentJobSessionClicked: boolean;

  private isSwitchingJobList: boolean = false;

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService, public wizardRegistry: JobWizardRegistry) {
    super(globalState, route);
  }

  get isHistory(): boolean {
    return this.mode === 'jobHistory';
  }

  get showCreateRestoreJobButton(): boolean {
    let instance = SessionService.getInstance();
    return instance.hasScreenPermission(ScreenId.VMWARE_RESTORE) ||
          instance.hasScreenPermission(ScreenId.HYPERV_RESTORE) ||
          instance.hasScreenPermission(ScreenId.AWSEC2_RESTORE) ||
          instance.hasScreenPermission(ScreenId.ORACLE_RESTORE) ||
          instance.hasScreenPermission(ScreenId.SQL_RESTORE) ||
          instance.hasScreenPermission(ScreenId.EXCH_RESTORE) ||
          instance.hasScreenPermission(ScreenId.DB2_RESTORE) ||
          instance.hasScreenPermission(ScreenId.MONGO_RESTORE);
  }


  ngOnInit(): void {
    let me = this, viewLogsParam;

    super.ngOnInit();

    SharedService.maximizeContent(false, true);

    me.lastRefreshedAt = new Date();
    viewLogsParam = SessionService.getInstance().context['viewLogParams'];

    if (viewLogsParam)
      me.loadStatsDataInit = false;

    // initialize filter component
    let typeFilterCatagory: Array<FilterCatagoryModel> = [
      new FilterCatagoryModel('common.textBackup', true, 'type', 'protection'),
      new FilterCatagoryModel('common.textRestore', true, 'type', 'recovery'),
      new FilterCatagoryModel('common.textInventory', true, 'type', 'catalog'),
      new FilterCatagoryModel('common.textMaintenance', true, 'type', 'maintenance')
    ];
    let statusFilterCatagory: Array<FilterCatagoryModel> = [
      new FilterCatagoryModel('common.textRunning', true, 'status', 'RUNNING'),
      new FilterCatagoryModel('job.textPending', true, 'status', 'PENDING'),
      new FilterCatagoryModel('job.textPausedSchedule', true, 'status', 'HELD'),
      new FilterCatagoryModel('job.textCanceling', true, 'status', 'CANCELING')
    ];
    let historyFilterCatagory: Array<FilterCatagoryModel> = [
      new FilterCatagoryModel('common.textFailed', true, 'status', 'FAILED'),
      new FilterCatagoryModel('common.warningTitle', true, 'status', 'PARTIAL'),
      new FilterCatagoryModel('common.textSuccessful', true, 'status', 'COMPLETED')
    ];
    me.filterCatagories = [
      new FilterCatagoriesModel('common.textType', typeFilterCatagory),
      new FilterCatagoriesModel('common.textStatus', statusFilterCatagory),
      new FilterCatagoriesModel('common.textHistory', historyFilterCatagory, true)
    ];

    me.tabs =
      [{key: 'runningJobs', title: me.tabRunningTitle, content: me.runningJobs, refresh: true, active: me.mode === 'runningJobs'},
        {key: 'jobHistory', title: me.tabHistoryTitle, content: me.jobHistory, refresh: true, active: me.mode === 'jobHistory'},
        {key: 'activeResourcesTab', title: me.tabActiveResourcesTitle, content: me.activeResourcesTab, active: me.mode === 'activeResourcesTab'},
        {key: 'jobScheduleTab', title: me.tabJobScheduleTitle, content: me.jobScheduleTab, active: me.mode === 'jobScheduleTab'},
      //  {key: 'jobListTab', title: me.tabListTitle, content: me.jobListTab, customClass: 'defaultClassRight'}
      ];

    me.translate.get([
      'monitoring.textJobHistory',
      'monitoring.textJobList',
      'monitoring.textActiveResources',
      'monitoring.textJobSchedule',
      'monitoring.textRunningJobs']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.tabRunningTitle = resource['monitoring.textRunningJobs'];
        me.tabHistoryTitle = resource['monitoring.textJobHistory'];
        me.tabActiveResourcesTitle = resource['monitoring.textActiveResources'];
        me.tabJobScheduleTitle = resource['monitoring.textJobSchedule'];
        me.tabListTitle = resource['monitoring.textJobList'];

        me.tabs[0].title = me.tabRunningTitle;
        me.tabs[1].title = me.tabHistoryTitle;
        me.tabs[2].title = me.tabActiveResourcesTitle;
        me.tabs[3].title = me.tabJobScheduleTitle;
       // me.tabs[4].title = me.tabListTitle;
      });

    // Check if need to locate job session.
    SessionService.getInstance().context['viewLogContainer'] = me;
    if (viewLogsParam) {
      me.locateJobSessionId = viewLogsParam['jobSessionId'];
      SessionService.getInstance().context['viewLogParams'] = undefined;
      me.locateSessionLogPending = true;
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    SharedService.maximizeContent(true);
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngAfterViewInit(): void {
    let me = this;
    setTimeout(() => {
      me.locateProc();
    }, 50);
  }

  protected onRefreshSameUrl(): void {
    this.onWizardCancel();
  }

  setJobFilters(jobFilters: Array<FilterModel>) {
    this.jobList.setFilters(jobFilters);
  }

  setHistoryFilters(jobFilters: Array<FilterModel>) {
    if (this.mode === 'runningJobs'){
      return;
    } else {
      this.setJobFilters(jobFilters);
    }
  }

  setRunningFilters(jobFilters: Array<FilterModel>) {
    if (this.mode === 'jobHistory'){
      return;
    } else {
      this.setJobFilters(jobFilters);
    }
  }

  refreshList() {
    this.jobList.refresh();
  }

  refresh(preventLocateSessionLog?: boolean) {
    let me = this;
    if (me.mode === 'runningJobs') {
      if (me.jobHistoryStats)
        me.jobMonitorStats.refreshJobs();
    } else {
      if (me.jobHistoryStats)
        me.jobHistoryStats.refreshStatus();
    }

    if (!preventLocateSessionLog)
      me.locateProc();
  }

  onSwitchMode(activeTab: DynamicTabEntry) {
    if (activeTab.key === 'runningJobs') {
      this.mode = 'runningJobs';
      this.isSwitchingJobList = true;
      SessionService.getInstance().context['jobMonitorModeParam'] = this.mode;
      this.filterCatagories[0].hidden = false;
      this.filterCatagories[1].hidden = false;
      this.filterCatagories[2].hidden = true;
      if (this.jobMonitorStats)
        this.jobMonitorStats.getFilter();
      this.jobList.switchSorters(this.mode);
    } else if (activeTab.key === 'jobHistory') {
      this.mode = 'jobHistory';
      this.isSwitchingJobList = true;
      SessionService.getInstance().context['jobMonitorModeParam'] = this.mode;
      this.filterCatagories[0].hidden = true;
      this.filterCatagories[1].hidden = true;
      this.filterCatagories[2].hidden = false;
      if (this.jobHistoryStats)
        this.jobHistoryStats.getFilter();
      this.jobList.switchSorters(this.mode);
    } else if (activeTab.key === 'activeResourcesTab') {
      this.activeResources.onRefresh();
    } else {
      this.jobSchedule.refresh();
    }
    this.refresh(true);
  }

  onAlertSession(session: JobSessionModel): void {
    let isHistory = session.status !== 'RUNNING';
    isHistory ? this.forceJobHistory() : this.forceRunningJobs();
    this.setLocating(session);
  }

  onJobsLoad(): void {
    this.refresh(!this.locateSessionLogPending);
    this.isSwitchingJobList = false;
  }

  locate(jobSessionId: string): void {
    let me = this;
    if (me.jobList) {
      me.onWizardCancel();
      me.jobList.getJobSessionInstance(jobSessionId);
    }
  }

  onCreateJobClick(): void {
    this.isCreatingJob = true;
    this.startCreateWizard();
  }

  onWizardCancel(): void {
    this.isCreatingJob = false;
    this.hideWizard();
  }

  onWizardSubmit(): void {
    this.isCreatingJob = false;
  }

  onWizardEditJob(job: JobModel): void {
    this.isCreatingJob = true;
    this.startEditWizard(job);
  }

  private startCreateWizard(): void {
    let me = this;
    if (me.wizard)
      me.wizard.create();
  }

  private startEditWizard(job: JobModel): void {
    let me = this;
    if (me.wizard)
      me.wizard.edit(job);
  }

  private hideWizard(): void {
    let me = this;
    if (me.wizard)
      me.wizard.hide();
  }

  private showWizard(): void {
    let me = this;
    if (me.wizard)
      me.wizard.show();
  }

  private setLocating(session: JobSessionModel) {
    if (this.jobList)
      this.jobList.loadData(true, true, undefined, true, session);
  }

  private forceJobHistory(): void {
    let me = this;
    if (!me.tabs[1].active) {
      me.tabs[0].active = false;
      me.tabs[1].active = true;
      if (me.tabSet)
        me.tabSet.runChangeDetection();
    }
  }

  private forceRunningJobs(): void {
    let me = this;
    if (!me.tabs[0].active) {
      me.tabs[1].active = false;
      me.tabs[0].active = true;
      if (me.tabSet)
        me.tabSet.runChangeDetection();
    }
  }

  private locateProc(): void {
    let me = this;
    if (me.locateSessionLogPending) {
      me.locate(me.locateJobSessionId);
      me.locateJobSessionId = undefined;
      me.locateSessionLogPending = false;
    }
  }
  private expandJobLogClicked(): void {
    this.expandJobLog = !this.expandJobLog;
  }

  private differentJobSessionClicked(isDifferentJobSessionClicked: boolean) {
    this.isDifferentJobSessionClicked = isDifferentJobSessionClicked;    
  }

}
