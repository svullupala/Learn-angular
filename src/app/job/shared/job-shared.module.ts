import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import {ModalModule} from 'ngx-bootstrap';
import {NgaModule} from 'theme/nga.module';
import {MomentModule} from 'angular2-moment';
import {TranslationModule, SharedModule} from 'shared';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {JobService} from './job.service';
import {DurationDisplayPipe} from './duration-display.pipe';
import {JobActionSchemaComponent} from './job-action-schema/job-action-schema.component';
import {JobLogTableComponent} from './job-log-table/job-log-table.component';
import {JobTableComponent} from './job-table/job-table.component';
import {JobScheduleTableComponent} from './job-schedule-table/job-schedule-table.component';
import {CloneTableComponent} from './clone-table/clone-table.component';
import {JobStatusTableComponent} from './job-status-table/job-status-table.component';
import {RefreshButtonModule} from 'shared/components/refresh-button/refresh-button.module';
import {JobTypeDisplayPipe} from './job-type.pipe';
import {OnDemandSessionNamePipe} from './job-status-table/ondemand-session-name.pipe';
import {JobSubPolicyTypeDisplayPipe} from './job-subpolicytype.pipe';
import {JobManageComponent} from './job-manage-table/job-manage-table.component';
// import { DefineEditScheduleModule } from 'shared/components/define-edit-schedule/define-edit-schedule.module';

@NgModule({
  declarations: [
    DurationDisplayPipe,
    JobTypeDisplayPipe,
    JobSubPolicyTypeDisplayPipe,
    JobActionSchemaComponent,
    JobManageComponent,
    OnDemandSessionNamePipe,
    JobLogTableComponent,
    JobTableComponent,
    CloneTableComponent,
    JobStatusTableComponent,
    JobScheduleTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalModule,
    NgaModule,
    TranslationModule,
    MomentModule,
    AngularMultiSelectModule,
    RefreshButtonModule,
    SharedModule,
    // DefineEditScheduleModule
  ],
  exports: [
    DurationDisplayPipe,
    JobTypeDisplayPipe,
    JobManageComponent,
    JobActionSchemaComponent,
    OnDemandSessionNamePipe,
    JobLogTableComponent,
    JobTableComponent,
    JobScheduleTableComponent,
    CloneTableComponent,
    JobStatusTableComponent,
    JobSubPolicyTypeDisplayPipe
  ],
  providers: [
    JobService
  ]
})
export class JobSharedModule {
}
