import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {BsDropdownModule, ModalModule} from 'ngx-bootstrap';

import {TranslationModule} from 'shared/';
import {SharedModule} from 'shared';
import {NgaModule} from 'theme/nga.module';
import {DiskStorageComponent} from './disk-storage.component';
import {StorageManageService} from './shared/storage-manage.service';
import {StorageSharedModule} from './shared/storage-shared.module';

@NgModule({
  imports: [
    NgaModule,
    TranslationModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDropdownModule,
    ModalModule.forRoot(),
    SharedModule,
    StorageSharedModule
  ],
  declarations: [
    DiskStorageComponent
  ],
  providers: [
    StorageManageService
  ],
  exports: [
    DiskStorageComponent
  ]
})
export class DiskStorageModule {
}
