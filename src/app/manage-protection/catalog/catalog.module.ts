import { NgModule }      from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentModule } from 'angular2-moment';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgaModule } from 'theme/nga.module';
import { TranslationModule, SharedModule } from 'shared';
import { CatalogSearchComponent } from './manage/search/catalog-search.component';
import { CatalogEntriesTableComponent } from './manage/search/catalog-entries-table/catalog-entries-table.component';
import { CatalogResourceTableComponent } from './manage/resource/catalog-resource-table/catalog-resource-table.component';
import { CatalogSearchOptionsComponent } from './manage/search/catalog-search-options/catalog-search-options.component';
import { ServiceIdDisplayPipe } from './manage/search/catalog-entries-table/serviceid.pipe';
import { CatalogBackupComponent } from './backup/catalog-backup.component';
import { CatalogRestoreComponent } from './restore/catalog-restore.component';
import { CatalogResourceComponent } from './manage/resource/catalog-resource.component';
import { SlapolicySharedModule } from '../slapolicy/shared/slapolicy-shared.module';
import { SystemInfoModule } from 'shared/components/system-info/system-info.module';
import { CatalogSearchService } from './manage/resource/catalog-search.service';
import { CatalogManageComponent } from './manage/catalog-manage.component';
import {JobSharedModule} from 'job/shared/job-shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule.forRoot(),
    MomentModule,
    NgaModule,
    TranslationModule,
    SharedModule,
    SlapolicySharedModule,
    JobSharedModule,
    SystemInfoModule
  ],
  declarations: [
    CatalogSearchComponent,
    CatalogRestoreComponent,
    CatalogResourceComponent,
    CatalogSearchOptionsComponent,
		CatalogManageComponent,
    CatalogEntriesTableComponent,
    CatalogResourceTableComponent,
    CatalogBackupComponent,
    ServiceIdDisplayPipe
  ],
  providers: [
    CatalogSearchService
  ],
  exports: [
    ServiceIdDisplayPipe
  ]
})
export class CatalogModule {
}
