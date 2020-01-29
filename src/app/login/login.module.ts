import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap';

import { NgaModule } from 'theme/nga.module';
import { SharedModule, TranslationModule } from 'shared';
import { LoginComponent } from './login.component';
import { routing }       from './login.routing';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    SharedModule,
    TranslationModule,
    routing,
    ModalModule.forRoot()
  ],
  declarations: [
    LoginComponent
  ]
})
export class LoginModule {}
