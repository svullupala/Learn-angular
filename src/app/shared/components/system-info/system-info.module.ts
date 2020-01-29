import {NgModule}      from '@angular/core';
import {CommonModule, PercentPipe} from '@angular/common';
import {NgaModule} from 'theme/nga.module';
import {SharedModule} from 'shared/shared.module';
import {SystemInfoComponent} from './system-info.component';
import {SystemInfoCapacityComponent} from './system-info-capacity.component';
import {SystemInfoMetricsComponent} from './system-info-metrics.component';
import {SystemInfoService} from './system-info.service';
import {CPUUsageMetricsComponent} from './cpu-usage-metrics.component';


@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    SharedModule
  ],
  declarations: [
    SystemInfoComponent,
    SystemInfoCapacityComponent,
    SystemInfoMetricsComponent,
    CPUUsageMetricsComponent
  ],
  providers: [
    SystemInfoService,
    PercentPipe
  ],
  exports: [
    SystemInfoComponent,
    SystemInfoCapacityComponent,
    SystemInfoMetricsComponent,
    CPUUsageMetricsComponent
  ]
})
export class SystemInfoModule {}
