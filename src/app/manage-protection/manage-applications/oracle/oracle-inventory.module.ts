import {NgModule} from '@angular/core';
import {OracleStatChartComponent} from './stat-chart/oracle-stat-chart.component';
import {ApplicationInventorySharedModule} from '../shared/application-inventory-shared.module';
import {OracleInventoryComponent} from './oracle-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    OracleStatChartComponent,
    OracleInventoryComponent
  ],
  providers: [],
  exports: [
    OracleStatChartComponent,
    OracleInventoryComponent
  ],
  entryComponents: []
})
export class OracleInventoryModule {
}
