import {
  Component, Input, Output, EventEmitter, OnInit, ViewChildren, QueryList, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {RestService} from 'core';
import {SessionService} from 'core';
import {BaseModel} from 'shared/models/base.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {SelectorService} from 'shared/selector/selector.service';
import {selectorFactory, SelectorType} from 'shared/selector/selector.factory';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {HypervisorBrowseService} from 'hypervisor/shared/hypervisor-browse.service';
import {HypervisorManageService}
  from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {HypervisorsModel} from 'hypervisor/shared/hypervisors.model';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {DatasetModel} from 'shared/models/dataset.model';

@Component({
  selector: 'vm-search-select',
  styleUrls: ['./vm-search-select.component.scss'],
  templateUrl: './vm-search-select.component.html',
  providers: [
    HypervisorManageService,
    HypervisorBrowseService,
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})
export class VmSearchSelectComponent implements OnInit, OnChanges {

  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Input() selectMode: number = 1; // 1: single. 0: multiple.
  @Input() vmLabel: string; // The VM label, defaults to text resource - 'fileRestore.textVirtualMachine'.
  @Input() selectedVMsLabel: string; // The selected VMs label, defaults to text resource - 'fileRestore.selectedVMs'.
  @Input() from: string = 'hlo'; // Where retrieve VMs from, can be 'hlo' or 'recovery'.
  @Input() hideCounter: boolean = false; // True to hide the counter.
  @Input() hideLabelArea: boolean = false; // True to hide the label area.
  @Input() hideSelectedArea: boolean = false; // True to hide the selected VMs area.
  @Input() alwaysShowSelectedArea: boolean = false; // True to always show the selected VMs area,
                                                    // it is available if and only if hideSelectedArea is false.
  @Input() browse: boolean = false; // True to support browse mode.
  @Input() showPath: boolean = true; // False to prevent from showing path.

  @Output() vmSelect = new EventEmitter<BaseHypervisorModel>(); // Event emitter for selecting VM.
  @Output() vmDeselect = new EventEmitter<BaseHypervisorModel>(); // Event emitter for deselecting VM.

  breadcrumbs: Array<any>;
  filters: Array<FilterModel>;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  namePattern: string;
  paginateConfig: PaginateConfigModel;
  records: BaseHypervisorModel[];
  @ViewChildren('radioButton') radioButtons: QueryList<ElementRef>;
  private searchResultPageSize = 10;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textServers: string;
  private textConfirm: string;
  private textSearchForVMs: string;
  private textHyperV: string;
  private textVMware: string;
  private textHypervisor: string;
  private searchResultView: boolean = false;
  private showResult: boolean = false;
  private sorters: Array<SorterModel>;
  private popup: boolean = true;
  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService, private vcmService: HypervisorManageService,
              private vmbrowseService: HypervisorBrowseService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `vm-search-select-pagination-${(new Date()).valueOf()}`;
    this.breadcrumbs = this.vmbrowseService.breadcrumbs;
    this.paginateConfig = new PaginateConfigModel({id: paginationId, pageSize: this.searchResultPageSize});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
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
    me.onRefresh();
  }

  onRefresh(): void {
    let me = this, crumb = me.vmbrowseService.currentBreadcrumb();
    if (me.browse) {
      if (crumb) {
        if (crumb.resource)
          me.navigate(<HypervisorModel>crumb.resource, undefined, false);
        else if (me.searchResultView)
          me.searchVms(me.namePattern, false);
        else
          me.loadData(false);
      }
    } else {
      me.searchVms(me.namePattern, false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['hypervisorType']) {
      me.emptySelection();
      me.textServers = me.isHyperV() ? me.textHyperV : (
        me.isVMware() ? me.textVMware : me.textHypervisor );
      me.loadData(true);
    }
  }

  ngOnInit() {
    let me = this;

    me.popup = !me.browse; // Support popup only when browse mode is off, maybe change later.
    me.searchResultPageSize = me.browse ? RestService.pageSize : 10;
    me.paginateConfig.itemsPerPage = me.searchResultPageSize;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'fileRestore.textSearchForVMs',
      'fileRestore.textVCenters',
      'fileRestore.textServers',
      'fileRestore.textHypervisor'
    ]).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.processingRequestMsg = resource['common.processingRequestMsg'];
      me.textConfirm = resource['common.textConfirm'];
      me.textSearchForVMs = resource['fileRestore.textSearchForVMs'];
      me.textHyperV = resource['fileRestore.textServers'];
      me.textVMware = resource['fileRestore.textVCenters'];
      me.textHypervisor = resource['fileRestore.textHypervisor'];
      me.textServers = me.isHyperV() ? me.textHyperV : (
        me.isVMware() ? me.textVMware : me.textHypervisor );
      if (me.browse)
        me.loadData();
    });
  }

  loadData(resetPage: boolean = true): void {
    let me = this, crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.vmbrowseService.resetBreadcrumbs(crumb);

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
          me.paginateConfig.refresh(dataset.total);
        },
        err => me.handleError(err),
        () => {
          // me.emptySelection(false, true);
          me.showResult = true;
          me.initMetadata();
          me.searchResultView = false;
        }
      );
  }

  initMetadata(): void {
    let me = this;
    (me.records || []).forEach(function (item) {
      item.metadata['selected'] = me.selector.isSelected(item);
    });
  }

  getSelection(): BaseHypervisorModel[] {
    return <Array<BaseHypervisorModel>>this.selector.selection();
  }

  searchVms(namePattern: string, resetPage: boolean = true): void {
    let me = this,
      crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.vmbrowseService.resetBreadcrumbs(crumb);

    me.mask();

    if (resetPage)
      me.paginateConfig.reset();

    me.namePattern = namePattern;
    me.vmbrowseService.search(namePattern, undefined, me.from, me.paginateConfig.pageStartIndex(),
      undefined, me.searchResultPageSize).subscribe(
      dataset => {
        me.records = dataset.records;
        me.paginateConfig.refresh(dataset.total);
        // me.emptySelection(false, true);

        me.showResult = true;
      },
      err => {
        me.unmask();
        me.handleError(err);
      },
      () => {
        me.unmask();
        me.initMetadata();
        me.searchResultView = true;
      }
    );
  }

  navigate(item: BaseHypervisorModel, event?: any, resetPage: boolean = true) {
    let me = this, view;
    if (me.canNavigate(item)) {
      me.mask();

      if (resetPage)
        me.paginateConfig.reset();

      view = me.vmbrowseService.navigate(item, 'vms',
        me.mergeTypeFilter(me.filters, false), me.sorters, me.paginateConfig.pageStartIndex());
      if (view) {
        (<Observable<DatasetModel<BaseHypervisorModel>>>view).subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
            // me.emptySelection(false, true);
            me.showResult = true;
          },
          err => {
            me.unmask();
            me.handleError(err);
          },
          () => {
            me.unmask();
            me.initMetadata();
            me.searchResultView = false;
          }
        );
      } else {
        me.unmask();
      }
    }
  }

  hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  emptySelection(preventUncheckRadio?: boolean, suppressEvent?: boolean): void {
    let me = this;
    me.selector.deselectAll();
    me.initMetadata();
    if (me.selectMode === 1 && !preventUncheckRadio) {
      me.uncheckRadio();
    }
    if (!suppressEvent) {
      // No parameter is needed for deselecting all.
      me.vmDeselect.emit();
    }
  }

  deselect(item: BaseHypervisorModel, suppressEvent?: boolean): void {
    let me = this;
    (me.records || []).forEach(function (rec) {
      if (rec.equals(item))
        rec.metadata['selected'] = false;
    });
    me.selector.deselect(item);
    if (me.selectMode === 1) {
      me.uncheckRadio();
    }
    if (!suppressEvent) {
      // A parameter is needed for deselecting one vm.
      me.vmDeselect.emit(item);
    }
  }

  onSelectChange(item: BaseHypervisorModel, suppressEvent?: boolean): void {
    let me = this;
    if (item.metadata['selected'] === true) {
      me.selector.select(item);
      if (!suppressEvent)
        me.vmSelect.emit(item);
    } else {
      me.selector.deselect(item);
      if (!suppressEvent)
        me.vmDeselect.emit(item);
    }
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private isVMware(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_VMWARE;
  }

  private onRadioClick(event: any, vm: BaseHypervisorModel): void {
    let me = this, target = event.target;
    if (target) {
      if (vm.metadata['selected']) {
        target.checked = false;
        vm.metadata['selected'] = false;
        me.onSelectChange(vm);
      } else {
        me.emptySelection(true, true);

        target.checked = true;
        vm.metadata['selected'] = true;
        me.onSelectChange(vm);
        me.records.forEach(function (item) {
          if (item.id !== vm.id) {
            item.metadata['selected'] = false;
            me.onSelectChange(item, true);
          }
        });
      }
    }
  }

  private mergeTypeFilter(filters: Array<FilterModel>, isRoot: boolean): Array<FilterModel> {
    let me = this, hasType = me.hypervisorType && me.hypervisorType.length > 0;
    return (filters || []).concat(isRoot && hasType ? [new FilterModel('type', me.hypervisorType)] : []);
  }

  private uncheckRadio(): void {
    let me = this, radioButtons = me.radioButtons;
    if (me.radioButtons) {
      me.radioButtons.forEach(function (elementRef) {
        if (elementRef && elementRef.nativeElement)
          elementRef.nativeElement.checked = false;
      });
    }
  }

  private canNavigate(item: BaseHypervisorModel): boolean {
    let me = this, result = true;
    if (item.resourceType === 'vm')
      result = false;
    return result && item.hasLink('vms');
  }

  private startSearch(force?: boolean, namePattern?: string): void {
    let me = this, crumb;
    me.namePattern = namePattern;

    let removeAllFilters = !(me.namePattern && me.namePattern.length > 0);

    if (me.browse) {
      if (!force && removeAllFilters) {
        crumb = me.vmbrowseService.currentBreadcrumb();
        if (crumb)
          me.onBreadcrumbClick(crumb);
      }
      else {
        me.emptySelection(false, true);
        me.searchVms(me.namePattern);
      }
    } else {
      me.searchVms(me.namePattern);
    }
  }

  private onBreadcrumbClick(item: any, event?: any) {
    let me = this;
    if (item.resource)
      me.navigate(item.resource, event);
    else
      me.loadData();
  }

  private hideResult(): void {
    this.showResult = false;
  }

  private onClickResultOutside(): void {
    if (this.popup)
      this.hideResult();
  }

  private folderIcon(item: BaseHypervisorModel): boolean {
    return item.resourceType === 'hypervisor' || item.resourceType === 'folder' ||
      (item.type || '').toLowerCase() === 'datacenter' ||
      (!item.type && item.resourceType !== 'vm' && item.resourceType !== 'volume');
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

  private canShowPath(): boolean {
    return this.showPath && this.searchResultView;
  }
}


