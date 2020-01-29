import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MomentModule} from 'angular2-moment';

import {TranslationModule} from 'shared';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {SharedModule} from 'shared';
import {JobSharedModule} from 'job/shared/job-shared.module';
import {SlapolicyService} from './slapolicy.service';
import {SubPolicyDisplayPipe} from './subpolicy-display.pipe';
import {PolicyTableComponent} from './policyTable/policyTable.component';
import {PolicySelectTableComponent} from './policySelectTable/policySelectTable.component';
import {PolicyStatusTableComponent} from './policyStatusTable/policyStatusTable.component';
import {RefreshButtonModule} from 'shared/components/refresh-button/refresh-button.module';
import { PostScriptsModule } from 'shared/components/post-scripts/post-scripts.module';

@NgModule({
  declarations: [
    SubPolicyDisplayPipe,
    PolicyTableComponent,
    PolicySelectTableComponent,
    PolicyStatusTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MomentModule,
    TranslationModule,
    AngularMultiSelectModule,
    SharedModule,
    JobSharedModule,
    PostScriptsModule,
    RefreshButtonModule
  ],
  exports: [
    SubPolicyDisplayPipe,
    PolicyTableComponent,
    PolicySelectTableComponent,
    PolicyStatusTableComponent
  ],
  providers: [
    SlapolicyService
  ]
})
export class SlapolicySharedModule {
}
