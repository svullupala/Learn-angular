import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {ResourceGroupModel} from '../resource-group.model';
import {ResourceGroupsModel} from '../resource-groups.model';
import {RestService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {SharedService} from 'shared/shared.service';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import {DatasetModel} from 'shared/models/dataset.model';
import { Subject } from 'rxjs/Subject';
import { Selectable } from 'shared/util/selectable';
import { applyMixins } from 'rxjs/util/applyMixins';
import { BaseModel } from 'shared/models/base.model';
import { ResourceGroupsService } from '../resource-groups.service';
import {SortUtil} from 'shared/util/sortable';
import {HighlightableList} from 'shared/util/keyboard';

@Component({
  selector: 'resource-group-table',
  templateUrl: './resource-group-table.component.html',
  styleUrls: ['./resource-group-table.component.scss'],
})
export class ResourceGroupTableComponent extends HighlightableList implements OnInit, Selectable {
  @Output() resourceGroupsLoad = new EventEmitter<DatasetModel<ResourceGroupModel>>();
  @Output() editClick = new EventEmitter<ResourceGroupModel>();
  @Output() selectionChange = new EventEmitter();
  @Output() emptyEvent: EventEmitter<void>  = new EventEmitter<void>();
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  selectedItems: Array<ResourceGroupModel> = [];
  isSelected: (item: BaseModel) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent) => void;
  private subs: Subject<void> = new Subject<void>();
  private filters: Array<FilterModel>;
  private model: PaginateModel<ResourceGroupModel>;
  private currentLink: LinkModel;
  private loadFilters: FilterModel[];
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private masked: boolean = false;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;

  constructor(private rest: RestService,
              private resourceGroupsService: ResourceGroupsService,
              private translate: TranslateService) {
    super();
    let paginationId: string = `resource-group-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: ResourceGroupsModel, relyOnPageLinks: true});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  confirm(item: ResourceGroupModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmDelete, item.name),
        AlertType.CONFIRMATION, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'resourceGroups.textConfirmDelete']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['resourceGroups.textConfirmDelete'];
      });
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
    me.resourceGroupsService.deleteItemSub.takeUntil(me.subs).subscribe(
      (item: ResourceGroupModel) => me.onDeleteClick(item)
    );
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.filters = [];
    me.nameSort = new SorterModel('name', 'ASC');
    me.sorters = [me.nameSort];
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  loadData(demo?: boolean, filters?: FilterModel[]) {
    let me = this, observable: Observable<ResourceGroupsModel>,
      sorters = me.sorters || [new SorterModel('name', 'ASC')];

    me.mask();

    me.loadFilters = filters;

    observable = ResourceGroupsModel.retrieve<ResourceGroupModel, ResourceGroupsModel>(ResourceGroupsModel, me.rest,
        me.mergedFilters(filters), sorters, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          let total: number;
          me.model.reset();
          me.model.update(dataset);
          total = (dataset.total < 1 && me.model.records.length > 0)
                  ? me.model.records.length
                  : dataset.total;
          me.model.refresh(total);
          me.selectedItems = [];
          me.resourceGroupsLoad.emit(dataset);
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  onEditClick(item: ResourceGroupModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: ResourceGroupModel) {
    let me = this, observable: Observable<boolean>;
    me.confirm(item, function () {

      me.mask();
      observable = item.remove(me.rest);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me.unmask();
            me.onRefresh();
            me.emptyEvent.emit();
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
      } else {
        me.unmask();
      }
    });
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

  private mergedFilters(searchFilters: Array<FilterModel>): Array<FilterModel> {
    let me = this;
    return (me.filters || []).concat(searchFilters || []);
  }

  /**
   * Refresh method.
   * @param {LinkModel} link
   */
  private refresh(link: LinkModel): void {
    let me = this, ds = me.model.dataset, observable: Observable<ResourceGroupsModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<ResourceGroupsModel>(ResourceGroupsModel, link);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.model.update(dataset);
          me.model.refresh(dataset.total);
          me.selectedItems = [];
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private reset(): void {
    this.selectedItems = [];
    this.resetSelection();
  }

  private resetSelection(): void {
    this.model.records.forEach((item: BaseModel) => {
      item.metadata['selected'] = false;
    });
  }

  private onPageChange(param: { page: number, link: LinkModel }): void {
    this.currentLink = param.link;
    this.unmask();
  }

  private onRefresh(): void {
    let me = this;
    if (me.currentLink) {
      me.refresh(me.currentLink);
    } else {
      me.loadData(false, me.loadFilters);
    }
  }
}
applyMixins(ResourceGroupTableComponent, [Selectable]);
