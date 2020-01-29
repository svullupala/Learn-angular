import {NgModule} from '@angular/core';
import {Db2StatChartComponent} from './stat-chart/db2-stat-chart.component';
import {ApplicationInventorySharedModule} from '../shared/application-inventory-shared.module';
import {Db2InventoryComponent} from './db2-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    Db2StatChartComponent,
    Db2InventoryComponent
  ],
  providers: [],
  exports: [
    Db2StatChartComponent,
    Db2InventoryComponent
  ],
  entryComponents: []
})
export class Db2InventoryModule {
}
