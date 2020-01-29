import {NgModule} from '@angular/core';
import {HypervisorInventorySharedModule} from '../shared/hypervisor-inventory-shared.module';
import {VmwareInventoryComponent} from './vmware-inventory.component';
import {VmwareStatChartComponent} from './stat-chart/vmware-stat-chart.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    HypervisorInventorySharedModule
  ],
  declarations: [
    VmwareStatChartComponent,
    VmwareInventoryComponent
  ],
  providers: [],
  exports: [
    VmwareStatChartComponent,
    VmwareInventoryComponent
  ],
  entryComponents: []
})
export class VmwareInventoryModule {
}
