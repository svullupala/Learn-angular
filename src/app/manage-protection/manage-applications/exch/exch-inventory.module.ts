import {NgModule} from '@angular/core';
import {ExchStatChartComponent} from './stat-chart/exch-stat-chart.component';
import {ApplicationInventorySharedModule} from '../shared/application-inventory-shared.module';
import {ExchInventoryComponent} from './exch-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    ExchStatChartComponent,
    ExchInventoryComponent
  ],
  providers: [],
  exports: [
    ExchStatChartComponent,
    ExchInventoryComponent
  ],
  entryComponents: []
})
export class ExchInventoryModule {
}
