import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {AlertMessagesModel} from '../../../alert/alert-messages.model';
import {AlertMessageModel} from '../../../alert/alert-message.model';
import {SorterModel} from '../../models/sorter.model';
import {BaseModel} from '../../models/base.model';
import {PaginateModel} from '../../models/paginate.model';
import {JobLogModel} from 'job/shared/job-log.model';
import {JobLogsModel} from 'job/shared/job-logs.model';
import {ErrorHandlerComponent} from '../error-handler';
import {SessionService} from 'core';
import {AlertComponent, AlertType} from '../msgbox';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '../../shared.service';
import {selectorFactory, SelectorType} from '../../selector/selector.factory';
import {SelectorService} from '../../selector/selector.service';
import {FilterModel} from 'shared/models/filter.model';

@Component({
  selector: 'ba-msg-center',
  styleUrls: ['./baMsgCenter.scss'],
  templateUrl: './baMsgCenter.html',
  providers: [
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})
export class BaMsgCenter implements OnInit {

  records: Array<AlertMessageModel>;
  model: AlertMessagesModel;
  oldRecords: Array<AlertMessageModel>;
  logDs: PaginateModel<JobLogModel>;
  @ViewChild('logTemplate') logTemp: TemplateRef<any>;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private warningTitle: string;
  private textLogTpl: string;
  private textCannotLocateLogTpl: string;
  private masked: boolean = false;
  private stopPropagation: boolean = true;

  get alertCount() {
    let me = this;
    return this.records ? this.records.length : 0;
  }

  get unreadCount() {
    let me = this, unreadCount = 0, unreadItems = (me.records || []).filter(function (item) {
      return me.selector.selection().findIndex(function (record) {
        return item.equals(record);
      }) === -1;
    });
    return unreadItems ? unreadItems.length : 0;
  }

  constructor(private router: Router, private translate: TranslateService, private restService: RestService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `ba-msg-center-pagination-${(new Date()).valueOf()}`;
    this.logDs = new PaginateModel({id: paginationId + '-logs', classObject: JobLogsModel});
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  isMasked(): boolean {
    return this.masked;
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translate.get([
      'common.warningTitle',
      'alert.textLogTpl',
      'alert.textCannotLocateLogTpl'])
      .subscribe((resource: Object) => {
        me.warningTitle = resource['common.warningTitle'];
        me.textLogTpl = resource['alert.textLogTpl'];
        me.textCannotLocateLogTpl = resource['alert.textCannotLocateLogTpl'];
      });
    me.loadAlertMessages();
  }

  /**
   * Loads alert messages.
   *
   * @method loadAlertMessages
   */
  loadAlertMessages(): void {
    let me = this, observable: Observable<AlertMessagesModel>,
      filters = [new FilterModel('acknowledged', false)],
      sorters = [
        new SorterModel('alertTime', 'DESC')
      ];
    me.oldRecords = me.records;
    observable = AlertMessagesModel.retrieve<AlertMessageModel, AlertMessagesModel>(AlertMessagesModel,
      me.restService,
      filters, sorters, 0, 0);
    if (observable) {
      observable.subscribe(
        dataset => {
          me.records = dataset ? dataset.records || [] : [];
          me.model = dataset;
          me.readItemsCleanup();
        },
        err => {
          me.records = [];
        }
      );
    }
  }

  /**
   * Loads logs by alert.
   *
   * @method loadLogs
   * @param {AlertMessageModel} item
   */
  loadLogs(item: AlertMessageModel) {
    let me = this,
      sorters = [new SorterModel('logTime', 'ASC')],
      observable = item.getDataset<JobLogModel, JobLogsModel>(JobLogsModel, 'log', undefined,
        sorters,
        me.logDs.pageStartIndex());
    if (observable) {
      me.mask();
      observable.subscribe(
        dataset => {
          me.unmask();
          if (dataset) {
            me.logDs.update(dataset);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
          me.logDs.reset();
        }
      );
    }
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  onViewLogClick(item: AlertMessageModel): void {
    let me = this, jobId, jobSessionId, container;

    me.router.navigate(['/pages/jobsandoperations']);
    container = SessionService.getInstance().context['viewLogContainer'];
    // Locate log
    //
    // DEBUG DATA BELOW.
    // item.jobId = '1030';
    // item.jobSessionId = '1524805200167';
    // item.logId = '5ae2ae53bd8ce9d86aa0e433';

    if (!item.canLocateLog()) {
      // me.alert.show(me.warningTitle, SharedService.formatString(me.textCannotLocateLogTpl,
      //   item.jobId, item.jobSessionId, item.logId), AlertType.WARNING);

      // When insufficient information is detected, a simple popup window displays the log list.
      if (me.logTemp) {
        me.logDs.reset();
        me.loadLogs(item);
        me.alert.show(SharedService.formatString(me.textLogTpl, item.name, item.id),
          me.logTemp, AlertType.TEMPLATE, undefined, undefined,
          0, false);
        me.stopPropagation = false;
      }
      return;
    }

    jobId = item.jobId;
    jobSessionId = '' + item.jobSessionId;

    SessionService.getInstance().context['viewLogParams'] = {
      jobId: jobId,
      jobSessionId: jobSessionId
    };

    if (container)
      container.locate(jobSessionId);

    me.stopPropagation = false;
  }

  onViewEventLogClick(): void {
    this.router.navigate(['/pages/reportsandlogs/auditlog']);
    this.stopPropagation = false;
  }

  onClearAllAlertsClick(): void {
    let me = this,
      observable = me.model.postAction<AlertMessagesModel>(AlertMessagesModel, 'clearall',
        undefined, me.restService);
    if (observable) {
      observable.subscribe(
        dataset => {
           me.records = [];
        },
        err => {
          me.handleError(err);
        }
      );
    }
  }

  onClearAlertClick(item: AlertMessageModel): void {
    let me = this,
      observable = item.doAction<AlertMessagesModel>(AlertMessagesModel, 'clear',
        undefined, me.restService);
    if (observable) {
      observable.subscribe(
        dataset => {
          me.onAfterClearAlert(item);
        },
        err => {
          me.handleError(err);
        }
      );
    }
  }

  onBellClick(): void {
    let me = this;
    setTimeout(() => {
      (me.records || []).forEach(function (item) {
        return me.readItemsAdd(item);
      });
    }, 200);
  }

  onClick(event: any) {
    if (this.stopPropagation) {
      event.stopPropagation();
    } else {
      this.stopPropagation = true;
    }
  }

  private readItemsCleanup(): void {
    let me = this, removeItems = (me.selector.selection() || []).filter(function (item) {
      return (me.records || []).findIndex(function (record) {
        return item.equals(record);
      }) === -1;
    });
    if (removeItems) {
      removeItems.forEach(function (item) {
        me.selector.deselect(item);
      });
    }
  }

  private onAfterClearAlert(alert: AlertMessageModel): void {
    let me = this, idx = (me.records || []).findIndex(function (item) {
      return item.equals(alert);
    });
    if (idx !== -1) {
      me.records.splice(idx, 1);
    }
  }

  private readItemsAdd(item: AlertMessageModel): void {
    this.selector.select(item);
  }
}
