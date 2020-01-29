import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { JsonConvert } from 'json2typescript';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { AlertComponent, PagingToolbarComponent } from 'shared/components/index';
import { SessionService } from 'core';
import { AuditLogsModel } from './audit-logs.model';
import { AuditLogService } from './audit-log.service';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { AuditLogSearchOptionsComponent } from './audit-log-search-options/audit-log-search-options.component';
import { AuditLogSearchOptionsModel } from './audit-log-search-options.model';
import { FilterModel } from 'shared/models/filter.model';
import { DownloaderComponent } from 'shared/components/downloader/downloader.component';
import { HttpParams } from '@angular/common/http';
import { AuditLogTableComponent } from './audit-log-table/audit-log-table.component';

@Component({
  selector: 'audit-log',
  templateUrl: './audit-log.view.html',
  styleUrls: ['./audit-log.scss']
})
export class AuditLogView implements OnInit, AfterViewInit, OnDestroy {
  auditLogsData: AuditLogsModel = undefined;
  placeholderLabel: string;
  filterValue: FilterModel[] = undefined;
  loading: boolean = true;
  paginationId: string = `auditlog-table-pagination-${(new Date()).valueOf()}`;
  paginateConfig: PaginateConfigModel;
  downloader: DownloaderComponent;
  @ViewChild(AuditLogSearchOptionsComponent) searchOptions: AuditLogSearchOptionsComponent;
  @ViewChild(AuditLogTableComponent) logTable: AuditLogTableComponent;
  @ViewChild(PagingToolbarComponent) pagingToolbar: PagingToolbarComponent;

  get infiniteScrollingMode(): boolean {
    return this.pagingToolbar ? this.pagingToolbar.isInfiniteScrollingMode : false;
  }

  get infiniteScrollContainer(): ElementRef {
    return this.logTable ? this.logTable.infiniteScrollContainer : null;
  }

  get displayedCount(): number {
    return this.logTable ? this.logTable.displayedCount : 0;
  }

  private textDownloadTitle: string;
  private textDownloadInitiatedMsg: string;
  private textUnexpectedNetworkError: string;
  private errorHandler: ErrorHandlerComponent;
  private hasDownloadPermission: boolean = false;
  private entryStartIndex: number = 0;
  private jumpToPending: boolean = false;
  private alert: AlertComponent;

  private subs: any[] = [];

  set infiniteScrollLoadingIndicator(status: boolean) {
    if (this.pagingToolbar)
      this.pagingToolbar.infiniteScrollLoadingIndicator = status;
  }

  set infiniteScrollDisabled(disabled: boolean) {
    if (this.pagingToolbar)
      this.pagingToolbar.infiniteScrollDisabled = disabled;
  }

  constructor(private auditLogService: AuditLogService,
    private translateService: TranslateService) {
    this.init();
  }

  /**
   * User entered a search string and clicked on search.
   * @param value Search string.
   */
  searchSubmit(value: string) {
    this.filterValue = this.createFilter(value);
    this.pageReset();
    this.getRecords();
  }

  onPageChange(pageNumber: number): void {
    this.paginateConfig.pageChanged(pageNumber);
    this.getRecords();
  }

  onRefresh() {
    this.infiniteScrollDisabled = true;
    this.getRecords();
  }

  ngOnInit() {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.downloader = SessionService.getInstance().context['downloader'];
    this.subs.push(this.translateService.get(['common.unexpecedNetworkErrorMsg',
      'common.textDownloadInitiatedMsg',
      'auditlog.textDownload',
      'auditlog.searchPlaceholder'])
      .subscribe((resource: Object) => {
        this.textUnexpectedNetworkError = resource['common.textUnexpectedNetworkError'];
        this.placeholderLabel = resource['auditlog.searchPlaceholder'];
        this.textDownloadTitle = resource['auditlog.textDownload'];
        this.textDownloadInitiatedMsg = resource['common.textDownloadInitiatedMsg'];
      },
        err => {
          this.errorHandler.handle(err);
        }
      ));

    JsonConvert.valueCheckingMode = JsonConvert.ValueCheckingMode.ALLOW_NULL;
  }

  ngAfterViewInit() {
    this.getRecords();
  }

  ngOnDestroy() {
    for (let i = 0; i < this.subs.length; i++) {
      if (this.subs[i]) {
        this.subs[i].unsubscribe();
      }
    }
  }

  dimOn() {
    this.loading = true;
  }

  dimOff() {
    this.loading = false;
  }

  getRecords(jumpToStartIndex?: number) {
    let jumpTo = jumpToStartIndex !== undefined,
      startIndex = jumpTo ? jumpToStartIndex : this.paginateConfig.pageStartIndex();
    this.dimOn();
    this.subs.push(this.auditLogService.getAuditLogs(this.filterValue, this.paginateConfig.pageSize(),
      startIndex).subscribe(
        auditlogs => {
          this.auditLogsData = auditlogs;
          this.paginateConfig.refresh(auditlogs.total);

          this.entryStartIndex = startIndex;

          if (jumpTo) {
            this.jumpToPending = true;
            this.resetScroll();
          } else {
            this.jumpToPending = false;
          }
          this.infiniteScrollDisabled = false;
          this.dimOff();
        },
        err => {
          this.errorHandler.handle(err);
        }
      ));
  }

  onDownloadClick() {
    let me = this, href = me.getDownloadUrl();
    if (href && me.downloader) {
      me.downloader.download(href);
      if (me.alert)
        me.alert.show(me.textDownloadTitle, me.textDownloadInitiatedMsg);
    }
  }

  onJumpTo(entryNum: number): void {
    this.infiniteScrollDisabled = true;
    this.getRecords(entryNum - 1);
  }

  onScrollDown(): void {
    this.onInfiniteScroll(false);
  }

  onScrollUp(): void {
    if (this.jumpToPending) {
      this.jumpToPending = false;
      return;
    }
    this.onInfiniteScroll(true);
  }

  private onInfiniteScroll(up: boolean): void {
    let me = this, pageStartIndex;

    if (!up && !me.hasNextPage() || up && !me.hasPrevPage())
      return;

    me.infiniteScrollLoadingIndicator = true;
    if (!up) {
      me.paginateConfig.currentPage++;
    }

    pageStartIndex = me.infiniteScrollPageStartIndex(up);

    me.subs.push(me.auditLogService.getAuditLogs(me.filterValue, me.infiniteScrollPageSize(up),
      pageStartIndex).subscribe(
        model => {

          me.paginateConfig.refresh(model.total);

          if (me.logTable) {
            up ? me.logTable.onScrollUp(model) : me.logTable.onScrollDown(model);
          }
          if (up)
            me.entryStartIndex = pageStartIndex;

          me.infiniteScrollLoadingIndicator = false;
        },
        err => {
          me.infiniteScrollLoadingIndicator = false;
          this.errorHandler.handle(err);
        }
      ));
  }

  private hasPrevPage(): boolean {
    return this.entryStartIndex > 0;
  }

  private hasNextPage(): boolean {
    return this.entryStartIndex + this.displayedCount < this.paginateConfig.totalItems;
  }

  private infiniteScrollPageStartIndex(up: boolean): number {
    let me = this, pageSize = me.paginateConfig.pageSize();
    return up ? (me.entryStartIndex >= pageSize ? me.entryStartIndex - pageSize : 0) :
      me.entryStartIndex + me.displayedCount;
  }

  private infiniteScrollPageSize(up: boolean): number {
    let me = this, pageSize = me.paginateConfig.pageSize();
    return up ? (me.entryStartIndex >= pageSize ? pageSize : me.entryStartIndex) : pageSize;
  }

  private resetScroll(): void {
    if (this.pagingToolbar)
      this.pagingToolbar.scrollToTop();
  }

  /**
   * Returns log download URL.
   *
   * @method getDownloadUrl
   * @return {string} String indicates download URL
   */
  private getDownloadUrl(): string {
    let me = this, filter, params, url = me.auditLogService.getAuditDiagnosticsUrl(),
      filters = me.filterValue;

    if (filters && filters) {
      filter = FilterModel.array2json(filters);
    }

    // Make sure that only download specific logs if a filter is entered.
    if (filter && filter.length > 0) {
      params = new HttpParams({ fromObject: { 'filter': JSON.stringify(filter) } });
      url = url + '&' + params.toString();
    }
    return url;
  }

  private createFilter(usersValue: string): FilterModel[] {
    let me = this, options = me.getSearchOptions(), result: FilterModel[] = [];

    if (usersValue && usersValue.trim().length > 0 && usersValue.trim() !== '*') {
      let users: string[] = [];
      usersValue.split(',').forEach(function (value: string) {
        if (value.trim().length > 0)
          users.push(value.trim());
      });
      if (users.length > 0)
        result.push(new FilterModel('user', users, 'IN'));
    }

    if (options.accessDateRange && options.accessDateRange.length === 2) {
      let from = options.accessDateRange[0].setHours(0, 0, 0, 0),
        to = options.accessDateRange[1].setHours(23, 59, 59, 999);
      // Note: Change the property name according to the contract of Audit Log Search API.
      result.push(new FilterModel('accessTime', from, '>='));
      result.push(new FilterModel('accessTime', to, '<='));
    }

    if (options.description && options.description.trim().length > 0) {
      let description = options.description.trim();
      if (!description.startsWith('*'))
        description = '*' + description;
      if (!description.endsWith('*'))
        description = description + '*';
      // Note: Change the property name according to the contract of Audit Log Search API.
      result.push(new FilterModel('description', description));
    }

    return result;
  }

  private getSearchOptions(): AuditLogSearchOptionsModel {
    let me = this, params: AuditLogSearchOptionsModel;
    if (me.searchOptions)
      params = me.searchOptions.getValue();
    return params;
  }

  private pageReset() {
    this.paginateConfig.reset();
  }

  private getDownloadPermission() {
    this.subs.push(this.auditLogService.getLogViewCheck().subscribe(
      res => {
        this.hasDownloadPermission = res;
      }));
  }

  private init() {
    this.getDownloadPermission();
    this.paginateConfig = new PaginateConfigModel({ id: this.paginationId });
    this.filterValue = undefined;
    this.pageReset();
  }

}
