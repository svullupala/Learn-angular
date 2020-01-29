import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {Edit16Module} from '@carbon/icons-angular/lib/edit/16';
import { PoliciesComponent } from './policies/policies.component';
import { RunSettingsComponent } from './run-settings/run-settings.component';
import { HypervisorAssignPolicyComponent } from './hypervisor-assign-policy.component';
import { SharedModule } from 'shared/shared.module';
import { NgaModule } from '../../../../theme/nga.module';
import { RecentJobsComponent } from './recent-jobs/recent-jobs.component';
import { SlapolicySharedModule } from 'slapolicy/shared/slapolicy-shared.module';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/src/app/angular2-multiselect-dropdown/multiselect.component';
import {HypervisorIconModule} from '../icon/hypervisor-icon.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    TranslateModule,
    SharedModule,
    SlapolicySharedModule,
    IdentitySharedModule,
    AngularMultiSelectModule,
    Edit16Module,
    HypervisorIconModule
  ],
  declarations: [
    HypervisorAssignPolicyComponent,
    PoliciesComponent,
    RunSettingsComponent,
    RecentJobsComponent
  ],
  exports: [HypervisorAssignPolicyComponent]
})
export class HypervisorAssignPolicyModule {}
