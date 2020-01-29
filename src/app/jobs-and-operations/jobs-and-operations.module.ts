import {NgModule} from '@angular/core';
import {routing} from './jobs-and-operations.routing';
import {JobsAndOperationsComponent} from './jobs-and-operations.component';
import { JobSharedModule } from 'job/shared/job-shared.module';
import { SharedModule } from 'shared/shared.module';
import { TranslationModule } from 'shared/translation.module';
import { MonitorModule } from './monitor/monitor.module';
import {DashboardService} from '../dashboard/dashboard.service';

@NgModule({
  imports: [
    routing,
    MonitorModule,
    SharedModule,
    TranslationModule,
    JobSharedModule,
  ],
  declarations: [
    JobsAndOperationsComponent
  ],
  providers: [
    DashboardService
  ],
  exports: [
  ]
})

export class JobsAndOperationsModule {
}
