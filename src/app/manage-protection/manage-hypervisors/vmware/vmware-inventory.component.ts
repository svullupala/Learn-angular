import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {HypervisorListComponent} from '../shared';
import {
  HypervisorInventoryCategory, HypervisorInventoryCategoryLabel,
  HypervisorInventoryService, HypervisorInventoryWorkflow,
  HypervisorRegistrationSubjectModel,
  HypervisorStatSubjectModel
} from '../shared/hypervisor-inventory.service';
import {Subscription} from 'rxjs';
import {NvPairModel} from 'shared/models/nvpair.model';
import {InventoryDoughnutChartData} from 'inventory/stat-chart/inventory-stat-chart';
import {VmwareStatChartComponent} from './stat-chart/vmware-stat-chart.component';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';

@Component({
  selector: 'vmware-inventory',
  templateUrl: './vmware-inventory.component.html',
  styleUrls: ['./vmware-inventory.component.scss']
})
export class VmwareInventoryComponent implements OnInit, OnDestroy {
  @Output() itemSelect = new EventEmitter<HypervisorModel>();
  @Output() itemEdit = new EventEmitter<HypervisorModel>();
  @Output() assignPolicy = new EventEmitter<BaseHypervisorModel>();
  @Output() editRunSettings = new EventEmitter<BaseHypervisorModel>();

  @ViewChild(HypervisorListComponent) list: HypervisorListComponent;
  @ViewChild(VmwareStatChartComponent) chart: VmwareStatChartComponent;

  private hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  private subscriptions: Subscription[] = [];
  private view: NvPairModel;
  private selectedCategory: HypervisorInventoryCategory;

  constructor(private inventorySvc: HypervisorInventoryService) {
  }

  get inCategoryView(): boolean {
    return !!this.selectedCategory;
  }

  ngOnInit(): void {
    let me = this;
    me.subscriptions.push(
      ...me.inventorySvc.subscribe<HypervisorRegistrationSubjectModel>('registration',
        undefined,
        value => {
          if (value.workflow === me.hypervisorType && (value.action === 'register' || value.action === 'unregister'))
            me.refreshList();
        }),
      ...me.inventorySvc.subscribe<HypervisorStatSubjectModel>('stat',
        me.hypervisorType as HypervisorInventoryWorkflow,
        value => {
          let targetView: NvPairModel;
          if (value && value.action === 'activate-view') {
            targetView = value.target as NvPairModel;
            if (!me.matchingView(targetView)) {
              me.view = targetView;
              // Close category view if views are not matching
              me.closeCategoryView();
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  refreshList(): void {
    this.list.refresh();
  }

  onItemSelect(item: HypervisorModel): void {
    this.itemSelect.emit(item);
  }

  onItemEdit(item: HypervisorModel): void {
    this.itemEdit.emit(item);
  }

  onStatCategorySelect(item: InventoryDoughnutChartData): void {
    this.selectedCategory = item ? new HypervisorInventoryCategory(
      item.label as HypervisorInventoryCategoryLabel,
      item.value,
      this.hypervisorType) : undefined;
  }

  onCategoryViewClose(): void {
    this.closeCategoryView();
  }

  onAssignPolicy(item: BaseHypervisorModel): void {
    this.assignPolicy.emit(item);
  }

  onEditRunSettings(item: BaseHypervisorModel): void {
    this.editRunSettings.emit(item);
  }

  private closeCategoryView(): void {
    this.selectedCategory = undefined;
    if (this.chart)
      this.chart.deselect();
  }

  private matchingView(view: NvPairModel): boolean {
    return this.view === view || this.view && view && this.view.value === view.value;
  }
}
