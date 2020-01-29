import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MomentModule} from 'angular2-moment';
import {NgaModule} from 'theme/nga.module';
import {CountDashboardComponent} from './count-dashboard/count-dashboard.component';
import {DoughnutChartComponent, DoughnutChartData} from './doughnut-chart/doughnut-chart.component';
import { TooltipModule } from 'ngx-bootstrap';
import {CircleSummaryChartComponent} from './circle-summary-chart/circle-summary-chart.component';
import {TranslationModule} from 'shared';
import {LastPeriodFilterComponent} from './last-period-filter/last-period-filter.component';
import {A11yKeyboardModule} from 'shared/util/keyboard';
export {DoughnutChartData} from './doughnut-chart/doughnut-chart.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TooltipModule.forRoot(),
    NgaModule,
    TranslationModule,
    MomentModule,
    A11yKeyboardModule
  ],
  declarations: [
    CountDashboardComponent,
    DoughnutChartComponent,
    CircleSummaryChartComponent,
    LastPeriodFilterComponent
  ],
  providers: [ ],
  exports: [
    CountDashboardComponent,
    DoughnutChartComponent,
    CircleSummaryChartComponent,
    LastPeriodFilterComponent
  ]
})
export class DashboardSharedModule {}
