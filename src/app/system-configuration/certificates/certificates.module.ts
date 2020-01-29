import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule} from 'shared';
import {CertificatesComponent} from './certificates.component';
import {CertificatesTableComponent} from './certificatesTable/certificatesTable.component';
import {CertificatesEditComponent} from './certificatesEdit/certificatesEdit.component';
import {CertificatesService} from './certificates.service';
import {MomentModule} from 'angular2-moment';
import {CloudModule} from 'cloud/cloud.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    TranslationModule,
    SharedModule,
    MomentModule,
    CloudModule
  ],
  declarations: [
    CertificatesComponent,
    CertificatesTableComponent,
    CertificatesEditComponent
  ],
  providers: [
    CertificatesService
  ],
  exports: [
    CertificatesComponent
  ]
})
export class CertificatesModule {
}
