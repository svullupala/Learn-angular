import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule } from 'shared';
import {FileRestoreComponent} from './file-restore.component';
import {SharedModule} from 'shared';
import {FileRestoreSharedModule} from './shared/file-restore-shared.module';
import {JobSharedModule} from 'job/shared/job-shared.module';
import {SiteService} from 'site/site.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    TranslationModule,
    SharedModule,
    FileRestoreSharedModule,
    JobSharedModule
  ],
  declarations: [
    FileRestoreComponent
  ],
  providers: [
    SiteService
  ],
  exports: []
})
export class FileRestoreModule {
}
