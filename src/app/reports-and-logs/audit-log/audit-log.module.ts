import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule} from 'shared';
import {SearchBarModule} from 'shared/components/search-bar/search-bar.module';
import {LoaderModule} from 'shared/components/loader/loader.module';
import {SharedModule} from 'shared';

import {AuditLogView} from './audit-log.view';
import {AuditLogTableComponent} from './audit-log-table/audit-log-table.component';
import {AuditLogService} from './audit-log.service';
import {MomentModule} from 'angular2-moment';
import {AuditLogSearchOptionsComponent} from './audit-log-search-options/audit-log-search-options.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BsDatepickerModule.forRoot(),
    NgaModule,
    TranslationModule,
    SharedModule,
    SearchBarModule,
    LoaderModule,
    MomentModule
  ],
  declarations: [
    AuditLogView,
    AuditLogTableComponent,
    AuditLogSearchOptionsComponent
  ],
  providers: [ AuditLogService ]
})
export class AuditLogModule {

  constructor() { }
}
