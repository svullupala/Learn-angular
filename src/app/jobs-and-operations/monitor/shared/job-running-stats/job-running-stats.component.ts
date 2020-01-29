import {Component, Input, OnInit, AfterViewInit, OnDestroy, EventEmitter, Output} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs/Subject';
import {FilterModel} from 'shared/models/filter.model';
import {JobSessionModel} from 'job/shared/job-session.model';
import {Selectable} from 'shared/util/selectable';
import {BaseModel} from 'shared/models/base.model';
import {applyMixins} from 'rxjs/util/applyMixins';
import {GlobalState} from '../../global.state';
import {DashboardService} from 'app/dashboard/dashboard.service';
import {JobSessionsModel} from 'job/shared/job-sessions.model';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'job-running-stats',
  styleUrls: ['./job-running-stats.scss'],
  templateUrl: './job-running-stats.component.html'
})

export class JobRunningStatsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() rate: number = 60000;
  @Input() loadDataInit: boolean = true;
  @Output() setFilter = new EventEmitter();
  @Output() refreshed = new EventEmitter();
  selectedItems: Array<JobSessionModel> = [];
  isSelected: (item: BaseModel, singleSelect: boolean) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent, singleSelect: boolean) => void;

  sub: Subject<void> = new Subject<void>();
  jobSessions: JobSessionsModel;

  private total: number = 0;
  private protection: number = 0;
  private inventory: number = 0;
  private maintenance: number = 0;
  private recovery: number = 0;

  private borderColor: string = '#d6d6d6';
  private activeBorderColor: string = '#56acf2';
  private fillColor: string = '#deedf7';
  private textColor: string = '#666666';
  private activeTextColor: string = '#1c496d';
  private cursorType: string = 'pointer';

  private activeFilter: [string] = ['all'];
  private filters: Array<FilterModel> = [
    new FilterModel('status', ['RUNNING', 'PENDING', 'HELD', 'CANCELING'], 'IN'),
  ];

  constructor(private router: Router, private service: DashboardService) {
  }

  ngOnInit() {
    this.getFilter();
  }

  ngOnDestroy() {
    this.sub.next();
    this.sub.complete();
    this.sub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.loadDataInit)
      this.refresh();
  }

  refresh() {
    this.refreshJobs();
  }

  setJobSessions(jobSessions: JobSessionsModel) {
    this.jobSessions = jobSessions;
    this.setJobStats();
  }


  refreshJobs() {
    let me = this, observable: Observable<JobSessionsModel>;
      observable = JobSessionsModel.retrieve<JobSessionModel, JobSessionsModel>(JobSessionsModel,
        me.service.proxy, me.filters);
      if (observable) {
        observable.takeUntil(me.sub).subscribe(
          dataset => {
            me.setJobSessions(dataset);
            me.refreshed.emit(new Date());
          },
          err => {
          }
        );
    }
  }

  getFilter() {
    let filter = [new FilterModel('type', this.activeFilter, 'IN')];
    this.activeFilter[0] === 'all' ?
      this.setFilter.emit(this.filters) : this.setFilter.emit(filter.concat(this.filters));
  }

  private setFilterType(type: [string]){
    this.activeFilter = type;
    this.getFilter();
  }

  private setJobStats() {
    let sessions = this.jobSessions.getRecords();
    this.total = sessions.length;
    this.protection = 0;
    this.recovery = 0;
    this.maintenance = 0;
    this.inventory = 0;

    for (let i = 0; i < this.total; i++) {
      switch (sessions[i].type) {
        case 'protection':
          this.protection++;
          break;
        case 'restore':
        case 'recovery':
          this.recovery++;
          break;
        case 'catalog':
          this.inventory++;
          break;
        case 'maintenance':
          this.maintenance++;
          break;
        default:
          break;
      }
    }
  }
}

applyMixins(JobRunningStatsComponent, [Selectable]);
