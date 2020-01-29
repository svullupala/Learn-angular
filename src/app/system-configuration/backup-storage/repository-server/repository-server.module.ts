import { CloudComponent } from './cloud.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader/src/module/ngx-uploader.module';
import { TranslationModule } from 'shared/translation.module';
import { SharedModule } from 'shared/shared.module';
import { NgaModule } from '../../../theme/nga.module';
import { RepositoryServerComponent } from './repository-server.component';
import { RepositoryServerTableComponent } from './repository-server-table/repository-server-table.component';
import { CloudCertificateSelectorComponent } from 'cloud/cloud-certificate/cloud-certificate-selector.component';
import { KeySelectorComponent } from '../../../shared/components/key-selector/key-selector.component';
import { CloudService } from 'cloud/cloud.service';
import { RepositoryServerRegistrationComponent } from './repository-server-registration/repository-server-registration.component';
import { CloudModule } from 'cloud/cloud.module';

@NgModule({
  declarations: [
    RepositoryServerComponent,
    RepositoryServerRegistrationComponent,
    RepositoryServerTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    TranslationModule,
    NgUploaderModule,
    CloudModule,
    SharedModule
  ],
  exports: [
    RepositoryServerComponent,
    RepositoryServerRegistrationComponent,
    RepositoryServerTableComponent
  ],
  providers: [
    CloudService
  ]
})
export class RepositoryServerModule {
}
