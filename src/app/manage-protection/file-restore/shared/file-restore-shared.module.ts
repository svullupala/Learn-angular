import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BsDatepickerModule} from 'ngx-bootstrap';
import {NgaModule} from 'theme/nga.module';
import {MomentModule} from 'angular2-moment';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {TranslationModule} from 'shared';
import {SharedModule} from 'shared';
import {FileViewerComponent} from './file-viewer/file-viewer.component';
import {VmSearchSelectComponent} from './vm-search-select/vm-search-select.component';
import {FileRestoreOptionsComponent} from './file-restore-options/file-restore-options.component';
import {FileSearchOptionsComponent} from './file-search-options/file-search-options.component';
import {FileSelectTableComponent} from './file-select-table/file-select-table.component';

@NgModule({
  declarations: [
    VmSearchSelectComponent,
    FileSearchOptionsComponent,
    FileRestoreOptionsComponent,
    FileSelectTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BsDatepickerModule.forRoot(),
    MomentModule,
    AngularMultiSelectModule,
    NgaModule,
    TranslationModule,
    SharedModule
  ],
  exports: [
    VmSearchSelectComponent,
    FileSearchOptionsComponent,
    FileRestoreOptionsComponent,
    FileSelectTableComponent
  ],
  providers: [
  ]
})
export class FileRestoreSharedModule {
}
