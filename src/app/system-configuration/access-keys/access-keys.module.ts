import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule} from 'shared';
import {AccessKeysService} from './access-keys.service';
import {AccessKeysComponent} from './access-keys.component';
import {KeysTableComponent} from './keysTable/keysTable.component';
import {KeysEditComponent} from './keysEdit/keysEdit.component';

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
    AccessKeysComponent,
    KeysTableComponent,
    KeysEditComponent
  ],
  providers: [
    AccessKeysService
  ],
  exports: [
    AccessKeysComponent
  ]
})
export class AccessKeysModule {
}
