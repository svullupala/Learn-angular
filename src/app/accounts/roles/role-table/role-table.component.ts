import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {AccessRoleModel} from '../role.model';
import {AccessRolesModel} from '../roles.model';
import {RestService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {Selectable} from 'shared/util/selectable';
import {BaseModel} from 'shared/models/base.model';
import {applyMixins} from 'rxjs/util/applyMixins';
import {SortUtil} from 'shared/util/sortable';
import { Subject } from 'rxjs/Subject';
import {HighlightableList} from 'shared/util/keyboard';

@Component({
  selector: 'role-table',
  templateUrl: './role-table.component.html',
  styleUrls: ['./role-table.component.scss']
})
export class RoleTableComponent extends HighlightableList implements OnInit, Selectable, OnDestroy {
  @Output() rolesLoad = new EventEmitter<DatasetModel<AccessRoleModel>>();
  @Output() selectionChange = new EventEmitter();

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  selectedItems: Array<AccessRoleModel> = [];
  isSelected: (item: BaseModel) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent) => void;

  private filters: Array<FilterModel>;
  private subs: Subject<void> = new Subject<void>();
  private model: PaginateModel<AccessRoleModel>;
  private currentLink: LinkModel;
  private loadFilters: FilterModel[];
  private processingRequestMsg: string;
  private masked: boolean = false;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;


  constructor(private rest: RestService,
              private translate: TranslateService) {
    super();
    let paginationId: string = `role-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: AccessRolesModel, relyOnPageLinks: true});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
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
      'roles.textConfirmDelete']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
      });
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
    let me = this, observable: Observable<AccessRolesModel>,
      sorters = me.sorters || [new SorterModel('name', 'ASC')];

    me.mask();

    me.loadFilters = filters;

    observable = AccessRolesModel.retrieve<AccessRoleModel, AccessRolesModel>(AccessRolesModel, me.rest,
        me.mergedFilters(filters), sorters, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {

          me.model.reset();
          me.model.update(dataset);
          me.selectedItems = [];
          me.rolesLoad.emit(dataset);
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

  public onRefresh(): void {
    let me = this;
    if (me.currentLink) {
      me.refresh(me.currentLink);
    } else {
      me.loadData(false, me.loadFilters);
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
    let me = this, ds = me.model.dataset, observable: Observable<AccessRolesModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<AccessRolesModel>(AccessRolesModel, link);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.model.update(dataset);
          me.selectedItems = [];
          me.rolesLoad.emit(dataset);
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

  private onPageChange(param: { page: number, link: LinkModel }): void {
    this.currentLink = param.link;
    this.unmask();
  }
}
applyMixins(RoleTableComponent, [Selectable]);
