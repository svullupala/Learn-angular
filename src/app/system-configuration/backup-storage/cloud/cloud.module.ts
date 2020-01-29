import { CloudComponent } from './cloud.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader/src/module/ngx-uploader.module';
import { TranslationModule } from 'shared/translation.module';
import { SharedModule } from 'shared/shared.module';
import { CloudRegistrationComponent } from './cloud-registration/cloud-registration.component';
import { CloudSchemaComponent } from './cloud-schema/cloud-schema.component';
import { CloudTableComponent } from './cloud-table/cloud-table.component';
import { CloudService } from './cloud.service';
import { NgaModule } from '../../../theme/nga.module';
import { CloudCertificateSelectorComponent } from './cloud-certificate/cloud-certificate-selector.component';
import { SdlTooltipModule } from 'shared/directives/sdl-tooltip';

@NgModule({
  declarations: [
    CloudComponent,
    CloudTableComponent,
    CloudSchemaComponent,
    CloudRegistrationComponent,
    CloudCertificateSelectorComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    TranslationModule,
    NgUploaderModule,
    SdlTooltipModule,
    SharedModule
  ],
  exports: [
    CloudComponent,
    CloudTableComponent,
    CloudSchemaComponent,
    CloudRegistrationComponent,
    CloudCertificateSelectorComponent
  ],
  providers: [
    CloudService
  ]
})
export class CloudModule {
}
