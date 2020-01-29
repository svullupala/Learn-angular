import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {MomentModule} from 'angular2-moment';
import {NgUploaderModule} from 'ngx-uploader';
import {LoaderModule} from 'shared/components/loader/loader.module';
import {ScriptsComponent} from './scripts.component';
import {ScriptTableComponent} from './script-table/script-table.component';
import {TranslationModule} from 'shared';
import {SharedModule} from 'shared';
import {ScriptEditComponent} from './script-edit/script-edit.component';
import {AppserverSharedModule} from 'appserver/appserver-shared.module';

@NgModule({
  imports: [
    NgUploaderModule,
    NgaModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslationModule,
    LoaderModule,
    SharedModule,
    MomentModule,
    AppserverSharedModule.forChild(
      {
        coreEndpoint: 'api/scriptserver',
        nodeEndpoint: 'ngp/scriptserver'
      }
    )
  ],
  declarations: [
    ScriptsComponent,
    ScriptEditComponent,
    ScriptTableComponent
  ],
  providers: [
  ],
  exports: []
})
export class ScriptsModule {
}
