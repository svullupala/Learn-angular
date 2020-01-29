import {NgModule} from '@angular/core';
import {HypervisorStatChartComponent} from './stat-chart/hypervisor-stat-chart.component';
import {InventoryModule} from 'inventory/inventory.module';
import {HypervisorRegistrationComponent} from './registration/hypervisor-registration.component';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from 'shared/shared.module';
import {TranslationModule} from 'shared/translation.module';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {NgaModule} from '../../../theme/nga.module';
import {HypervisorModule} from 'hypervisor/hypervisor.module';
import {HypervisorListComponent} from './list/hypervisor-list.component';
import {HypervisorAdvancedSearchComponent} from './advanced-search/hypervisor-advanced-search.component';
import {HypervisorInventoryService} from './hypervisor-inventory.service';
import {VmareVcenterCardComponent} from './vcenter-card/vmare-vcenter-card.component';
import {HypervisorViewerComponent} from './viewer/hypervisor-viewer.component';
import {HypervisorTableComponent} from './table/hypervisor-table.component';
import {HypervisorAssignPolicyModule} from './assign-policy/hypervisor-assign-policy.module';
import {HypervisorResourcesService} from './hypervisor-resources.service';
import {HypervisorCategoryTableComponent} from './category-table/hypervisor-category-table.component';
import {HypervisorCategoryViewComponent} from './category-view/hypervisor-category-view.component';
import {HypervisorIconModule} from './icon/hypervisor-icon.module';
import {Filter16Module} from '@carbon/icons-angular/lib/filter/16';
import {OverflowMenuVertical16Module} from '@carbon/icons-angular/lib/overflow-menu--vertical/16';
import {StatusIconModule} from 'shared/components/status-icon/status-icon.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule.forRoot(),
    SharedModule,
    TranslationModule,
    InventoryModule,
    IdentitySharedModule,
    HypervisorModule,
    HypervisorAssignPolicyModule,
    HypervisorIconModule,
    StatusIconModule,
    Filter16Module,
    OverflowMenuVertical16Module
  ],
  declarations: [
    HypervisorStatChartComponent,
    HypervisorRegistrationComponent,
    HypervisorListComponent,
    HypervisorAdvancedSearchComponent,
    VmareVcenterCardComponent,
    HypervisorTableComponent,
    HypervisorViewerComponent,
    HypervisorCategoryTableComponent,
    HypervisorCategoryViewComponent
  ],
  providers: [
    HypervisorInventoryService,
    HypervisorResourcesService,
  ],
  exports: [
    HypervisorStatChartComponent,
    HypervisorRegistrationComponent,
    HypervisorListComponent,
    HypervisorAdvancedSearchComponent,
    VmareVcenterCardComponent,
    HypervisorTableComponent,
    HypervisorViewerComponent,
    HypervisorCategoryTableComponent,
    HypervisorCategoryViewComponent,
    HypervisorAdvancedSearchComponent,
    InventoryModule,
    HypervisorAssignPolicyModule,
  ],
  entryComponents: [
    HypervisorRegistrationComponent
  ]
})
export class HypervisorInventorySharedModule {
}
