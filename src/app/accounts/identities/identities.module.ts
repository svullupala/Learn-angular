import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BsDropdownModule, ModalModule} from 'ngx-bootstrap';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule} from 'shared';
import {SharedModule} from 'shared';
import {IdentitiesComponent} from './identities.component';
import {IdentitiesTableComponent} from './identitiesTable/identitiesTable.component';
import {IdentitiesService} from './identities.service';
import {IdentitiesEditComponent} from './identitiesEdit/identitiesEdit.component';

@NgModule({
  imports: [
    NgaModule,
    CommonModule,
    BsDropdownModule,
    ReactiveFormsModule,
    FormsModule,
    ModalModule,
    TranslationModule,
    SharedModule
  ],
  declarations: [
    IdentitiesComponent,
    IdentitiesEditComponent,
    IdentitiesTableComponent
  ],
  providers: [
    IdentitiesService
  ],
  exports: []
})
export class IdentitiesModule {
}
