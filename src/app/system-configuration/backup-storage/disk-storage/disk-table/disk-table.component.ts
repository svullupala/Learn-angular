import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {ErrorModel} from 'shared/models/error.model';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {StorageModel} from '../shared/storage.model';
import {StoragesModel} from '../shared/storages.model';
import {SharedService} from 'shared/shared.service';
import {StorageManageService} from '../shared/storage-manage.service';
import {SiteService} from 'site/site.service';
import {SiteModel} from 'site/site.model';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {ProgressBarStatus} from 'shared/components/progress-bar/progress-bar.component';
import {Subject} from 'rxjs/Subject';
import {FileSizePipe} from 'shared/pipes/file-size.pipe';
import {DecimalPipe} from '@angular/common';
import {DateFormatPipe} from 'angular2-moment';

@Component({
  selector: 'disk-table',
  styleUrls: ['./disk-table.component.scss'],
  templateUrl: './disk-table.component.html'
})

export class DiskTableComponent implements OnInit, OnDestroy {
  storageTableData: Array<StorageModel> = undefined;
  @Input() siteDropdownData: Array<SiteModel>;
  @Input() siteMap = [];
  canCreate: boolean = false;

  @Input() storageFilter: Array<String>;

  @Output() editClick = new EventEmitter<StorageModel>();
  @Output() manageClick = new EventEmitter<StorageModel>();
  @Output() showCreateDisk = new EventEmitter<boolean>();

  public error: ErrorModel = null;

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  model: StorageModel;
  private infoTitle: string;
  private errorTitle: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private textInitStarted: string;
  private textRescanComplete: string;
  private textNotConnected: string;
  private textConnecting: string;
  private textAddNewSite: string;
  private textRefreshMayTakeWhileMsg: string;
  private textRefreshCompletedMsg: string;
  private textReadyVal: string;
  private textUpdated: string;
  private isLoading: boolean = false;
  private subs: Subject<void> = new Subject<void>();
  private filters: Array<FilterModel> = [];
  private percentWarning: number = 80;
  private percentDanger: number = 90;

  private maskList: boolean = false;
  private fileSize: FileSizePipe = undefined;
  private datePipe: DateFormatPipe = undefined;
  private progressTransition: boolean = true;

  private actionLinkExcludes = ['leaveActiveDirectory', 'joinActiveDirectory'];

  constructor(private storageManageService: StorageManageService,
               private translateService: TranslateService,
               private decimalPipe: DecimalPipe,
               private siteService: SiteService) {
    this.fileSize = new FileSizePipe(translateService, decimalPipe);
    this.datePipe = new DateFormatPipe();
    let paginationId: string = `storage-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  loadData() {
    let me = this;
    if (!me.isLoading) {
      me.isLoading = true;
      me.maskList = true;
      me.storageManageService.getAll(me.filters, undefined, undefined, me.paginateConfig.pageStartIndex())
        .takeUntil(me.subs).subscribe(
        data => {
          let dataset: StoragesModel = JsonConvert.deserializeObject(data, StoragesModel);
          me.maskList = false;
          me.storageTableData = <Array<StorageModel>> dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.isLoading = false;

          me.canCreate = dataset.hasLink('create') || false;
          me.showCreateDisk.emit(me.canCreate);
        },
        err => {
          me.maskList = false;
          me.isLoading = false;
          me.handleError(err);
        }
      );
    }
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit(){
    let me = this, endpoint = me.storageManageService.getNodeServiceEndpoint();
    me.translateService.get('common.nodeService')
      .subscribe((res: string) => {
        me.translateService.get([
          'common.infoTitle',
          'common.errorTitle',
          'common.processingRequestMsg',
          'common.textConfirm',
          'storage.registrationSucceedMsg',
          'storage.confirmUnregisterMsg',
          'storage.initStartedMsg',
          'storage.rescanCompleteMsg',
          'storage.textChangeSite',
          'storage.textNotConnected',
          'storage.refreshMayTakeWhileMsg',
          'storage.refreshCompletedMsg',
          'storage.textConnecting',
          'storage.textUseSSL',
          'storage.textUpdated',
          'storage.textReadyVal',
          // 'storage.textConfirmDisableSyncWrites',
          'storage.textAddNewSite'], {service: res, endpoint: endpoint})
          .subscribe((resource: Object) => {
            me.infoTitle = resource['common.infoTitle'];
            me.errorTitle = resource['common.errorTitle'];
            me.textConfirm = resource['common.textConfirm'];
            me.textConfirmUnregister = resource['storage.confirmUnregisterMsg'];
            me.textInitStarted = resource['storage.initStartedMsg'];
            me.textRescanComplete = resource['storage.rescanCompleteMsg'];
            me.textNotConnected = resource['storage.textNotConnected'];
            me.textConnecting = resource['storage.textConnecting'];
            me.textAddNewSite = resource['storage.textAddNewSite'];
            me.textReadyVal = resource['storage.textReadyVal'];
            me.textRefreshMayTakeWhileMsg = resource['storage.refreshMayTakeWhileMsg'];
            me.textRefreshCompletedMsg = resource['storage.refreshCompletedMsg'];
            me.textUpdated = resource['storage.textUpdated'];
          });
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new StorageModel();
    JsonConvert.valueCheckingMode = JsonConvert.ValueCheckingMode.ALLOW_NULL;

    me.setFilters();
    me.loadData();
    if (me.storageFilter.length === 1){
      me.model.type = me.storageFilter[0].toString();
    }
  }

  info(errOrMsg: ErrorModel | string, title?: string) {
    let me = this;
    if (me.alert) {
      if (errOrMsg instanceof ErrorModel)
        me.alert.show(errOrMsg.title, errOrMsg.message, AlertType.ERROR);
      else
        me.alert.show(title || me.infoTitle, errOrMsg);
    }
  }

  confirm(item: StorageModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmUnregister, item.name),
        AlertType.DELETE, handler);
  }

  confirmEx(message: string, handlerOK: Function, handlerCancel: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message,
        AlertType.CONFIRMATION, handlerOK, handlerCancel);
  }



  onRefresh(): void {
    this.progressTransition = false;
    this.loadData();
  }

  onEditClick(item: StorageModel) {
    this.editClick.emit(item);
  }

  onManageClick(item: StorageModel) {
    this.manageClick.emit(item);
  }

  onDeleteClick(item: StorageModel) {
    let me = this;

    me.confirm(item, function () {
      me.maskList = true;
      me.storageManageService.unregister(item)
        .takeUntil(me.subs).subscribe(
          () => {
            me.maskList = false;
            me.loadData();
          },
          err => {
            me.maskList = false;
            me.handleError(err);
          }
        );
    });
  }

  handleError(err: any, node?: boolean, silence?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node, silence);
  }

  getLinkDisplayName(value: string): string {
    return SharedService.formatCamelCase(value);
  }

  getProgressBarStatus(value: StorageModel): ProgressBarStatus {
    let percentage = this.getPercentage(value);
    if (percentage >= this.percentDanger) {
      return 'critical';
    } else if (percentage >= this.percentWarning) {
      return 'warning';
    } else {
      return 'normal';
    }
    }

  getToolTipMode(value: StorageModel): string {
    let percentage = this.getPercentage(value);
    if (percentage >= this.percentDanger) {
      return 'critical';
    } else if (percentage >= this.percentWarning) {
      return 'warning';
    } else {
      return 'info';
    }
  }

  getPercentage(value: StorageModel): number  {
    let me = this;
    return Math.round(((value.capacity.total - value.capacity.free) / value.capacity.total) * 100);
  }

  getBarLabel(value: StorageModel): string {
    let me = this;
    return SharedService.formatString('{0}%', me.getPercentage(value));
    }

  getToolTipLabel(value: StorageModel): string {
    let timestamp = this.datePipe.transform(value.capacity.updateTime, 'll LTS');
    return SharedService.formatString(this.textUpdated + ' {0}', timestamp);
  }

  getCapacityLabel(value: StorageModel): string {
    let totalDisp = this.fileSize.transform(value.capacity.total);
    let usedDisp = this.fileSize.transform((value.capacity.total - value.capacity.free));
    return SharedService.formatString('{0}/{1}', usedDisp, totalDisp);
  }

  hasCapacityIsReady(item: StorageModel): boolean {
    return (item.capacity && item.capacity.total && item.capacity.total !== 0) && item.isReady;
  }

  private getActionLinks(item: StorageModel): LinkModel[] {
    return item.getActionLinks(this.actionLinkExcludes);
  }

  private isReady(storage: StorageModel): boolean {
    return storage && storage.initializeStatus === 'Ready';
  }

  private handleAutoRefreshOfVsnaps(): void {
    let me = this;
    if (!me.isLoading) {
      if (me.storageTableData && me.storageTableData.length > 0) {
        me.storageTableData.forEach((storage: StorageModel, idx: number) => {
          me.refreshVsnapIfNotReady(storage, idx);
        });
      }
    }
  }

  private refreshVsnapIfNotReady(storage: StorageModel, idx: number): void {
    let me = this;
    if (storage && !me.isReady(storage)) {
      me.refreshVsnapFromLive(storage, (data: StorageModel) => {
        if (typeof idx === 'number')
          me.storageTableData[idx] = data;
      }, (err) => {
        me.handleError(err, false, true);
      });
    } else {
      me.onRefresh();
    }
  }

  private refreshVsnapFromLive(storage: StorageModel, successFn?: Function, errFn?: Function): void {
    let me = this;
    if (storage && storage.hasLink('refresh') && !storage.isLoadingFromLive) {
      storage.isLoadingFromLive = true;
      me.storageManageService.refreshVsnap(storage)
        .takeUntil(me.subs).subscribe(
        (data: StorageModel) => {
          if (typeof successFn === 'function' && successFn !== null)
            successFn.call(me, data);
        },
        err => {
          storage.isLoadingFromLive = false;
          if (typeof errFn === 'function' && successFn !== null)
            errFn.call(me, err);
        }
      );
    }
  }

  private setFilters(): void {
    let me = this;
    if (me.storageFilter) {
      me.storageFilter.forEach(function (item: string) {
        me.filters.push(new FilterModel('type', item));
      });
    }
  }

  private onExecuteAction(item: StorageModel, link: LinkModel): void {
    let me = this;
    if (link.name === 'initialize'){
      me.maskList = true;
      me.storageManageService.initializeVSnap(item)
        .takeUntil(me.subs).subscribe(
          data => {
            me.info(SharedService.formatString(me.textInitStarted, item.name));
            me.maskList = false;
            me.loadData();
          },
          err => {
            me.maskList = false;
            me.handleError(err);
          }
        );
    } else if (link.name === 'initializeWithEncryption'){
      me.maskList = true;
      me.storageManageService.initializeVSnapWithEncryption(item)
        .takeUntil(me.subs).subscribe(
          data => {
            me.maskList = false;
            me.info(SharedService.formatString(me.textInitStarted, item.name));
            me.loadData();
          },
          err => {
            me.maskList = false;
            me.handleError(err);
          }
        );
    } else if (link.name === 'rescan') {
      me.maskList = true;
      me.storageManageService.rescanVSnapServerDisks(item)
        .takeUntil(me.subs).subscribe(
          data => {
            me.maskList = false;
            me.info(SharedService.formatString(me.textRescanComplete, item.name));
            me.handleAutoRefreshOfVsnaps();
          },
          err => {
            me.maskList = false;
            me.handleError(err);
          }
        );
    } else if (link.name === 'refresh') {
      if (!item.isLoadingFromLive)
        me.info(SharedService.formatString(me.textRefreshMayTakeWhileMsg, item.name));
        me.refreshVsnapFromLive(item, (data: StorageModel) => {
            let idx: number = -1;
            me.info(SharedService.formatString(me.textRefreshCompletedMsg, item.name));
            idx = (me.storageTableData || []).findIndex((storage) => {
              return storage.storageId === data.storageId;
            });
            if (idx !== -1) {
              me.storageTableData[idx] = data;
            }
            me.maskList = false;
            me.handleAutoRefreshOfVsnaps();
          }, (err) => {
              me.maskList = false;
              item.isLoadingFromLive = false;
              me.handleError(err);
          });
    } else {
      me.maskList = true;
      me.storageManageService.doAction(item, link)
        .takeUntil(me.subs).subscribe(
        (data) => {
          me.maskList = false;
        },
        err => {
          me.maskList = false;
          me.handleError(err);
        }
      );
    }
  }

  private getDropDownMenuId(item: StorageModel): string {
    return 'job-table-dropdown-menu-' + item.id;
  }
}
