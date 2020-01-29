import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from 'theme/nga.module';

import { routing }       from './dashboard.routing';

import { UsersMap } from './usersMap';
import { UsersMapService } from './usersMap/usersMap.service';

import { DashboardService } from './dashboard.service';

import { TranslateModule } from '@ngx-translate/core';
import {DashboardNew} from './dashboard-new.component';
import {DashboardNewService} from './dashboard-new.service';
import {DashboardJobsAndOpsComponent} from './dashboard-jobs-and-ops/dashboard-jobs-and-ops.component';
import {DashboardCoverageComponent} from './dashboard-coverage/dashboard-coverage.component';
import {DashboardDestinationsComponent} from './dashboard-destinations/dashboard-destinations.component';
import {DashboardSharedModule} from './shared/dashboard-shared.module';
import {SystemInfoModule} from 'shared/components/system-info/system-info.module';
import {SharedModule} from 'shared/shared.module';
import {SlapolicyService} from 'slapolicy/shared/slapolicy.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    TranslateModule,
    SystemInfoModule,
    DashboardSharedModule,
    SharedModule,
    routing
  ],
  declarations: [
    DashboardNew,
    DashboardJobsAndOpsComponent,
    DashboardDestinationsComponent,
    DashboardCoverageComponent,
  ],
  providers: [
    DashboardService,
    SlapolicyService,
    DashboardNewService
  ]
})
export class DashboardModule {}
