import { CommonModule } from '@angular/common';
import { LoaderModule } from 'shared/components/loader/loader.module';
import { NgModule } from '@angular/core';
import { JobSharedModule } from 'job/shared/job-shared.module';
import { SystemInfoModule } from 'shared/components/system-info/system-info.module';
import { SharedModule } from 'shared/shared.module';
import { NgaModule } from '../../../theme/nga.module';
import { TranslationModule } from 'shared/translation.module';
import { JobListComponent } from './job-list-component/job-list.component';
import { JobItemComponent } from './job-item/job-item.component';
import { JobDetailsComponent } from './job-details/job-details.component';
import { MomentModule } from 'angular2-moment';
import { RefreshButtonModule } from 'shared/components/refresh-button/refresh-button.module';
import {JobRunningStatsComponent} from './job-running-stats/job-running-stats.component';
import {DashboardSharedModule} from '../../../dashboard/shared/dashboard-shared.module';
import {JobHistoryStatsComponent} from './job-history-stats/job-history-stats.component';
import {ActiveResourcesComponent} from './active-resources/active-resources.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {JobSessionTableComponent} from './job-session-table/job-session-table.component';
import { TabButtonGroupComponent } from './job-details/tab-button-group/tab-button-group.component';
import { ProgressTableComponent } from './progress-table/progress-table.component';
import { ProgressTableService } from './progress-table/progress-table.service';

@NgModule({
  imports: [
    CommonModule,
    LoaderModule,
    JobSharedModule,
    SystemInfoModule,
    SharedModule,
    MomentModule,
    FormsModule,
    ReactiveFormsModule,
    RefreshButtonModule,
    NgaModule,
    TranslationModule,
    DashboardSharedModule
  ],
  declarations: [
    JobListComponent,
    JobItemComponent,
    JobDetailsComponent,
    JobRunningStatsComponent,
    JobHistoryStatsComponent,
    JobSessionTableComponent,
    ActiveResourcesComponent,
    TabButtonGroupComponent,
    ProgressTableComponent
  ],
  providers: [
    ProgressTableService
  ],
  exports: [
    JobListComponent,
    JobItemComponent,
    JobDetailsComponent,
    JobRunningStatsComponent,
    JobHistoryStatsComponent,
    JobSessionTableComponent,
    ActiveResourcesComponent,
    ProgressTableComponent
  ]
})
export class MonitorSharedModule {
}
