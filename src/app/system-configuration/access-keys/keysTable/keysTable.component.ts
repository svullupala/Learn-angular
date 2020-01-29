import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {SorterModel} from 'shared/models/sorter.model';
import {KeyModel} from '../key.model';
import {AccessKeysService} from '../access-keys.service';
import {KeysModel} from '../keys.model';
import {FilterModel} from 'shared/models/filter.model';

@Component({
  selector: 'keys-table',
  styleUrls: [],
  templateUrl: './keysTable.component.html'
})

export class KeysTableComponent implements OnInit, Sortable {

  @Output() deleteClick = new EventEmitter<KeyModel>();
  @Output() editClick = new EventEmitter<KeyModel>();

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  disableAddKeys: boolean = false;

  protected keysTableData: Array<KeyModel>;
  protected sorters: Array<SorterModel>;
  protected nameSort: SorterModel;

  private keytypeFilter: FilterModel = new FilterModel('keytype',['exch_key'],'NOT IN');

  constructor(protected accessKeysService: AccessKeysService) {
    let paginationId: string = `keys-table-pagination-${(new Date()).valueOf()}`;
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
    me.accessKeysService.getKeys(me.sorters, [this.keytypeFilter])
      .subscribe(
        data => {
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, KeysModel);
          me.disableAddKeys = !dataset.hasLink('create');
          me.keysTableData = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.paginateConfig.itemsPerPage = dataset.total || 1;
        },
        err => me.handleError(err)
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

  onEditClick(item: KeyModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: KeyModel) {
    this.deleteClick.emit(item);
  }

  canDelete(item: KeyModel) {
    return item.hasLink('delete');
  }

  canEdit(item: KeyModel) {
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
