import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {MomentModule} from 'angular2-moment';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {TranslationModule} from 'shared';
import {SharedModule} from 'shared';
import {ReportCustomComponent} from './report-custom/report-custom.component';
import {ReportViewerComponent} from './report-viewer/report-viewer.component';
import {RestService} from 'core';
import {ReportsTableComponent} from './reports-table/reports-table.component';
import {ReportModalComponent} from 'reports/shared/report-modal/report-modal.component';
import {BsDropdownModule, ModalModule, TooltipModule} from 'ngx-bootstrap';
import {ReportsService} from 'reports/shared/reports.service';

@NgModule({
  declarations: [
    ReportCustomComponent,
    ReportViewerComponent,
    ReportsTableComponent,
    ReportModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MomentModule,
    ModalModule,
    NgaModule,
    TranslationModule,
    AngularMultiSelectModule,
    SharedModule,
    TooltipModule,
    BsDropdownModule,
  ],
  exports: [
    ReportCustomComponent,
    ReportViewerComponent,
    ReportsTableComponent,
    ReportModalComponent,
  ],
  providers: [
    // RestService - NOTE: Use the RestService provider in Pages module.
    ReportsService,
  ],
  entryComponents: [
    ReportModalComponent,
  ]
})
export class ReportSharedModule {
}
