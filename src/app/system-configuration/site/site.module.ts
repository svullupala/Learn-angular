import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule} from 'shared';
import { SitesComponent } from './sites.component';
import { SiteEditComponent } from './siteEdit/siteEdit.component';
import { SitesTableComponent } from './sitesTable/sitesTable.component';
import { SiteService } from './site.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    TranslationModule,
    SharedModule
  ],
  declarations: [
    SitesComponent,
    SiteEditComponent,
    SitesTableComponent
  ],
  providers: [
    SiteService
  ],
  exports: []
})
export class SiteModule {
}
