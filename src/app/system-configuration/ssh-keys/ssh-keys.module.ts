import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule} from 'shared';
import { SshKeysComponent } from './ssh-keys.component';
import { SshKeysEditComponent } from './ssh-keys-edit/ssh-keys-edit.component';
import { SshKeysTableComponent } from './ssh-keys-table/ssh-keys-table.component';
import { AccessKeysService } from '../access-keys/access-keys.service';

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
    SshKeysComponent,
    SshKeysEditComponent,
    SshKeysTableComponent
  ],
  providers: [
    AccessKeysService
  ],
  exports: [
    SshKeysComponent,
    SshKeysEditComponent,
    SshKeysTableComponent
  ]
})
export class SshKeysModule {
}
