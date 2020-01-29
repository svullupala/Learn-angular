import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentModule } from 'angular2-moment';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgaModule } from 'theme/nga.module';
import { TranslationModule, SharedModule } from 'shared/';
import { ResourceGroupsComponent } from './resource-groups.component';
import { ResourceGroupTableComponent } from './resource-group-table/resource-group-table.component';
import { ResourceGroupEditComponent } from './resource-group-edit/resource-group-edit.component';
import { ResourceGroupSelectorComponent } from './resource-group-selector/resource-group-selector.component';
import { ResourceGroupListComponent } from './resource-group-list/resource-group-list.component';
import { ResourceGroupsService } from './resource-groups.service';
import { ResourceGroupHypervisorSelectorComponent }
from './shared/resource-group-hypervisor-selector/resource-group-hypervisor-selector.component';
import { ResourceSelectorComponent } from './shared/resource-selector/resource-selector.component';
import { ResourceGroupDatabaseSelectorComponent }
from './shared/resource-group-database-selector/resource-group-database-selector.component';
import { ResourceGroupContainerSelectorComponent }
from './shared/resource-group-container-selector/resource-group-container-selector.component';
import { ResourceGroupReportsSelectorComponent }
from './shared/resource-group-reports-selector/resource-group-reports-selector.component';
import { ResourceGroupAccountSelectorComponent }
from './shared/resource-group-account-selector/resource-group-account-selector.component';
import { ResourceGroupScreensSelectorComponent }
from './shared/resource-group-screens-selector/resource-group-screens-selector.component';
import { ResourceGroupSystemSelectorComponent
} from './shared/resource-group-system-selector/resource-group-system-selector.component';
import {ResourceGroupSlapolicySelectorComponent}
from './shared/resource-group-slapolicy-selector/resource-group-slapolicy-selector.component';
import { ResourceGroupAppserverSelectorComponent }
from './shared/resource-group-appserver-selector/resource-group-appserver-selector.component';
import { ResourceGroupJobSelectorComponent }
from './shared/resource-group-job-selector/resource-group-job-selector.component';
import { ResourceGroupDetailsComponent }
from './resource-group-details/resource-group-details.component';
import { PopoverModule } from 'ngx-bootstrap/popover';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule.forRoot(),
    PopoverModule.forRoot(),
    MomentModule,
    NgaModule,
    TranslationModule,
    SharedModule
  ],
  declarations: [
    ResourceGroupsComponent,
    ResourceGroupTableComponent,
    ResourceGroupListComponent,
    ResourceGroupEditComponent,
    ResourceGroupDetailsComponent,
    ResourceGroupSelectorComponent,
    ResourceSelectorComponent,
    ResourceGroupAppserverSelectorComponent,
    ResourceGroupHypervisorSelectorComponent,
    ResourceGroupJobSelectorComponent,
    ResourceGroupDatabaseSelectorComponent,
    ResourceGroupContainerSelectorComponent,
    ResourceGroupReportsSelectorComponent,
    ResourceGroupAccountSelectorComponent,
    ResourceGroupScreensSelectorComponent,
    ResourceGroupSlapolicySelectorComponent,
    ResourceGroupSystemSelectorComponent
  ],
  providers: [
    ResourceGroupsService
  ],
  exports: []
})
export class ResourceGroupsModule {
}
