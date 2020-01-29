import {NgModule} from '@angular/core';
import {SqlStatChartComponent} from './stat-chart/sql-stat-chart.component';
import {ApplicationInventorySharedModule} from '../shared/application-inventory-shared.module';
import {SqlInventoryComponent} from './sql-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    SqlStatChartComponent,
    SqlInventoryComponent
  ],
  providers: [],
  exports: [
    SqlStatChartComponent,
    SqlInventoryComponent
  ],
  entryComponents: []
})
export class SqlInventoryModule {
}
