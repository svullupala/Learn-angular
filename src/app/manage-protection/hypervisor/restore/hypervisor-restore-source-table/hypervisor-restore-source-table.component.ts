import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {SessionService} from 'core';
import {VmRecoveryPointsService} from '../../shared/vmrecoverypoints.service';
import {HoverTable} from '../hoverTable/hoverTable.component';
import {HypervisorModel} from '../../shared/hypervisor.model';
import {HypervisorManageService} from '../../shared/hypervisor-manage/hypervisor-manage.service';
import {HypervisorBrowseService} from '../../shared/hypervisor-browse.service';
import {SelectorService} from 'shared/selector/selector.service';
import {selectorFactory, SelectorType} from 'shared/selector/selector.factory';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {BaseHypervisorModel} from '../../shared/base-hypervisor.model';
import {HypervisorsModel} from '../../shared/hypervisors.model';
import {SnapshotModel} from '../../shared/snapshot.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {DatasetModel} from 'shared/models/dataset.model';
import { RestService } from 'core';
import { HypervisorRestoreService } from 'hypervisor/restore/hypervisor-restore.service';
import { Subject } from 'rxjs/Subject';
import {CloudsModel} from 'cloud/clouds.model';
import {CloudService} from 'cloud/cloud.service';

@Component({
  selector: 'hypervisor-restore-source-table',
  templateUrl: './hypervisor-restore-source-table.component.html',
  styleUrls: ['./hypervisor-restoure-source-table.component.scss'],
  providers: [
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})
export class HypervisorRestoreSourceTableComponent implements OnInit, OnDestroy {
  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Input() view: NvPairModel;
  @Output('addClick') addClickEvent = new EventEmitter<{ resource: BaseHypervisorModel, snapshot: SnapshotModel }>();

  records: Array<BaseHypervisorModel>;
  paginateConfig: PaginateConfigModel;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  filters: Array<FilterModel>;

  private namePattern: string = '';
  private searchResultView: boolean = false;
  private processingRequestMsg: string;
  private textServers: string;
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private masked: boolean = false;

  constructor(private recoveryPointsService: VmRecoveryPointsService,
              private vcmService: HypervisorManageService,
              private cloudService: CloudService,
              private hypervisorRestoreService: HypervisorRestoreService,
              private translate: TranslateService, private vmbrowseService: HypervisorBrowseService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `hypervisor-restore-source-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
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

  loadData(resetPage: boolean = true): void {
    let me = this, crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.vmbrowseService.resetBreadcrumbs(crumb);

    if (resetPage)
      me.paginateConfig.reset();
    if (!this.isAwsec2()) {
      // The data is supposed to come from the catalog instead of live mode thus it should return a lot quicker.
      // Call vcmService.getAll by passing the 3rd parameter a 'hlo' value to get data.
      me.vcmService.getAll(me.mergeTypeFilter(me.filters, true), me.sorters, 'recovery',
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
            // clearSelections ? me.emptySelection() : me.retrieveSelection();
            me.searchResultView = false;
          }
        );
    } else {
      this.cloudService.getAll(me.getCloudFilters(), me.sorters, 'recovery',
        me.paginateConfig.pageStartIndex()).
      subscribe(
        (data: CloudsModel) => {
          let dataset = JsonConvert.deserializeObject(data, CloudsModel);
          me.records = dataset.records;
          me.vmbrowseService.records = me.records;
          me.vmbrowseService.inVmLevel = false;
          me.paginateConfig.refresh(dataset.total);
        },
        (err) => {
          // clearSelections ? me.emptySelection() : me.retrieveSelection();
          me.searchResultView = false;
          this.handleError(err);
        }
      );
    }
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    let me = this, crumb = me.vmbrowseService.currentBreadcrumb();
    if (crumb) {
      if (crumb.resource)
        me.navigate(<HypervisorModel>crumb.resource, undefined, false);
      else if (me.searchResultView)
        me.searchVms(me.namePattern, false);
      else
        me.loadData(false);
    }
  }

  initMetadata(resource: BaseHypervisorModel): void {
    let me = this,
      snapshots;
    if (me.selector.isSelected(resource)) {

      let selection = me.selector.selection() as Array<BaseHypervisorModel>,
        targetResource = selection.find(function (item) {
          return item.getId() === resource.getId();
        }), targetSnapshot;

      if (targetResource) {
        targetSnapshot = targetResource.snapshots.find(function (item) {
          return item.metadata['selected'] === true;
        });
      }
      snapshots = resource.snapshots as Array<BaseModel> || [];
      snapshots.forEach(function (snapshot) {
        let selected = targetSnapshot && targetSnapshot.getId() === snapshot.getId();
        snapshot.metadata['selected'] = selected;
        if (selected) {
          resource.metadata['snapshot'] = snapshot;
        }
      });
    }
    resource.metadata['snapshotLoaded'] = true;
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'hyperv.textServers',
      'awsec2.textAccounts',
      'vmware.textVCenters'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textServers = me.isHyperV() ? resource['hyperv.textServers'] : me.isAwsec2() ?  resource['awsec2.textAccounts'] : resource['vmware.textVCenters'];

        me.loadData();
      });
  }

  setView(view: NvPairModel): void {
    this.view = view;
    this.namePattern = '';
  }

  canNavigate(item: BaseHypervisorModel): boolean {
    let me = this, view = me.setNavView(item);
    return item.hasLink(view);
  }

  extractNamePattern(): string {
    return this.namePattern;
  }

  navigate(item: BaseHypervisorModel, event?: any, resetPage: boolean = true) {
    let me = this,
        linkView = me.setNavView(item),
        view;

    if (me.canNavigate(item)) {
      me.mask();
      if (resetPage)
        me.paginateConfig.reset();
      view = me.vmbrowseService.navigate(item, linkView,
        me.mergeTypeFilter(me.filters, false), me.sorters, me.paginateConfig.pageStartIndex());
      if (view) {
        (<Observable<DatasetModel<BaseHypervisorModel>>>view).takeUntil(me.subs)
          .subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
          },
          err => {
            me.unmask();
            me.handleError(err);
          },
          () => {
            me.unmask();
            me.searchResultView = false;
          }
        );
      } else {
        me.unmask();
      }
    }
  }

  onAddClick(resource: BaseHypervisorModel): void {
    let me = this;
    me.addClickEvent.emit({
      resource: resource,
      snapshot: resource.metadata['snapshot']
    });
  }

  onSelectChange(resource: BaseHypervisorModel, snapshot: SnapshotModel): void {
    let me = this;
    resource.snapshots.forEach(function (item) {
      item.metadata['selected'] = false;
    });
    snapshot.metadata['selected'] = true;
    // Reselect the resource to update the associated snapshot.
    resource.metadata['snapshot'] = snapshot;
    me.selector.deselect(resource);
    me.selector.select(resource);
    me.onAddClick(resource);
  }

  searchVms(namePattern: string, resetPage: boolean = true): void {
    let me = this,
      resourceType: string = (me.view && me.view.value)  === 'storageview' ? 'volume' : 'vm',
      crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.vmbrowseService.resetBreadcrumbs(crumb);

    me.mask();

    if (resetPage)
      me.paginateConfig.reset();

    me.namePattern = namePattern;
    me.vmbrowseService.search(namePattern, me.hypervisorType, 'recovery',
      me.paginateConfig.pageStartIndex(), undefined, RestService.pageSize, resourceType)
      .takeUntil(me.subs).subscribe(
      dataset => {
        me.records = dataset.records;
        me.paginateConfig.refresh(dataset.total);
      },
      err => {
        me.unmask();
        me.handleError(err);
      },
      () => {
        me.unmask();
        me.searchResultView = true;
      }
    );
  }

  hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  emptySelection(): void {
    this.selector.deselectAll();
  }

  getValue(): Array<BaseHypervisorModel> {
    return <Array<BaseHypervisorModel>>this.selector.selection();
  }

  private onUseLatestClick(item: BaseHypervisorModel): void {
    if (item && item.metadata && item.metadata['snapshot']) {
      item.metadata['snapshot'] = undefined;
      this.selector.deselect(item);
      this.selector.select(item);
    }
    this.onAddClick(item);
  }

  private setNavView(item: BaseHypervisorModel) {
    let view: string = this.view ? this.view.value : 'vmview';
    if (item && item.resourceType === 'vm' && item.hasLink('vdisks')) {
      view = 'vdisks';
    }
    return view;
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

  private getCloudFilters() {
    let filters = [];
    filters.push(new FilterModel('provider', 'sp', 'NOT IN'));
    if (!this.isAwsec2()) {
      filters.push(new FilterModel('type', 'compute', 'NOT IN'));
    } else {
      filters.push(new FilterModel('type', 'compute', '='));
    }
    return filters;
  }

  private onDisableSelectionIfSpp(resource: BaseHypervisorModel, snapshot: SnapshotModel): boolean {
    if (!this.isHyperV() && snapshot && snapshot.isSpp() && resource.resourceType === 'vdisk') {
      return false;
    }
    return true;
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private isAwsec2(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_AWSEC2;
  }

  private folderIcon(item: BaseHypervisorModel): boolean {
    return item.resourceType === 'hypervisor' || item.resourceType === 'folder' ||
      (!item.type && item.resourceType !== 'vm' && item.resourceType !== 'volume');
  }

  private isVm(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'virtualmachine' || item.resourceType === 'vm';
  }

  private isTagsAndCategories(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'tagcategory' || item.resourceType === 'tagcategory';
  }

  private isTag(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'tag' || item.resourceType === 'tag';
  }

  private isDatastore(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'datastore' || item.resourceType === 'datastore';
  }

  private isVolume(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'volume' || item.resourceType === 'volume';
  }

  private isDatacenter(item: BaseHypervisorModel): boolean {
    return(item.type || '').toLowerCase() === 'datacenter';
  }

  private isVDisk(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'vdisk' || item.resourceType === 'vdisk';
  }

  private isTemplate(item: BaseHypervisorModel): boolean {
    return(item.type || '').toLowerCase() === 'vmgroup';
  }

  private isCompute(item: BaseHypervisorModel): boolean {
    return (item.type || '').toLowerCase() === 'compute' || item.resourceType === 'compute';
  }

  private canAddItem(item: BaseHypervisorModel): boolean {
    if (item.resourceType === 'hypervisor'
        || item.resourceType === 'datacenter'
        || item.type === 'compute'
        || item.resourceType === 'cluster'
        || item.resourceType === 'host'
        || item.resourceType === 'tagcategory'
        || item.resourceType === 'tag'
        || item.resourceType === 'folder') {
      return false;
    }
    return true;
  }
}
