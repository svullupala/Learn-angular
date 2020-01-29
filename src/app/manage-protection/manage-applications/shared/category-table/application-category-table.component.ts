import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent, ErrorHandlerComponent, PagingDockbarComponent} from 'shared/components';
import {RestService, SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {SharedService} from 'shared/shared.service';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {ApplicationInventoryCategory, ApplicationInventoryCategoryLabel} from '../application-inventory.service';
import {
  BaseApplicationModel,
  BaseApplicationStatusOfLastJobRunModel
} from 'applications/shared/base-application-model.model';
import {ApplicationService} from 'applications/shared/application.service';
import {InstancesModel} from 'applications/shared/instances.model';

class CategoryIdentity {
  constructor(public name: ApplicationInventoryCategoryLabel, public type: string) {
  }

  matching(another: CategoryIdentity): boolean {
    return another && another.name === this.name && another.type === this.type;
  }
}

@Component({
  selector: 'application-category-table',
  templateUrl: './application-category-table.component.html',
  styleUrls: ['./application-category-table.component.scss']
})
export class ApplicationCategoryTableComponent implements OnInit, OnDestroy, OnChanges, Sortable {

  @Input() category: ApplicationInventoryCategory;
  @Input() view: NvPairModel;
  @Output() assignPolicy = new EventEmitter<BaseApplicationModel>();
  @Output() editRunSettings = new EventEmitter<BaseApplicationModel>();

  @ViewChild(PagingDockbarComponent) paging: PagingDockbarComponent;

  records: Array<BaseApplicationModel>;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  filters: Array<FilterModel> = [];

  private namePattern: string = '';
  private processingRequestMsg: string;
  private textOtherPolicyTpl: string;
  private textOtherPoliciesTpl: string;
  private nameSort: SorterModel;
  private storageProfileNameSort: SorterModel;
  private sorters: Array<SorterModel>;
  private mask: boolean = false;

  constructor(private translate: TranslateService,
              private applicationService: ApplicationService) {
    let paginationId: string = `application-category-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  get applicationType(): string {
    return this.category ? this.category.applicationType : '';
  }

  get totalRecords(): number {
    return this.paginateConfig.totalItems || (this.category ? this.category.value : 0);
  }

  get unprotected(): boolean {
    return this.categoryName === 'Unprotected';
  }

  get categoryName(): ApplicationInventoryCategoryLabel {
    return this.category ? this.category.name : undefined;
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
    } else if (name === 'storageProfileName') {
      this.sorters = [this.storageProfileNameSort];
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh(true);
  }

  onPageSizeChange(page: number): void {
    let me = this;
    me.paginateConfig.pageSizeChanged(page);
    me.onRefresh();
  }

  onRefresh(preventResetPage?: boolean): void {
    this.searchResources(this.namePattern, !preventResetPage);
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.nameSort = new SorterModel('name', 'ASC');
    me.storageProfileNameSort = new SorterModel('storageProfileName', 'ASC');
    me.sorters = [me.nameSort];

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
      });

    me.searchResources('');
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['category'] && !changes['category'].isFirstChange())
      me.onRefresh();
  }

  setView(view: NvPairModel): void {
    this.view = view;
    this.namePattern = '';
  }

  searchResources(namePattern: string, resetPage?: boolean): void {
    let me = this, payload;

    me.namePattern = namePattern;

    if (me.applicationType === 'office365') {
      payload = {location: me.namePattern || ''};
    } else {
      payload = {name: me.namePattern || ''};
    }

    me.setDbGroupFilters();
    me.setTriStateFilters();

    if (resetPage)
      me.paginateConfig.reset();

    me.dbSearch(me.applicationType, 'hlo',
      payload, me.filters,
      me.view ? me.view.value === InstancesModel.DATABASE_GROUP_VIEW : false);
  }

  onAssignPolicyClick(item: BaseApplicationModel): void {
    this.assignPolicy.emit(item);
  }

  onEditRunSettingsClick(item: BaseApplicationModel): void {
    this.editRunSettings.emit(item);
  }

  otherPolicies(item: BaseApplicationModel): string {
    let tpl = item.countOfPolicyCoverage > 2 ? this.textOtherPoliciesTpl :
      (item.countOfPolicyCoverage === 2 ? this.textOtherPolicyTpl : '');
    return SharedService.formatString(tpl, item.countOfPolicyCoverage - 1);
  }

  isStatusItemHidden(si: BaseApplicationStatusOfLastJobRunModel): boolean {
    return this.categoryName === 'Failed' && si.status === 'successful' ||
      this.categoryName === 'Protected' && si.status !== 'successful' ||
      si.count === 0;
  }

  outOfTotal(item: BaseApplicationModel): number {
    let me = this, total = 0;
    item.statusOfLastJobRun.forEach(function (si) {
      total += me.isStatusItemHidden(si) ? 0 : si.count;
    });
    return total;
  }

  protected setTriStateFilters(): void {
    let me = this, index: number, cname: ApplicationInventoryCategoryLabel =
      me.categoryName, up: boolean = cname === 'Unprotected';

    // TODO: Use new tri-state(Protected, Unprotected & Failed) filter when the search API
    //  - POST "api/application/search?resourceType=${resourceType}" is ready.

    switch (cname) {
      case 'Protected':
      case 'Unprotected':
        index = me.filters.findIndex(function (item) {
          return item.property === 'unprotected';
        });
        if (index !== -1) {
          // Set the value of unprotected filter to true.
          me.filters[index].value = up;
        } else {
          // Add filter to get unprotected vms.
          me.filters.push(new FilterModel('unprotected', up));
        }
        break;
      case 'Failed':
        break;
      default:
        break;
    }
  }

  protected needGroupFilter(): boolean {
    return this.applicationType === 'sql' || this.applicationType === 'exch' || this.applicationType === 'office365';
  }

  protected setDbGroupFilters(): void {
    let me = this,
      needGf = me.needGroupFilter(),
      dbGroupFilter: FilterModel,
      isGroupView = me.view && me.view.value === InstancesModel.DATABASE_GROUP_VIEW,
      op = isGroupView ? 'EXISTS' : 'NOT EXISTS';

    if (needGf) {
      dbGroupFilter = me.filters.find((item) => {
        return item.property === 'databaseGroupPk';
      });

      if (!dbGroupFilter)
        me.filters.push(new FilterModel('databaseGroupPk', undefined,
          op));
      else
        dbGroupFilter.op = isGroupView ? 'EXISTS' : 'NOT EXISTS';
    }
  }

  protected dbSearch(applicationType: string, mode: string, payload, filters: Array<FilterModel>,
                     isDbGroup: boolean): void {
    let me = this, categoryIdentity: CategoryIdentity, resourceTypes: [string];
    me.mask = true;

    if (applicationType === 'office365') {
      resourceTypes = ['folder'];
    } else {
      resourceTypes = ['database'];
    }

    // TODO: Remove below code when tri-state filter is ready.
    // if (me.categoryName === 'Failed') {
    //   me.records = [];
    //   me.mask = false;
    //   return;
    // }

    categoryIdentity = me.createCategoryIdInstance();

    me.applicationService.dbSearch(applicationType, mode, payload, filters, me.paginateConfig.pageStartIndex(),
      RestService.pageSize, resourceTypes).subscribe(
      db => {
        me.mask = false;
        if (categoryIdentity.matching(me.createCategoryIdInstance())) {
          me.records = db.getRecords();

          me.records.forEach(item => {
            // Use the second icon for the category table.
            (item.statusOfLastJobRun || []).forEach(si => si.iconPointer = 1);
          });

          me.paginateConfig.refresh(db.total);
        }
      },
      err => {
        me.mask = false;
        me.handleError(err);
      }
    );
  }

  private ellipsisPath(item: BaseApplicationModel): string {
    let path = item.location || '';
    return SharedService.ellipsisPath(path, 33);
  }

  private createCategoryIdInstance(): CategoryIdentity {
    return new CategoryIdentity(this.categoryName, this.applicationType);
  }
}
