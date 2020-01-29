import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {AccessUserModel} from '../user.model';
import {AccessUsersModel} from '../users.model';
import {RestService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {SharedService} from 'shared/shared.service';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {BaseModel} from 'shared/models/base.model';
import {Selectable} from 'shared/util/selectable';
import {applyMixins} from 'rxjs/util/applyMixins';
import {HighlightableList} from 'shared/util/keyboard';

@Component({
  selector: 'user-table',
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss']
})
export class UserTableComponent extends HighlightableList implements OnInit, Sortable, Selectable {
  @Output() usersLoad = new EventEmitter<DatasetModel<AccessUserModel>>();
  @Output() selectionChange = new EventEmitter();
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  selectedItems: Array<AccessUserModel> = [];
  isSelected: (item: BaseModel) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent) => void;

  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;
  private model: PaginateModel<AccessUserModel>;
  private currentLink: LinkModel;
  private loadFilters: FilterModel[];
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService) {
    super();
    let paginationId: string = `user-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: AccessUsersModel, relyOnPageLinks: true});
    this.filters = [];
    this.nameSort = new SorterModel('name', 'ASC');
    this.sorters = [this.nameSort];
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  confirm(item: AccessUserModel, handler: Function) {
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

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'users.textConfirmDelete'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['users.textConfirmDelete'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  loadData(demo?: boolean, filters?: FilterModel[]) {
    let me = this, observable: Observable<AccessUsersModel>;

    me.mask();

    me.loadFilters = filters;

    observable = demo ? me.dummyDataUsers() :
      AccessUsersModel.retrieve<AccessUserModel, AccessUsersModel>(AccessUsersModel, me.rest,
        me.mergedFilters(filters), me.sorters, 0);

    if (observable) {
      observable.subscribe(
        dataset => {
          me.model.reset();
          me.model.update(dataset);
          me.selectedItems = [];
          me.usersLoad.emit(dataset);
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

  dummyDataUsers(): Observable<AccessUsersModel> {
    let me = this, dataset = new AccessUsersModel();
    dataset.total = 30;
    for (let i = 0; i < dataset.total; i++) {
      let user = new AccessUserModel();
      user.id = 'user' + i;
      user.name = 'User' + i;
      user.links = {
        self: {
          rel: 'self',
          href: `${me.rest.getBaseUrl()}api/user/${user.id}`
        }
      };
      if (i % 2 === 0) {
        user.links['edit'] = {
          rel: 'related',
          href: `${me.rest.getBaseUrl()}api/user/${user.id}`
        };
        user.links['delete'] = {
          rel: 'related',
          href: `${me.rest.getBaseUrl()}api/user/${user.id}`
        };
        user.links['test'] = {
          rel: 'action',
          href: `${me.rest.getBaseUrl()}api/user/${user.id}?action=test`
        };
      }
      dataset.records.push(user);
    }
    return Observable.of(dataset).delay(1000).do(val => val);
  }

  onDeleteClick(item: AccessUserModel) {
    let me = this, observable: Observable<boolean>;
    me.confirm(item, function () {

      me.mask();
      observable = item.remove(me.rest);
      if (observable) {
        observable.subscribe(
          record => {
            me.unmask();
            me.onRefresh();
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

  private mergedFilters(searchFilters: Array<FilterModel>): Array<FilterModel> {
    let me = this;
    return (me.filters || []).concat(searchFilters || []);
  }

  /**
   * Refresh method.
   * @param {LinkModel} link
   */
  private refresh(link: LinkModel): void {
    let me = this, ds = me.model.dataset, observable: Observable<AccessUsersModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<AccessUsersModel>(AccessUsersModel, link);
    if (observable) {
      observable.subscribe(
        dataset => {
          me.model.update(dataset);
          me.selectedItems = [];
          me.usersLoad.emit(dataset);
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

  private onRefresh(): void {
    let me = this;
    if (me.currentLink) {
      me.refresh(me.currentLink);
    } else {
      me.loadData(false, me.loadFilters);
    }
  }

  private onExecuteAction(item: AccessUserModel, link: LinkModel): void {
    this.doAction(item, link.name);
  }

  private refreshDisplayFields(target: AccessUserModel, updated: AccessUserModel): void {
    target.name = updated.name;
    target.links = updated.links;
  }

  private doAction(item: AccessUserModel, name: string): void {
    let me = this, payload = {}, observable: Observable<AccessUserModel>;

    me.mask();
    observable = item.doAction<AccessUserModel>(AccessUserModel, name, payload, me.rest);
    if (observable)
      observable.subscribe(
        updated => {
          me.unmask();
          if (updated)
            me.refreshDisplayFields(item, updated);
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
    else
      me.unmask();
  }
}
applyMixins(UserTableComponent, [Selectable]);
