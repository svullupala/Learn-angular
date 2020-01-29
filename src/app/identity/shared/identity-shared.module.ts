import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule} from 'shared';
import {SharedModule} from 'shared';
import {IdentityUserEnterSelectComponent} from 'identity/shared/identity-user-enter-select';
import {IdentityUserEnterSelectV2Component} from 'identity/shared/identity-user-enter-select-v2';

@NgModule({
  declarations: [
    IdentityUserEnterSelectComponent,
    IdentityUserEnterSelectV2Component,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    TranslationModule,
    SharedModule
  ],
  exports: [
    IdentityUserEnterSelectComponent,
    IdentityUserEnterSelectV2Component,
  ],
  providers: [
  ]
})
export class IdentitySharedModule {
}
