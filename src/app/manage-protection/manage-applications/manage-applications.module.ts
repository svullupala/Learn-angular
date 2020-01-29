import {NgModule} from '@angular/core';
import {ManageApplicationsComponent} from './manage-applications.component';
import {SqlInventoryModule} from './sql/sql-inventory.module';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from 'shared/shared.module';
import {TranslationModule} from 'shared/translation.module';
import {Db2InventoryModule} from './db2/db2-inventory.module';
import {ExchInventoryModule} from './exch/exch-inventory.module';
import {ExchonlineInventoryModule} from './exchonline/exchonline-inventory.module';
import {MongoInventoryModule} from './mongo/mongo-inventory.module';
import {OracleInventoryModule} from './oracle/oracle-inventory.module';
import {ApplicationInventorySharedModule} from './shared/application-inventory-shared.module';
import {ApplicationsAssignPolicyService} from './shared/assign-policy/applications-assign-policy.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslationModule,
    Db2InventoryModule,
    ExchInventoryModule,
    ExchonlineInventoryModule,
    MongoInventoryModule,
    OracleInventoryModule,
    SqlInventoryModule,
    ApplicationInventorySharedModule
  ],
  declarations: [
    ManageApplicationsComponent
  ],
  providers: [
    ApplicationsAssignPolicyService,
  ],
  exports: [],
  entryComponents: []
})
export class ManageApplicationsModule {
}
