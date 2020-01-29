import {NgModule} from '@angular/core';
import {MongoStatChartComponent} from './stat-chart/mongo-stat-chart.component';
import {ApplicationInventorySharedModule} from '../shared/application-inventory-shared.module';
import {MongoInventoryComponent} from './mongo-inventory.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    MongoStatChartComponent,
    MongoInventoryComponent
  ],
  providers: [],
  exports: [
    MongoStatChartComponent,
    MongoInventoryComponent
  ],
  entryComponents: []
})
export class MongoInventoryModule {
}
