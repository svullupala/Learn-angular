import { Routes, RouterModule }  from '@angular/router';
import {ReportsAndLogsComponent} from './reports-and-logs.component';
import {ReportsComponent} from './reports/reports.component';
import {AuditLogView} from './audit-log/audit-log.view';

const routes: Routes = [
  {
    path: '',
    component: ReportsAndLogsComponent,
    children: [
      { path: 'reports', component: ReportsComponent },
      { path: 'auditlog', component: AuditLogView },
      // We need a system log viewer here, not sure if there's an endpoint
    ]
  }
];

export const routing = RouterModule.forChild(routes);
