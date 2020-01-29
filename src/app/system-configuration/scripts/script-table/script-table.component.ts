import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {RestService} from 'core';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {ScriptModel} from '../script.model';
import {ScriptsModel} from '../scripts.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {isNumber} from 'util';

@Component({
  selector: 'script-table',
  styleUrls: ['./script-table.component.scss'],
  templateUrl: './script-table.component.html'
})

export class ScriptTableComponent implements OnInit, Sortable {

  @Output() deleteClick = new EventEmitter<ScriptModel>();
  @Output() editClick = new EventEmitter<ScriptModel>();
  @Output() downloadClick = new EventEmitter<ScriptModel>();
  @Output() scriptsLoad = new EventEmitter<ScriptsModel>();

  model: PaginateModel<ScriptModel>;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;
  private lastUpdateSort: SorterModel;
  private masked: boolean = false;

  constructor(private translate: TranslateService, private restService: RestService) {
    let paginationId: string = `script-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: ScriptsModel, relyOnPageLinks: true});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    // Initialize sorters.
    me.nameSort = new SorterModel('name', 'ASC');
    me.lastUpdateSort = new SorterModel('lastUpdated', 'DESC');
    me.sorters = [me.nameSort];
    me.loadData();
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
    this.loadData();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    } else if (name === 'lastUpdated') {
      this.sorters = [this.lastUpdateSort];
    }
  }

  loadData() {
    let me = this, observable: Observable<ScriptsModel>;
    observable = ScriptsModel.retrieve<ScriptModel, ScriptsModel>(ScriptsModel,
      me.restService, me.filters, me.sorters, me.model.pageStartIndex());
    if (observable) {
      observable.subscribe(
        dataset => {
          if (dataset) {
            me.model.update(dataset);
          }
          me.scriptsLoad.emit(dataset);
        },
        err => {
          me.handleError(err);
          me.model.reset();
        }
      );
    }
  }

  onPageChange(page: any): void {
    let me = this;
    if (isNumber(page)) {
      me.model.pageChanged(page);
      me.loadData();
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onEditClick(item: ScriptModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: ScriptModel) {
    this.deleteClick.emit(item);
  }

  onDownloadClick(item: ScriptModel) {
    this.downloadClick.emit(item);
  }

  canDelete(item: ScriptModel) {
    return item.hasLink('delete');
  }

  canEdit(item: ScriptModel) {
    return item.hasLink('edit');
  }

  canDownload(item: ScriptModel) {
    return item.hasLink('download');
  }
}
