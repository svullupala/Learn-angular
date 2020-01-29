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
import {SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {SharedService} from 'shared/shared.service';
import {BaseHypervisorModel, BaseHypervisorStatusOfLastJobRunModel} from 'hypervisor/shared/base-hypervisor.model';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {HypervisorBrowseService} from 'hypervisor/shared/hypervisor-browse.service';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {HypervisorAssignPolicyService} from '../assign-policy/hypervisor-assign-policy.service';
import {Subject} from 'rxjs';
import {HypervisorInventoryCategory, HypervisorInventoryCategoryLabel} from '../hypervisor-inventory.service';


class CategoryIdentity {
  constructor(public name: HypervisorInventoryCategoryLabel, public type: string) {
  }

  matching(another: CategoryIdentity): boolean {
    return another && another.name === this.name && another.type === this.type;
  }
}

@Component({
  selector: 'hypervisor-category-table',
  templateUrl: './hypervisor-category-table.component.html',
  styleUrls: ['./hypervisor-category-table.component.scss']
})
export class HypervisorCategoryTableComponent implements OnInit, OnDestroy, OnChanges, Sortable {

  @Input() category: HypervisorInventoryCategory;
  @Input() view: NvPairModel;
  @Output() assignPolicy = new EventEmitter<BaseHypervisorModel>();
  @Output() editRunSettings = new EventEmitter<BaseHypervisorModel>();

  @ViewChild(PagingDockbarComponent) paging: PagingDockbarComponent;

  records: Array<BaseHypervisorModel>;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  filters: Array<FilterModel> = [];

  private namePattern: string = '';
  private processingRequestMsg: string;
  private textOtherPolicyTpl: string;
  private textOtherPoliciesTpl: string;
  private textServers: string;
  private nameSort: SorterModel;
  private storageProfileNameSort: SorterModel;
  private sorters: Array<SorterModel>;
  private mask: boolean = false;
  private searchCategory: boolean = false;
  private destroy$ = new Subject();

  constructor(private translate: TranslateService,
              private vmbrowseService: HypervisorBrowseService,
              private assignPolicyService: HypervisorAssignPolicyService) {
    let paginationId: string = `hypervisor-category-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  get hypervisorType(): string {
    return this.category ? this.category.hypervisorType : '';
  }

  get totalRecords(): number {
    return this.paginateConfig.totalItems || (this.category ? this.category.value : 0);
  }

  get unprotected(): boolean {
    return this.categoryName === 'Unprotected';
  }

  get categoryName(): HypervisorInventoryCategoryLabel {
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
      'common.processingRequestMsg',
      'inventory.textOtherPolicyTpl',
      'inventory.textOtherPoliciesTpl',
      'hyperv.textServers',
      'vmware.textVCenters'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textOtherPolicyTpl = resource['inventory.textOtherPolicyTpl'];
        me.textOtherPoliciesTpl = resource['inventory.textOtherPoliciesTpl'];
        me.textServers = me.isHyperV() ? resource['hyperv.textServers'] : resource['vmware.textVCenters'];
      });

    me.assignPolicyService.policiesAssignedSuccess$()
      .takeUntil(me.destroy$)
      .subscribe(item => {
        me.records = me.records.map(record => {
          if (record.id === item.id) {
            record.storageProfiles = item.storageProfiles;
          }
          return record;
        });
      });

    me.searchResources('');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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

  setSearchCategory(flag: boolean): void {
    this.searchCategory = flag;
  }

  isStorageView(): boolean {
    return this.view && this.view.value === 'storageview';
  }

  isTagView(): boolean {
    return this.view && this.view.value === 'tagview';
  }

  searchResources(namePattern: string, resetPage: boolean = true): void {
    let me = this, categoryIdentity: CategoryIdentity;
    me.mask = true;
    me.setFilters();

    if (resetPage)
      me.paginateConfig.reset();


    me.namePattern = namePattern;

    // TODO: Remove below code when tri-state filter is ready.
    // if (me.categoryName === 'Failed') {
    //   me.records = [];
    //   me.mask = false;
    //   return;
    // }

    categoryIdentity = me.createCategoryIdInstance();

    me.vmbrowseService.search(namePattern, me.hypervisorType, 'hlo', me.paginateConfig.pageStartIndex(),
      me.filters, me.paginateConfig.pageSize(), me.isTagView() ? (
        me.searchCategory ? 'tagcategory' : 'tag') : (me.isStorageView() ? 'volume' : 'vm'),
      undefined, me.sorters).subscribe(
      dataset => {
        if (categoryIdentity.matching(me.createCategoryIdInstance())) {
          me.records = dataset.records;

          me.records.forEach(item => {
            // Use the second icon for the category table.
            (item.statusOfLastJobRun || []).forEach(si => si.iconPointer = 1);
          });

          me.paginateConfig.refresh(dataset.total);
        }
      },
      err => {
        me.mask = false;
        me.handleError(err);
      },
      () => {
        me.mask = false;
      }
    );
  }

  onAssignPolicyClick(item: BaseHypervisorModel): void {
    this.assignPolicy.emit(item);
  }

  onEditRunSettingsClick(item: BaseHypervisorModel): void {
    this.editRunSettings.emit(item);
  }

  otherPolicies(item: BaseHypervisorModel): string {
    let tpl = item.countOfPolicyCoverage > 2 ? this.textOtherPoliciesTpl :
      (item.countOfPolicyCoverage === 2 ? this.textOtherPolicyTpl : '');
    return SharedService.formatString(tpl, item.countOfPolicyCoverage - 1);
  }

  isStatusItemHidden(si: BaseHypervisorStatusOfLastJobRunModel): boolean {
    return this.categoryName === 'Failed' && si.status === 'successful' ||
      this.categoryName === 'Protected' && si.status !== 'successful' ||
      si.count === 0;
  }

  outOfTotal(item: BaseHypervisorModel): number {
    let me = this, total = 0;
    item.statusOfLastJobRun.forEach(function (si) {
      total += me.isStatusItemHidden(si) ? 0 : si.count;
    });
    return total;
  }

  isHostLevel(item?: BaseHypervisorModel): boolean {
    if (!item)
      item = (this.records && this.records.length > 0) ? this.records[0] : null;
    if (item)
      return item.resourceType === 'hypervisor' && (item.type === 'vmware' || item.type === 'hyperv');
    return false;
  }

  protected setFilters(): void {
    let me = this, index: number, cname: HypervisorInventoryCategoryLabel =
      me.categoryName, up: boolean = cname === 'Unprotected';

    // TODO: Use new tri-state(Protected, Unprotected & Failed) filter when the search API
    //  - POST "api/hypervisor/search?resourceType=${resourceType}" is ready.

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

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private ellipsisPath(item: BaseHypervisorModel): string {
    let path = item.location || '';
    return SharedService.ellipsisPath(path, 33);
  }

  private createCategoryIdInstance(): CategoryIdentity {
    return new CategoryIdentity(this.categoryName, this.hypervisorType);
  }
}
