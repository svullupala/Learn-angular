import {Component, OnInit, Input, Output, EventEmitter, OnDestroy, AfterViewInit} from '@angular/core';

import {JsonConvert} from 'json2typescript';

import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {SlapolicyModel} from '../slapolicy.model';
import {SlapolicyService} from '../slapolicy.service';
import {SlapoliciesModel} from '../slapolicies.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {Subscription} from 'rxjs/Subscription';
import {NodeService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {SortUtil} from 'shared/util/sortable';

@Component({
  selector: 'policy-table',
  templateUrl: './policyTable.component.html',
  styleUrls: ['policyTable.component.scss']
})

export class PolicyTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() deleteClick = new EventEmitter<SlapolicyModel>();
  @Output() editClick = new EventEmitter<SlapolicyModel>();
  @Output() dataLoad = new EventEmitter<boolean>();

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  private policyTableData: Array<SlapolicyModel>;
  private subjectHandler: Subscription;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;

  constructor(private slapolicyService: SlapolicyService) {
    let paginationId: string = `slapolicy-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId, pageSize: NodeService.pageSize});
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.subjectHandler = me.slapolicyService.slapolicySubject.subscribe(
        next => me.onRefresh()
    );
    me.nameSort = new SorterModel('name', 'ASC');
    me.sorters = [me.nameSort];
  }

  ngAfterViewInit(): void {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.subjectHandler) {
      this.subjectHandler.unsubscribe();
    }
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    this.loadData();
  }

  loadData() {
    let me = this;
    me.policyTableData = undefined;
    me.slapolicyService.getSLAPolicies(undefined, me.sorters, me.paginateConfig.pageStartIndex())
      .subscribe(
        data => {
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, SlapoliciesModel);

          me.policyTableData = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.dataLoad.emit(dataset.getLink('create') !== undefined);

        },
        err => {
          if (err && err.error && err.error.message) {
            if (err.error.message.indexOf('8082') !== -1) {
              err.message = 'API';
            } else if (err.error.message.indexOf('8083') !== -1) {
              err.message = 'NGP';
            }
          }
          me.handleError(err, true);
        }
      );
  }

  onEditClick(item: SlapolicyModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: SlapolicyModel) {
    this.deleteClick.emit(item);
  }

  isAsc(name: string): boolean {
    return SortUtil.has(this.sorters, name, false);
  }

  isDesc(name: string): boolean {
    return SortUtil.has(this.sorters, name, true);
  }

  onSort(name: string): void {
    this.changeSorter(name);
    SortUtil.toggle(this.sorters, name);
    this.onRefresh();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    }
  }
}
