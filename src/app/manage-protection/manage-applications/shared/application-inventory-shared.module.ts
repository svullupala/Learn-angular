import {NgModule} from '@angular/core';
import {ApplicationStatChartComponent} from './stat-chart/application-stat-chart.component';
import {InventoryModule} from 'inventory/inventory.module';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from 'shared/shared.module';
import {TranslationModule} from 'shared/translation.module';
import {ApplicationListComponent} from './list/application-list.component';
import {ApplicationAdvancedSearchComponent} from './advanced-search/application-advanced-search.component';
import {ApplicationRegistrationComponent} from './registration/application-registration.component';
import {NgaModule} from '../../../theme/nga.module';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {AppserverSharedModule} from 'appserver/appserver-shared.module';
import {ApplicationInventoryService} from './application-inventory.service';
import {ApplicationTableComponent} from './table/application-table.component';
import {ApplicationCategoryTableComponent} from './category-table/application-category-table.component';
import {ApplicationCategoryViewComponent} from './category-view/application-category-view.component';
import {ApplicationViewerComponent} from './viewer/application-viewer.component';
import {AppserverCardComponent} from './appserver-card/appserver-card.component';
import {ApplicationsSharedModule} from 'applications/shared/applications-shared.module';
import {ApplicationsAssignPolicyModule} from './assign-policy/applications-assign-policy.module';
import {ApplicationIconModule} from './icon/application-icon.module';
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
    AppserverSharedModule,
    ApplicationsSharedModule,
    ApplicationsAssignPolicyModule,
    ApplicationIconModule,
    StatusIconModule,
    Filter16Module,
    OverflowMenuVertical16Module
  ],
  declarations: [
    ApplicationStatChartComponent,
    ApplicationRegistrationComponent,
    ApplicationAdvancedSearchComponent,
    ApplicationListComponent,
    ApplicationTableComponent,
    ApplicationViewerComponent,
    AppserverCardComponent,
    ApplicationCategoryTableComponent,
    ApplicationCategoryViewComponent
  ],
  providers: [
    ApplicationInventoryService
  ],
  exports: [
    ApplicationStatChartComponent,
    ApplicationRegistrationComponent,
    ApplicationAdvancedSearchComponent,
    ApplicationListComponent,
    ApplicationTableComponent,
    ApplicationViewerComponent,
    AppserverCardComponent,
    ApplicationCategoryTableComponent,
    ApplicationCategoryViewComponent,
    InventoryModule,
    ApplicationsAssignPolicyModule,
  ],
  entryComponents: [
    ApplicationRegistrationComponent
  ]
})
export class ApplicationInventorySharedModule {
}
