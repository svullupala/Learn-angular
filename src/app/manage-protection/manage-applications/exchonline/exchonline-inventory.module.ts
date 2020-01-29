import {NgModule} from '@angular/core';
import {ExchonlineStatChartComponent} from './stat-chart/exchonline-stat-chart.component';
import {ApplicationInventorySharedModule} from '../shared/application-inventory-shared.module';
import {ExchonlineInventoryComponent} from './exchonline-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    ExchonlineStatChartComponent,
    ExchonlineInventoryComponent
  ],
  providers: [],
  exports: [
    ExchonlineStatChartComponent,
    ExchonlineInventoryComponent
  ],
  entryComponents: []
})
export class ExchonlineInventoryModule {
}
