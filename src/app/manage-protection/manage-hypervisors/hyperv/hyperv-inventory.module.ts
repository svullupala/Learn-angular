import {NgModule} from '@angular/core';
import {HypervStatChartComponent} from './stat-chart/hyperv-stat-chart.component';
import {HypervisorInventorySharedModule} from '../shared/hypervisor-inventory-shared.module';
import {HypervInventoryComponent} from './hyperv-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    HypervisorInventorySharedModule
  ],
  declarations: [
    HypervStatChartComponent,
    HypervInventoryComponent
  ],
  providers: [],
  exports: [
    HypervStatChartComponent,
    HypervInventoryComponent
  ],
  entryComponents: []
})
export class HypervInventoryModule {
}
