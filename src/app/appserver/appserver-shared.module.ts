import {NgModule, ModuleWithProviders}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule} from 'shared';
import {SharedModule} from 'shared';
import {AppServerTableComponent} from './manage-appserver/appserver-table/appserver-table.component';
import {ApplicationRegistrationFormComponent} from './manage-appserver/registration-form/registration-form.component';
import {ManageAppServerComponent} from './manage-appserver/manage-appserver.component';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {ManageAppServerService} from './manage-appserver/manage-appserver.service';
import {AppServerService} from './appserver.service';
import {ApplicationRegistrationFormService} from './manage-appserver/registration-form/registration-form.service';
import {AppServerConfig} from './appserver-config.item';
import { DiscoveryTableComponent } from 'appserver/manage-appserver/discovery-table/discovery-table.component';

@NgModule({
  declarations: [
    AppServerTableComponent,
    ApplicationRegistrationFormComponent,
    DiscoveryTableComponent,
    ManageAppServerComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    TranslationModule,
    SharedModule,
    IdentitySharedModule
  ],
  exports: [
    AppServerTableComponent,
    ApplicationRegistrationFormComponent,
    ManageAppServerComponent,
    DiscoveryTableComponent
  ],
  providers: [
    ApplicationRegistrationFormService,
    AppServerService,
    ManageAppServerService
  ]
})
export class AppserverSharedModule {
  static forChild(config: AppServerConfig): ModuleWithProviders {
    return {
      ngModule: AppserverSharedModule,
      providers: [
        { provide: AppServerConfig, useValue: config}
      ]
    };
  }
}
