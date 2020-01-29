import {NgModule} from '@angular/core';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {InventoryStatChartComponent} from './stat-chart/inventory-stat-chart.component';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from 'shared/shared.module';
import {TranslationModule} from 'shared/translation.module';
import {InventoryStatOptionsDropdownComponent} from './stat-options-dropdown/inventory-stat-options-dropdown.component';
import {InventoryStatOptionsComponent} from './stat-options/inventory-stat-options.component';
import {BsDropdownModule, TooltipModule} from 'ngx-bootstrap';
import {InventoryDoughnutChartComponent} from './doughnut-chart/inventory-doughnut-chart.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TooltipModule.forRoot(),
    BsDropdownModule.forRoot(),
    AngularMultiSelectModule,
    SharedModule,
    TranslationModule
  ],
  declarations: [
    InventoryDoughnutChartComponent,
    InventoryStatOptionsDropdownComponent,
    InventoryStatOptionsComponent,
    InventoryStatChartComponent
  ],
  providers: [],
  exports: [
    InventoryDoughnutChartComponent,
    InventoryStatOptionsDropdownComponent,
    InventoryStatOptionsComponent,
    InventoryStatChartComponent
  ],
  entryComponents: []
})
export class InventoryModule {
}
