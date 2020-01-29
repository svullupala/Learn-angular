import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslationModule} from 'shared/translation.module';
import {ManageHypervisorsComponent} from './manage-hypervisors.component';
import {VmwareInventoryModule} from './vmware/vmware-inventory.module';
import {HypervInventoryModule} from './hyperv/hyperv-inventory.module';
import {SharedModule} from 'shared/shared.module';
import {HypervisorAssignPolicyService} from './shared/assign-policy/hypervisor-assign-policy.service';
import {HypervisorInventorySharedModule} from './shared/hypervisor-inventory-shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslationModule,
    HypervisorInventorySharedModule,
    VmwareInventoryModule,
    HypervInventoryModule
  ],
  declarations: [
    ManageHypervisorsComponent
  ],
  providers: [
    HypervisorAssignPolicyService
  ],
  exports: [],
  entryComponents: []
})
export class ManageHypervisorsModule {
}
