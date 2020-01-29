import {NgModule}      from '@angular/core';
import {routing}       from './vadp-proxy-monitor.routing';
import {CommonModule}  from '@angular/common';
import {NgaModule} from 'theme/nga.module';
import {ModalModule} from 'ngx-bootstrap';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';

import {TranslationModule} from 'shared';
import {LoaderModule} from 'shared/components/loader/loader.module';
import {RefreshButtonModule} from 'shared/components/refresh-button/refresh-button.module';
import {SharedModule} from 'shared';

import {VadpProxyMonitorComponent} from './vadp-proxy-monitor.component';
import {VadpProxyStatusTableComponent} from './vadp-status-table/vadp-proxy-status-table.component';
import {VadpProxyMonitorService} from './vadp-proxy-monitor.service';
import {MomentModule} from 'angular2-moment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {VadpActionSchemaComponent} from './vadp-action-schema/vadp-action-schema.component';
import { VadpTaskInfoComponent } from './vadp-task-info/vadp-task-info.component';
import { JobSharedModule } from 'job/shared/job-shared.module';
import { VadpProxyDetailsComponent } from './vadp-proxy-details/vadp-proxy-details.component';
import { IdentitySharedModule } from 'identity/shared/identity-shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    routing,
    TranslationModule,
    LoaderModule,
    RefreshButtonModule,
    SharedModule,
    MomentModule,
    ModalModule,
    IdentitySharedModule,
    JobSharedModule,
    AngularMultiSelectModule
  ],
  declarations: [
    VadpProxyMonitorComponent,
    VadpProxyDetailsComponent,
    VadpProxyStatusTableComponent,
    VadpTaskInfoComponent,
    VadpActionSchemaComponent
  ],
  providers: [
    VadpProxyMonitorService
  ],
  exports: []
})
export class VadpProxyMonitorModule {
}
