import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BsDropdownModule, ModalModule} from 'ngx-bootstrap';
import {NgaModule} from 'theme/nga.module';
import {SharedModule} from 'shared';
import {SlapolicySharedModule} from './shared/slapolicy-shared.module';
import {SlapolicyComponent} from './slapolicy.component';
import {TranslationModule } from 'shared';
import {PolicyEditComponent} from './policyEdit/policyedit.component';
import {UnprotectedVmModule} from '../../dashboard/unprotected-vm/unprotected-vm.module';
import {ProtectedVmModule} from '../../dashboard/protected-vm/protected-vm.module';
import {SlaComplianceModule} from '../../dashboard/slaCompliance/slaCompliance.module';
import {DashboardService} from '../../dashboard/dashboard.service';
import {PolicyAssignmentsModalComponent} from 'slapolicy/policy-assignments-modal/policy-assignments-modal.component';
import {JobWizardModule} from 'wizard/job-wizard.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    ModalModule.forRoot(),
    BsDropdownModule,
    TranslationModule,
    SharedModule,
    SlapolicySharedModule,
    SlaComplianceModule,
    ProtectedVmModule,
    UnprotectedVmModule,
    JobWizardModule
  ],
  declarations: [
    SlapolicyComponent,
    PolicyEditComponent,
    PolicyAssignmentsModalComponent
  ],
  providers: [
    DashboardService
  ]
})
export class SlapolicyModule {
}
