import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {PermissionEntryModel, PermissionGroupModel} from '../permission-group.model';
import {PermissionGroupsModel} from '../permission-groups.model';
import {RestService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import {DatasetModel} from 'shared/models/dataset.model';

@Component({
  selector: 'permission-group-select',
  templateUrl: './permission-group-select.component.html',
  styleUrls: ['./permission-group-select.component.scss'],
})
export class PermissionGroupSelectComponent implements OnInit {
  @Input() value: PermissionGroupModel[];
  @Output() permissionGroupsLoad = new EventEmitter<DatasetModel<PermissionGroupModel>>();
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private filters: Array<FilterModel>;
  private model: PaginateModel<PermissionGroupModel>;
  private currentLink: LinkModel;
  private requiredIds: string[] = PermissionGroupsModel.REQUIRED_IDS;
  private loadFilters: FilterModel[];
  private masked: boolean = false;

  private rowData: any[] = [];

  constructor(private rest: RestService,
              private translate: TranslateService) {
    let paginationId: string = `permission-group-select-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: PermissionGroupsModel, relyOnPageLinks: true});
    this.loadFilters = [new FilterModel('id', this.requiredIds, 'IN')];
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

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.filters = [];
    me.loadData(me.loadFilters);
  }

  getValue(): PermissionGroupModel[] {
    let me = this, result = [], groups = me.model.records || [];
    groups.forEach(function (group) {
      let newGroup: PermissionGroupModel,
          screenGroup: boolean = group.id === PermissionGroupsModel.SCREEN_ID; // Auto include all screen permissions!

      if (group.metadata['selected'] || screenGroup) {
        newGroup = new PermissionGroupModel();
        Object.assign(newGroup, group);
        newGroup.permissions = [];
        (group.permissions || []).forEach(function (perm) {
          if (perm.metadata['selected'] || screenGroup)
            newGroup.permissions.push(perm);
        });
        result.push(newGroup);
      }
    });
    return result;
  }

  setValue(value: PermissionGroupModel[]): void {
    this.value = value;
    this.initMetadata();
  }

  loadData(filters?: FilterModel[]) {
    let me = this, observable: Observable<PermissionGroupsModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];

    me.mask();

    me.loadFilters = filters;

    observable =
      PermissionGroupsModel.retrieve<PermissionGroupModel, PermissionGroupsModel>(PermissionGroupsModel, me.rest,
        me.mergedFilters(filters), sorters, 0);

    if (observable) {
      observable.subscribe(
        dataset => {
          me.filterOnDemand(dataset);
          me.model.reset();
          me.model.update(dataset);
          me.initMetadata();
          me.mapLayout();
          me.permissionGroupsLoad.emit(dataset);
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

  private filterOnDemand(dataset: PermissionGroupsModel): PermissionGroupsModel {
    let me = this, records = dataset.records;
    dataset.virtualresources = (records || []).filter(function (item) {
      return me.requiredIds.indexOf(item.name) !== -1;
    });
    return dataset;
  }

  private matchGroup(group: PermissionGroupModel): boolean {
    let me = this, value = me.value || [];
    return !!value.find(function (item) {
      return item.equals(group);
    });
  }

  private matchPermission(group: PermissionGroupModel, perm: PermissionEntryModel): boolean {
    let me = this, value = me.value || [],
      target = value.find(function (item) {
        return item.equals(group);
      });
    if (target) {
      return !!(target.permissions || []).find(function (item) {
        return item.id === perm.id;
      });
    }
    return false;
  }

  private initMetadata(): void {
    let me = this, groups = me.model.records || [];
    groups.forEach(function (group) {
      let hasPermMatched = false;

      if (me.matchGroup(group)) {

        (group.permissions || []).forEach(function (perm) {
          let matched = me.matchPermission(group, perm);
          if (!hasPermMatched && matched)
            hasPermMatched = true;
          perm.metadata['selected'] = matched;
        });
      } else {
        (group.permissions || []).forEach(function (perm) {
          perm.metadata['selected'] = false;
        });
      }
      group.metadata['selected'] = hasPermMatched;
    });
  }

  private mapLayout(): void {
    let me = this, records = me.model.records || [],
      cols = 3,
      counter = 0,
      rows = Math.ceil((records.length - 1) / cols);
    me.rowData = [];

    for (let i = 0; i < rows; i++) {
      let row: PermissionGroupModel[] = [];
      for (let j = 0; j < cols; j++) {
        if (me.isScreenGroup(records[counter])) {
          j--; // don't leave a div empty
        } else {
          row.push(records[counter]);
        }
        counter++;
      }
      me.rowData.push(row);
    }
  }

  private mergedFilters(searchFilters: Array<FilterModel>): Array<FilterModel> {
    let me = this;
    return (me.filters || []).concat(searchFilters || []);
  }

  private onPageChange(param: { page: number, link: LinkModel }): void {
    this.currentLink = param.link;
    this.unmask();
  }

  private onPermissionGroupChange(item: PermissionGroupModel): void {
    let selected = item.metadata['selected'];
    (item.permissions || []).forEach(function (perm) {
      perm.metadata['selected'] = selected;
    });
  }

  private onPermissionEntryChange(group: PermissionGroupModel, perm: PermissionEntryModel): void {
    let parentSelected = group.metadata['selected'], selected = perm.metadata['selected'];
    if (selected && !parentSelected)
      group.metadata['selected'] = true;
    else if (!selected && parentSelected) {
      if ((group.permissions || []).findIndex(function (item) {
          return item.metadata['selected'];
        }) === -1)
        group.metadata['selected'] = false;
    }
  }

  // Hardcoded these IDs here due to lack of time.  Why is PermissionGroupsModel static variables not available here?
  private isScreenGroup(group: any): boolean {
    return group && group.id === 'Screen';
  }
}
