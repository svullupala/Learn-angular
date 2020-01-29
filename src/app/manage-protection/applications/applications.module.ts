import { NgModule }      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { routing }       from './applications.routing';
import { SharedModule } from 'shared';
import {Applications} from 'applications/applications.component';
import {ApplicationsSharedModule} from 'applications/shared/applications-shared.module';
import {TranslateModule} from '@ngx-translate/core';
import {BsDatepickerModule, BsDropdownModule, ModalModule, TimepickerModule, TooltipModule} from 'ngx-bootstrap';
import {MomentModule} from 'angular2-moment';
import {NgaModule} from '../../theme/nga.module';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {JobWizardModule} from 'wizard/job-wizard.module';
import {ApplicationBackupComponent} from 'applications/backup';
// import {PostScriptsModule} from 'shared/components/post-scripts/post-scripts.module';
import {SlapolicySharedModule} from 'slapolicy/shared/slapolicy-shared.module';
import {AppserverSharedModule} from 'appserver/appserver-shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    MomentModule,
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    TooltipModule.forRoot(),
    SharedModule,
    TranslateModule,
    AngularMultiSelectModule,
    routing,
    ApplicationsSharedModule,
    SlapolicySharedModule,
    AppserverSharedModule,
    JobWizardModule
  ],
  declarations: [
    Applications,
    ApplicationBackupComponent
  ],
  providers: [],
  exports: [],
  entryComponents: [
  ]
})
export class ApplicationsModule {
}
