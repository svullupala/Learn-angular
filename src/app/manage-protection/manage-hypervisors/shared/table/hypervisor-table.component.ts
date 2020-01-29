import {Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {AlertComponent, ErrorHandlerComponent, PagingDockbarComponent} from 'shared/components';
import {SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {SharedService} from 'shared/shared.service';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {HypervisorManageService} from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import {HypervisorBrowseService} from 'hypervisor/shared/hypervisor-browse.service';
import {HypervisorsModel} from 'hypervisor/shared/hypervisors.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {HypervisorAssignPolicyService} from '../assign-policy/hypervisor-assign-policy.service';

@Component({
  selector: 'hypervisor-table',
  templateUrl: './hypervisor-table.component.html',
  styleUrls: ['./hypervisor-table.component.scss']
})
export class HypervisorTableComponent implements OnInit, OnDestroy, Sortable {

  @Input() model: HypervisorModel;
  @Input() view: NvPairModel;
  @Output() loadEvent: EventEmitter<Array<BaseHypervisorModel>> = new EventEmitter<Array<BaseHypervisorModel>>();
  @Output() onAssignPolicy = new EventEmitter<BaseHypervisorModel>();
  @Output() onEditRunSettings = new EventEmitter<BaseHypervisorModel>();

  @ViewChild(PagingDockbarComponent) paging: PagingDockbarComponent;

  records: Array<BaseHypervisorModel>;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  filters: Array<FilterModel>;

  private namePattern: string = '';
  private searchResultView: boolean = false;
  private processingRequestMsg: string;
  private textServers: string;
  private nameSort: SorterModel;
  private storageProfileNameSort: SorterModel;
  private sorters: Array<SorterModel>;
  private mask: boolean = false;
  private searchCategory: boolean = false;
  private destroy$ = new Subject();

  constructor(private vcmService: HypervisorManageService,
              private translate: TranslateService, private vmbrowseService: HypervisorBrowseService,
              private assignPolicyService: HypervisorAssignPolicyService) {
    let paginationId: string = `hypervisor-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  get hypervisorType(): string {
    return this.model ? this.model.type : '';
  }

  get canShowPath(): boolean {
    if (this.view && this.view.value === 'vms') {
      return true;
    } else if (this.namePattern) {
      return true;
    }
    return false;
  }

  get canShowOsType(): boolean {
    return this.osTypeRequired && this.hasOsTypeRecord;
  }

  private get osTypeRequired(): boolean {
    let me = this, crumb = me.vmbrowseService.currentBreadcrumb();
    return me.view && (me.view.value === 'vms' || me.view.value === 'vmview')
      || (!me.isStorageView() && (!crumb || !crumb.resource));
  }

  private get hasOsTypeRecord(): boolean {
    return (this.records || []).findIndex(item => !!item.osType) !== -1;
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

  loadData(resetPage: boolean = true): void {
    let me = this;
    me.vmbrowseService.resetBreadcrumbs();

    if (resetPage)
      me.paginateConfig.reset();

    // The data is supposed to come from the catalog instead of live mode thus it should return a lot quicker.
    // Call vcmService.getAll by passing the 3rd parameter a 'hlo' value to get data.
    me.vcmService.getAll(me.mergeTypeFilter(me.filters, true), me.sorters, 'hlo',
      me.paginateConfig.pageStartIndex(), me.paginateConfig.pageSize())
      .subscribe(
        data => {
          // Cast the JSON object to HypervisorsModel instance.
          let dataset = JsonConvert.deserializeObject(data, HypervisorsModel);
          me.records = dataset.records;
          me.vmbrowseService.records = me.records;
          me.vmbrowseService.inVmLevel = false;
          me.paginateConfig.refresh(dataset.total);
        },
        err => me.handleError(err),
        () => {
          me.searchResultView = false;
          me.loadEvent.emit(me.records);
        }
      );
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
    let me = this, crumb = me.vmbrowseService.currentBreadcrumb();
    if (crumb) {
      if (me.searchResultView)
        me.searchVms(me.namePattern, !preventResetPage);
      else if (crumb.resource)
        me.navigate(<HypervisorModel>crumb.resource, undefined, !preventResetPage);
      else
        me.loadData(!preventResetPage);
    }
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
      'common.processingRequestMsg',
      'hyperv.textServers',
      'vmware.textVCenters'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textServers = me.isHyperV() ? resource['hyperv.textServers'] : resource['vmware.textVCenters'];

        me.loadData(true);
      });

    this.assignPolicyService.policiesAssignedSuccess$()
      .takeUntil(this.destroy$)
      .subscribe(item => {
        this.records = this.records.map(record => {
          if (record.id === item.id) {
            record.storageProfiles = item.storageProfiles;
          }
          return record;
        });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  setView(view: NvPairModel): void {
    this.view = view;
    this.namePattern = '';
  }

  setFilters(filters: Array<FilterModel>): void {
    this.filters = filters;
  }

  setSearchCategory(flag: boolean): void {
    this.searchCategory = flag;
  }

  canNavigate(item: BaseHypervisorModel): boolean {
    let me = this, view = me.view ? me.view.value : 'vmview', result = true;
    if (view === 'storageview' && item.resourceType === 'datastore') {
      result = false;
    } else if (view === 'vms' && item.resourceType === 'vm' && me.isHyperV()) {
      result = false;
    }
    return result && item.hasLink(view);
  }

  extractNamePattern(): string {
    return this.namePattern;
  }

  extractUnprotectedFlag(): boolean {
    let unprotectedFlag = false,
      flts = this.filters || [],
      target = flts.find(function (item) {
        return item.property === 'unprotected';
      });
    if (target)
      unprotectedFlag = target.value === true;
    return unprotectedFlag;
  }

  getUnprotectedFilter(): FilterModel {
    let flts = this.filters || [],
      target = flts.find(function (item) {
        return item.property === 'unprotected';
      });
    return target;
  }

  getSlaFilter(): FilterModel {
    let flts = this.filters || [],
      target = flts.find(function (item) {
        return item.property === 'storageProfileName';
      });
    return target;
  }

  getSearchFilters(): FilterModel[] {
    let me = this, filters = [],
      upFilter = me.getUnprotectedFilter(), slaFilter = me.getSlaFilter();
    if (upFilter)
      filters.push(upFilter);
    if (slaFilter)
      filters.push(slaFilter);
    return filters.length > 0 ? filters : undefined;
  }

  navigate(item: BaseHypervisorModel, event?: any, resetPage: boolean = true) {
    let me = this, view;
    if (me.canNavigate(item)) {
      me.mask = true;

      if (resetPage)
        me.paginateConfig.reset();

      view = me.vmbrowseService.navigate(item, me.view ? me.view.value : 'vmview',
        me.mergeTypeFilter(me.filters, false), me.sorters, me.paginateConfig.pageStartIndex(),
        me.paginateConfig.pageSize());
      if (view) {
        (<Observable<DatasetModel<BaseHypervisorModel>>>view).subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
          },
          err => {
            me.mask = false;
            me.handleError(err);
          },
          () => {
            me.mask = false;
            me.searchResultView = false;
          }
        );
      } else {
        me.mask = false;
      }
    }
  }

  isStorageView(): boolean {
    return this.view && this.view.value === 'storageview';
  }

  isTagView(): boolean {
    return this.view && this.view.value === 'tagview';
  }

  searchVms(namePattern: string, resetPage: boolean = true): void {
    let me = this,
      filters = me.getSearchFilters(),
      crumb = me.vmbrowseService.firstBreadcrumb();
    me.vmbrowseService.resetBreadcrumbs(crumb);

    me.mask = true;

    if (resetPage)
      me.paginateConfig.reset();

    me.namePattern = namePattern;
    me.vmbrowseService.search(namePattern, me.hypervisorType, 'hlo', me.paginateConfig.pageStartIndex(),
      filters, me.paginateConfig.pageSize(), me.isTagView() ? (
        me.searchCategory ? 'tagcategory' : 'tag') : (me.isStorageView() ? 'volume' : 'vm'),
      me.model.id, me.sorters).subscribe(
      dataset => {
        me.records = dataset.records;
        me.paginateConfig.refresh(dataset.total);
      },
      err => {
        me.mask = false;
        me.handleError(err);
      },
      () => {
        me.mask = false;
        me.searchResultView = true;
      }
    );
  }

  inSearchResultView(): boolean {
    return this.searchResultView;
  }

  onClickAssignPolicy(item: BaseHypervisorModel): void {
    this.onAssignPolicy.emit(item);
  }

  onClickEditRunSettings(item: BaseHypervisorModel): void {
    this.onEditRunSettings.emit(item);
  }

  ellipsisPath(item: BaseHypervisorModel | string): string {
    let path = typeof item === 'string' ? item : item ? (item as BaseHypervisorModel).location || '' : '';
    return SharedService.ellipsisPath(path, 33);
  }

  isHostLevel(item?: BaseHypervisorModel): boolean {
    if (!item)
      item = (this.records && this.records.length > 0) ? this.records[0] : null;
    if (item)
      return item.resourceType === 'hypervisor' && (item.type === 'vmware' || item.type === 'hyperv');
    return false;
  }

  private mergeTypeFilter(filters: Array<FilterModel>, isRoot: boolean): Array<FilterModel> {
    return (filters || []).concat(isRoot ? [
      new FilterModel('type', this.hypervisorType),
      new FilterModel('hypervisorManagementServerID', this.model.id)] : []);
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }
}
