import {NgModule} from '@angular/core';
import {routing} from './reports-and-logs.routing';
import {ReportsAndLogsComponent} from './reports-and-logs.component';
import {ReportsModule} from './reports/reports.module';
import {AuditLogModule} from './audit-log/audit-log.module';

@NgModule({
  imports: [
    routing,
    ReportsModule,
    AuditLogModule
  ],
  declarations: [
    ReportsAndLogsComponent
  ],
  providers: [
  ],
  exports: [
  ]
})

export class ReportsAndLogsModule {
}
