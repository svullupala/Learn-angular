import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import 'rxjs/add/operator/delay';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import { Subject } from 'rxjs/Subject';
import { Sortable, SortUtil } from 'shared/util/sortable';
import {JobLogLoadEndEventParam} from 'job/shared/job-log-table';
import {JobSessionModel} from 'job/shared/job-session.model';
import {JobSessionsModel} from 'job/shared/job-sessions.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';

@Component({
  selector: 'job-session-table',
  templateUrl: './job-session-table.component.html',
  styleUrls: ['./job-session-table.component.scss']
})
export class JobSessionTableComponent implements OnInit, OnDestroy, Sortable {
  @Input() autoLoad: boolean = false;
  @Input() autoRefreshMode: boolean = false;
  @Input() locateMode: boolean = false;
  @Input() locateLogId: string;
  @Input() jobSession: JobSessionModel;
  @Input() filters: Array<FilterModel>;
  @Output() loadStart = new EventEmitter<JobSessionModel>();
  @Output() loadEnd = new EventEmitter<JobLogLoadEndEventParam>();
  private subs: Subject<void> = new Subject<void>();
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private sorters: Array<SorterModel>;
  private isModelLoading: boolean = false;
  private typeSort: SorterModel;
  private logTimeSort: SorterModel;

  private sessionList: [JobSessionModel];

  constructor(private translate: TranslateService, private restService: RestService) {
  }


  loadData(jobSession?: JobSessionModel, autoRefreshMode?: boolean) {
    let me = this;

    if (jobSession)
      me.jobSession = jobSession;
    else
      return;

    if (!me.isModelLoading) {
      me.isModelLoading = true;
      me.loadStart.emit();

      me.restService.getByUrl(me.jobSession.getUrl('concurrentjobs')).takeUntil(me.subs).subscribe(
        dataset => {
          me.sessionList = JsonConvert.deserializeObject(dataset, JobSessionsModel).records;
          me.isModelLoading = false;
        },
        err => {
          me.isModelLoading = false;
      });
    }
  }

  isAsc(name: string): boolean {
    return false;
  }

  isDesc(name: string): boolean {
    return false;
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
  }

  onSort(name: string): void {
  }
}
