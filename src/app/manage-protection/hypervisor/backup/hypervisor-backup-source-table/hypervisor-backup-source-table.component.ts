import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {HypervisorManageService} from '../../shared/hypervisor-manage/hypervisor-manage.service';
import {ErrorHandlerComponent} from 'shared/components';
import {HypervisorsModel} from '../../shared/hypervisors.model';
import {HypervisorBrowseService} from '../../shared/hypervisor-browse.service';
import {SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {BaseModel} from 'shared/models/base.model';
import {SelectorService} from 'shared/selector/selector.service';
import {selectorFactory, SelectorType} from 'shared/selector/selector.factory';
import {BaseHypervisorModel} from '../../shared/base-hypervisor.model';
import {SorterModel} from 'shared/models/sorter.model';
import {HypervisorModel} from '../../shared/hypervisor.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'hypervisor-backup-source-table',
  templateUrl: './hypervisor-backup-source-table.component.html',
  providers: [
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})
export class HypervisorBackupSourceTableComponent implements OnInit {

  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Input() view: NvPairModel;
  @Output() sourceAdded: EventEmitter<BaseHypervisorModel> = new EventEmitter<BaseHypervisorModel>();
  @Output() onSelectChangeEvent: EventEmitter<Array<BaseHypervisorModel>>
    = new EventEmitter<Array<BaseHypervisorModel>>();

  records: Array<BaseHypervisorModel>;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  filters: Array<FilterModel> = new Array<FilterModel>();
  selectedAll: any;

  private namePattern: string = '';
  private disableSelectAll: boolean = false;
  private searchResultView: boolean = false;
  private sorters: Array<SorterModel>;
  private mask: boolean = false;
  private searchCategory: boolean = false;

  constructor(private vcmService: HypervisorManageService,
              private vmbrowseService: HypervisorBrowseService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `vmselectbackup-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  selectAll() {
    for (var i = 0; i < this.records.length; i++) {
      this.records[i].metadata['selected'] = this.selectedAll;
      this.onSelectChange(this.records[i]);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  loadData(resetPage: boolean = true, clearSelections: boolean = true): void {
    let me = this;

    if (resetPage)
      me.paginateConfig.reset();

    // The data is supposed to come from the catalog instead of live mode thus it should return a lot quicker.
    // Call vcmService.getAll by passing the 3rd parameter a 'hlo' value to get data.
    me.vcmService.getAll(me.mergeTypeFilter(me.filters, true), me.sorters, 'hlo',
      me.paginateConfig.pageStartIndex())
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
          clearSelections ? me.emptySelection() : me.retrieveSelection();
          me.searchResultView = false;
        }
      );
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    let me = this;
    if (me.searchResultView)
      me.searchVms(me.namePattern);
    else
      me.searchVms('');
  }

  ngOnInit() {
    let me = this;

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
  }

  initMetadata(retrieveSelection?: boolean): void {
    let me = this,
      records = me.records as Array<BaseModel> || [];
    records.forEach(function (item) {
      item.metadata['selected'] = retrieveSelection ? me.selector.isSelected(item) : false;
      item.metadata['disabled'] = false;
    });
  }

  setView(view: NvPairModel): void {
    this.view = view;
    this.namePattern = '';
  }

  setFilters(filters: Array<FilterModel>): void {
    this.filters = filters;
  }

  hasOsType(): boolean {
    let me = this;
    if (me.isAwsec2()) {
      return false;
    }
    return me.view && (me.view.value === 'vms' || me.view.value === 'vmview')
      || (!me.isStorageView());
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

  onAddClick(source: BaseHypervisorModel) {
    this.sourceAdded.emit(source);
  }

  getUnprotectedFilter(): FilterModel {
    let flts = this.filters || [];
    return flts.find(function (item) {
      return item.property === 'unprotected';
    });
  }

  getSlaFilter(): FilterModel {
    let flts = this.filters || [];
    return flts.find(function (item) {
      return item.property === 'storageProfileName';
    });
  }

  getSearchFilters(): FilterModel[] {
    let me = this, filters = [], upFilter = me.getUnprotectedFilter(), slaFilter = me.getSlaFilter();
    if ( upFilter)
      filters.push(upFilter);
    if (slaFilter)
      filters.push(slaFilter);
    return filters.length > 0 ? filters : undefined;
  }

  navigate(item: BaseHypervisorModel, event?: any, resetPage: boolean = true, clearSelections: boolean = true) {
    let me = this, view;
    if (me.canNavigate(item)) {
      me.mask = true;

      if (resetPage)
        me.paginateConfig.reset();

      view = me.vmbrowseService.navigate(item, me.view ? me.view.value : 'vmview',
        me.mergeTypeFilter(me.filters, false), me.sorters, me.paginateConfig.pageStartIndex());
      if (view) {
        (<Observable<DatasetModel<BaseHypervisorModel>>>view).subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
            for (let i = 0; i < me.records.length; i++) {
              if (me.selector.isSelected(me.records[i])) {
                me.selector.deselect(me.records[i]);
                me.records[i].metadata['selected'] = true;
                me.onSelectChange(me.records[i]);
              }
            }
            clearSelections ? me.emptySelection() : me.retrieveSelection();
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

  onSelectChange(item: BaseHypervisorModel): void {
    let me = this;
    if (item.metadata['selected'] === true) {
      me.selector.select(item);

      if (me.allSelected()) {
        me.selectedAll = !me.disableSelectAll;
      }
    } else {
      me.selector.deselect(item);
      me.selectedAll = false;
    }
    me.onSelectChangeEvent.emit(me.getValue());
  }

  isStorageView(): boolean {
    return this.view && this.view.value === 'storageview';
  }

  isTagView(): boolean {
    return this.view && this.view.value === 'tagview';
  }

  searchVms(namePattern: string, searchType?: string): void {
    let me = this, filters = me.getSearchFilters();

    me.mask = true;
    me.paginateConfig.reset();
    me.namePattern = namePattern;
    me.vmbrowseService.search(namePattern, searchType || me.hypervisorType, 'hlo', me.paginateConfig.pageStartIndex(),
      filters, undefined, me.isTagView() ? (
        me.searchCategory ? 'tagcategory' : 'tag') : (me.isStorageView() ? 'volume' : 'vm')).subscribe(
      dataset => {
        me.records = dataset.records;
        me.paginateConfig.refresh(dataset.total);
        me.retrieveSelection();
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

  hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  emptySelection(): void {
    this.selector.deselectAll();
    this.initMetadata();
    this.selectedAll = false;
    this.onSelectChangeEvent.emit(this.getValue());
  }

  retrieveSelection(): void {
    this.initMetadata(true);
    this.selectedAll = this.allSelected();
  }

  allSelected(): boolean {
    let me = this, idx,
      records = me.records as Array<BaseModel> || [];
    idx = records.findIndex(function (item) {
      return !me.selector.isSelected(item);
    });
    return idx === -1;
  }

  getValue(): Array<BaseHypervisorModel> {
    return <Array<BaseHypervisorModel>>this.selector.selection();
  }

  private onShowPath(): boolean {
    if (this.view && this.view.value === 'vms') {
      return true;
    } else if (this.namePattern) {
      return true;
    }
    return false;
  }

  private mergeTypeFilter(filters: Array<FilterModel>, isRoot: boolean): Array<FilterModel> {
    return (filters || []).concat(isRoot ? [new FilterModel('type', this.hypervisorType)] : []);
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private folderIcon(item: BaseHypervisorModel): boolean {
    return item.resourceType === 'hypervisor' || item.resourceType === 'folder' ||
      (!item.type && item.resourceType !== 'vm' && item.resourceType !== 'volume');
  }

  private isDatacenter(item: BaseHypervisorModel): boolean {
    return(item.type || '').toLowerCase() === 'datacenter';
  }

  private isTemplate(item: BaseHypervisorModel): boolean {
    return(item.type || '').toLowerCase() === 'vmgroup';
  }

  private isVm(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'virtualmachine' || item.resourceType === 'vm';
  }

  private isDatastore(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'datastore' || item.resourceType === 'datastore';
  }

  private isVolume(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'volume' || item.resourceType === 'volume';
  }

  private isVDisk(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'vdisk' || item.resourceType === 'vdisk';
  }

  private isTagCategory(item: BaseHypervisorModel): boolean {
    return item.resourceType === 'tagcategory';
  }

  private isTag(item: BaseHypervisorModel): boolean {
    return item.resourceType === 'tag';
  }

  private isTopLevel(item: any): boolean {
    return item && !item.resource;
  }

  private ellipsisPath(item: BaseHypervisorModel): string {
    let path = item.location || '';
    return SharedService.ellipsisPath(path, 33);
  }

  private isHostLevel(item?: BaseHypervisorModel): boolean {
    if (!item)
      item = (this.records && this.records.length > 0) ? this.records[0] : null;
    if (item)
      return item.resourceType === 'hypervisor' && (item.type === 'vmware' || item.type === 'hyperv');
    return false;
  }

  private isAwsec2(): boolean {
    return this.hypervisorType === 'awsec2';
  }
}
