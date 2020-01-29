import {Component, Input, OnInit, AfterViewInit, OnDestroy, EventEmitter, Output} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs/Subject';
import {JobSessionStatsModel} from 'job/shared/job-session-stats.model';
import {FilterModel} from 'shared/models/filter.model';
import {Selectable} from 'shared/util/selectable';
import {BaseModel} from 'shared/models/base.model';
import {applyMixins} from 'rxjs/util/applyMixins';
import {SessionService} from 'core';
import {GlobalState} from '../../global.state';
import {DashboardService} from 'app/dashboard/dashboard.service';

interface StatChartData {
  topIcon: string;
  labelColor: string;
  borderColor: string;
  fillColor: string;
}

@Component({
  selector: 'job-history-stats',
  styleUrls: ['./job-history-stats.scss'],
  templateUrl: './job-history-stats.component.html'
})

export class JobHistoryStatsComponent implements OnInit, AfterViewInit, OnDestroy {

  static defaultPeriod: number = 12;

  @Input() rate: number = 60000;
  @Input() loadDataInit: boolean = true;
  @Output() setFilter = new EventEmitter();
  @Output() refreshed = new EventEmitter();
  isSelected: (item: BaseModel, singleSelect: boolean) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent, singleSelect: boolean) => void;

  sub: Subject<void> = new Subject<void>();
  model: JobSessionStatsModel;

  selectedLastPeriod: number = JobHistoryStatsComponent.defaultPeriod;
  lastRefreshedAt: Date;

  private borderColor: string = '#d6d6d6';
  private activeBorderColor: string = '#56acf2';
  private fillColor: string = '#deedf7';
  private textColor: string = '#595859';
  private activeTextColor: string = '#1c496d';
  private cursorType: string = 'pointer';

  private activeFilter: string = 'all';

  private filters: Array<FilterModel> = [
    new FilterModel('status', ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'ABORTED'], 'IN')
  ];
  private dateFilters: Array<FilterModel> = [new FilterModel('rangeunit', 'hour'),
      new FilterModel('range', this.selectedLastPeriod)];

  private failedColor: string;
  private warningColor: string;
  private successColor: string;
  private failedLight: string;
  private warningLight: string;
  private successLight: string;

  constructor(private router: Router, private service: DashboardService) {
  }

  ngOnInit() {
    let filter = SessionService.getInstance().context['jobMonitorStatusFilter'] || 'all',
      interval =  SessionService.getInstance().context['jobHistoryStatusPeriod'];

    if (interval) {
      this.setUserJobStatusPeriod(interval);
    }  else {
      this.selectedLastPeriod = (this.getUserJobStatusPeriod()) ? this.getUserJobStatusPeriod() : JobHistoryStatsComponent.defaultPeriod;
    }

    this.failedColor = this.service.getFailedStatusColor();
    this.warningColor = this.service.getWarningStatusColor();
    this.successColor = this.service.getSuccessColor();
    this.failedLight = this.service.getFailedLightColor();
    this.warningLight = this.service.getWarningLightColor();
    this.successLight = this.service.getSuccessLightColor();

    this.setFilterType(filter);
  }

  ngOnDestroy() {
    this.setUserJobStatusPeriod(this.selectedLastPeriod);
    SessionService.getInstance().context['jobMonitorStatusFilter'] = 'all';
    this.sub.next();
    this.sub.complete();
    this.sub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.loadDataInit)
      this.refresh();
  }

  refresh() {
    this.refreshStatus();
  }

  onLastPeriodFilter(lastPeriod: number): void {
    this.selectedLastPeriod = lastPeriod;
    this.dateFilters = [new FilterModel('rangeunit', 'hour'),
      new FilterModel('range', this.selectedLastPeriod)];
    this.getFilter();
    this.setUserJobStatusPeriod(this.selectedLastPeriod);
    this.refresh();
  }

  refreshStatus() {
    let me = this,
      filters = [new FilterModel('rangeunit', 'hour'),
        new FilterModel('range', me.selectedLastPeriod)],
      observable = JobSessionStatsModel.retrieve(JobSessionStatsModel, me.service.proxy, filters);
    if (observable){
      observable.takeUntil(me.sub).subscribe(
        record => {
          me.model = record;
          me.refreshed.emit(new Date());
        },
        err => {
        }
      );
    }
  }

  getFilter() {
    let filter = [new FilterModel('status', this.activeFilter)];

    this.dateFilters = [new FilterModel('rangeunit', 'hour'),
      new FilterModel('range', this.selectedLastPeriod)];

    // UI Fix to group partial, cancelled, and aborted together to match jobsession/stats api, consider backend change
    if (this.activeFilter === 'PARTIAL')
      filter = [new FilterModel('status', ['PARTIAL', 'CANCELLED', 'ABORTED'], 'IN')];

    this.activeFilter === 'all' ?
      this.setFilter.emit(this.filters.concat(this.dateFilters)) :
      this.setFilter.emit(filter.concat(this.dateFilters));
  }

  get failedStatData(): StatChartData {
    if (this.activeFilter === 'FAILED') {
      return {
        topIcon: !!this.model.failed ? 'bidi-failed' : 'bidi-failed-active',
        borderColor: !!this.model.failed ? this.failedColor : this.activeBorderColor,
        labelColor: this.activeTextColor,
        fillColor: !!this.model.failed ? this.failedLight : this.fillColor,
      };
    } else {
      return {
        topIcon: !!this.model.failed ? 'bidi-failed' : 'bidi-failed-disabled',
        borderColor: !!this.model.failed ? this.failedColor : this.borderColor,
        labelColor: this.textColor,
        fillColor: ''
      };
    }
  }

  get warningStatData(): StatChartData {
    if (this.activeFilter === 'PARTIAL') {
      return {
        topIcon: !!this.model.warning ? 'bidi-warning' : 'bidi-warning-active',
        borderColor: !!this.model.warning ? this.warningColor : this.activeBorderColor,
        labelColor: this.activeTextColor,
        fillColor: !!this.model.warning ? this.warningLight : this.fillColor,
      };
    } else {
      return {
        topIcon: !!this.model.warning ? 'bidi-warning' : 'bidi-warning-disabled',
        borderColor: !!this.model.warning ? this.warningColor : this.borderColor,
        labelColor: this.textColor,
        fillColor: ''
      };
    }
  }

  private setFilterType(type: string){
    this.activeFilter = type;
    this.getFilter();
  }

  private setUserJobStatusPeriod(period: number): void {
    this.selectedLastPeriod = period;
    let session = SessionService.getInstance(), userModel = session.getUserModel();
    session.syncMetadata('jobHistoryStatusPeriod', period);
    userModel.updateMetadata('jobHistoryStatusPeriod', period, this.service.proxy);
  }

  private getUserJobStatusPeriod(): number {  
    let userModel = SessionService.getInstance().getUserModel();
    return userModel.getMetadata('jobHistoryStatusPeriod');   
  }
}

applyMixins(JobHistoryStatsComponent, [Selectable]);
