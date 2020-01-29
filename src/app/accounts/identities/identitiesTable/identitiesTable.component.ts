import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {JsonConvert} from 'json2typescript';

import {AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {IdentityModel} from '../identity.model';
import {IdentitiesModel} from '../identities.model';
import {IdentitiesService} from '../identities.service';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {SorterModel} from 'shared/models/sorter.model';

@Component({
  selector: 'identities-table',
  styleUrls: ['identitiesTable.component.scss'],
  templateUrl: './identitiesTable.component.html'
})

export class IdentitiesTableComponent implements OnInit, Sortable {

  @Output() deleteClick = new EventEmitter<IdentityModel>();
  @Output() editClick = new EventEmitter<IdentityModel>();
  @Output() dataLoad = new EventEmitter<boolean>();

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  private identitiesTableData: Array<IdentityModel>;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;

  constructor(private identitiesService: IdentitiesService) {
    let paginationId: string = `storage-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.nameSort = new SorterModel('name', 'ASC');
    me.sorters = [me.nameSort];
    me.loadData();
  }

  loadData() {
    let me = this;
    me.identitiesService.getCredentials(me.sorters)
      .subscribe(
        data => {
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, IdentitiesModel);
          me.identitiesTableData = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.paginateConfig.itemsPerPage = dataset.total || 1;

          me.dataLoad.emit(dataset.getLink('create') !== undefined);
        },
        err => me.handleError(err),
      );
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onRefresh(): void {
    this.loadData();
  }

  onEditClick(item: IdentityModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: IdentityModel) {
    this.deleteClick.emit(item);
  }

  canDelete(item: IdentityModel) {
    return item.hasLink('delete');
  }

  canEdit(item: IdentityModel) {
    return item.hasLink('edit');
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
