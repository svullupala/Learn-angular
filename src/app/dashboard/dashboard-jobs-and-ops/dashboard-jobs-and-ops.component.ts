import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DashboardService} from '../dashboard.service';
import {Observable, Subject} from 'rxjs';
import {FilterModel} from 'shared/models/filter.model';
import {JobSessionStatsModel} from 'job/shared/job-session-stats.model';
import {Router} from '@angular/router';
import {SessionService, ScreenId} from 'core';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'dashboard-jobs-and-ops',
  styleUrls: ['../dashboard.scss'],
  templateUrl: './dashboard-jobs-and-ops.component.html'
})

export class DashboardJobsAndOpsComponent implements OnInit, OnDestroy {

  @Input() refreshRate: number = 60000;
  subs: Subject<void> = new Subject<void>();
  stats: JobSessionStatsModel;
  selectedLastPeriod: number = 12;

  private labelColor: string = '#1C496D';
  private defaultColor: string = '#d6d6d6';
  private unitColor: string = '#595859';
  private successColor: string;
  private failedColor: string;
  private warningColor: string;
  private textJobs: string;
  private textJobss: string;
  private cursorType: string = 'pointer';
  private viewPermission: boolean = true;

  constructor(private router: Router, private service: DashboardService, private translate: TranslateService) {
  }

  ngOnInit() {
    this.translate.get([
        'common.textJobs',
      ]).subscribe((resource: Object) => {
        this.textJobs = resource['common.textJobs'];
      });
    this.successColor = this.service.getSuccessColor();
    this.failedColor = this.service.getFailedStatusColor();
    this.warningColor = this.service.getWarningStatusColor();
    this.viewPermission = SessionService.getInstance().hasScreenPermission(ScreenId.JOBSOPS);
    this.selectedLastPeriod = (this.getUserJobStatusPeriod()) ? this.getUserJobStatusPeriod() : 12;
    this.initClock();
    this.refreshJobs();
  }

  ngOnDestroy() {
    this.setUserJobStatusPeriod(this.selectedLastPeriod);
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  setPeriod(filterPeriod: number): void {
    this.selectedLastPeriod = filterPeriod;
    this.setUserJobStatusPeriod(this.selectedLastPeriod);
    this.refreshJobs();
  }

  refreshJobs() {
    let me = this, filters = [new FilterModel('rangeunit', 'hour'),
        new FilterModel('range', me.selectedLastPeriod)],
      observable = JobSessionStatsModel.retrieve(JobSessionStatsModel, me.service.proxy,
        filters);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.stats = record;
          // me.lastRefreshedAt = new Date();
        },
        err => {
        }
      );
  }

  onViewRunning(): void {
    SessionService.getInstance().context['jobMonitorModeParam'] = 'runningJobs';
    this.router.navigate(['/pages/jobsandoperations']);
  }

  onViewHistory(statusFilter?: string): void {
    if (statusFilter) {
      SessionService.getInstance().context['jobMonitorStatusFilter'] = statusFilter;
    }
    SessionService.getInstance().context['jobHistoryStatusPeriod'] = this.selectedLastPeriod;
    SessionService.getInstance().context['jobMonitorModeParam'] = 'jobHistory';
    this.router.navigate(['/pages/jobsandoperations']);
  }

  onLastPeriodFilter(lastPeriod: number): void {
    this.selectedLastPeriod = lastPeriod;
    this.setPeriod(lastPeriod);
  }

  private hasViewPermission(): boolean {
    return this.viewPermission;
  }


  getTotalJobs() {
    return SharedService.formatString(this.textJobs, this.stats.running)
  }

  getTotalJobsRun() {
    return SharedService.formatString(this.textJobs, this.stats.totalRuns - this.stats.running)
  }

  private setUserJobStatusPeriod(period: number): void {
    let session = SessionService.getInstance(), userModel = session.getUserModel();
    session.syncMetadata('jobStatusPeriod', period);
    userModel.updateMetadata('jobStatusPeriod', period, this.service.proxy);
  }

  private getUserJobStatusPeriod(): number {
    let userModel = SessionService.getInstance().getUserModel();
    return userModel.getMetadata('jobStatusPeriod');
  }

  private initClock() {
    let me = this;
    Observable.interval(me.refreshRate).takeUntil(me.subs).subscribe(
      () => {
        me.refreshJobs();
      }
    );
  }
}
