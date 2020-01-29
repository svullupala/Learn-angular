import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {Edit16Module} from '@carbon/icons-angular/lib/edit/16';
import { PoliciesComponent } from './policies/policies.component';
import { RunSettingsComponent } from './run-settings/run-settings.component';
import { SharedModule } from 'shared/shared.module';
import { NgaModule } from '../../../../theme/nga.module';
import { RecentJobsComponent } from './recent-jobs/recent-jobs.component';
import { SlapolicySharedModule } from 'slapolicy/shared/slapolicy-shared.module';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/src/app/angular2-multiselect-dropdown/multiselect.component';
import {ApplicationsAssignPolicyComponent} from './applications-assign-policy.component';
import {ApplicationIconModule} from '../icon/application-icon.module';


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
    ApplicationIconModule
  ],
  declarations: [
    ApplicationsAssignPolicyComponent,
    PoliciesComponent,
    RunSettingsComponent,
    RecentJobsComponent
  ],
  exports: [ApplicationsAssignPolicyComponent]
})
export class ApplicationsAssignPolicyModule {}
