import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {AuditLogModel} from '../audit-log.model';
import {AuditLogsModel} from '../audit-logs.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';

@Component({
  selector: 'auditlog-table',
  templateUrl: './audit-log-table.component.html'
})
export class AuditLogTableComponent implements OnInit {
  @Input() auditLogsData: AuditLogsModel = undefined;
  @Input() paginateConfig: PaginateConfigModel = undefined;
  @Input() infiniteScrollingMode: boolean = false;

  @ViewChild('infiniteScrollContainer') infiniteScrollContainer: ElementRef;

  get displayedCount(): number {
    return this.auditLogsData && this.auditLogsData.logs ? this.auditLogsData.logs.length : 0;
  }

  constructor( ) { }

  getRecords(): Array<AuditLogModel> {
    return this.auditLogsData.logs;
  }

  isRecords(): boolean {
    if (this.auditLogsData === undefined) {
      return false;
    }

    return true;
  }

  ngOnInit() { }

  ngAfterViewInit() { }

  onScrollDown(model: AuditLogsModel): void {
    let me = this,
      count = me.getModelRecordCount(model);
    if (count > 0) {
      me.appendPageRecords(model);
    }
  }

  onScrollUp(model: AuditLogsModel): void {
    let me = this,
      count = me.getModelRecordCount(model);
    if (count > 0) {
      me.prependPageRecords(model);
    }
  }

  private addPageRecords(up: boolean, model: AuditLogsModel): void {
    let me = this;
    if (up) {
      me.auditLogsData.logs.unshift(...(model.logs || []).reverse());
    } else {
      me.auditLogsData.logs.push(...(model.logs || []));
    }
  }

  private getPageRecordTotal(): number {
    let me = this, data = me.auditLogsData;
    return data && data.logs ? data.logs.length : 0;
  }

  private appendPageRecords(model: AuditLogsModel): void {
    this.addPageRecords(false, model);
  }

  private prependPageRecords(model: AuditLogsModel): void {
    this.addPageRecords(true, model);
  }

  private getModelRecordCount(model: AuditLogsModel): number {
    return model && model.logs ? model.logs.length : 0;
  }
}

