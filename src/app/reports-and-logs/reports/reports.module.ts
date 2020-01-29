import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {ReportsComponent} from './reports.component';
import {ReportSharedModule} from './shared/report-shared.module';
import {NgaModule} from 'theme/nga.module';
import {SlapolicySharedModule} from 'slapolicy/shared/slapolicy-shared.module';
import {SharedModule} from 'shared';
import {ReportWizardModule} from '../wizard/report-wizard.module';

@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    ReactiveFormsModule,
    FormsModule,
    SlapolicySharedModule,
    TranslateModule,
    SharedModule,
    ReportSharedModule,
    ReportWizardModule,
  ],
  declarations: [
    ReportsComponent
  ],
  providers: [
  ],
  exports: []
})
export class ReportsModule {
}
