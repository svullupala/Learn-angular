import {NgModule} from '@angular/core';
import {SlapolicyModule} from './slapolicy/slapolicy.module';
import {CatalogModule} from './catalog/catalog.module';
import {routing} from './manage-protection.routing';
import {ManageProtectionComponent} from './manage-protection.component';
import {FileRestoreModule} from './file-restore/file-restore.module';
import {ManageHypervisorsModule} from './manage-hypervisors/manage-hypervisors.module';
import {ManageApplicationsModule} from './manage-applications/manage-applications.module';

@NgModule({
  imports: [
    routing,
    SlapolicyModule,
    CatalogModule,
    FileRestoreModule,
    ManageHypervisorsModule,
    ManageApplicationsModule
  ],
  declarations: [
    ManageProtectionComponent
  ],
  providers: [
  ],
  exports: [
  ]
})

export class ManageProtectionModule {
}
