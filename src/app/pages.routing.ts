import { Routes, RouterModule }  from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { Pages } from './pages.component';
import { AuthGuard }      from './login/auth-guard.service';

// noinspection TypeScriptValidateTypes

// export function loadChildren(path) { return System.import(path); };

/*
NOTE: There is an RBAC check that is performed prior to navigation.  The RBAC path is defined in 
pages.menu.ts.  If a page is added with no RBAC path, you must add it to the skipRbacCheck() code
in login/auth-guard.service.ts.
*/

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: 'app/login/login.module#LoginModule'
  },
  {
    path: 'pages',
    component: Pages,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: 'app/dashboard/dashboard.module#DashboardModule' },
      { path: 'logout', loadChildren: 'app/logout/logout.module#LogoutModule'},
      { path: 'whatsnew', loadChildren: 'app/whatsnew/whatsnew.module#WhatsNewModule' },
      { path: 'jobsandoperations',
        loadChildren: 'app/jobs-and-operations/jobs-and-operations.module#JobsAndOperationsModule'},
      { path: 'manageprotection',
        loadChildren: 'app/manage-protection/manage-protection.module#ManageProtectionModule'},
      { path: 'systemconfiguration',
        loadChildren: 'app/system-configuration/system-configuration.module#SystemConfigurationModule'},
      { path: 'reportsandlogs',
        loadChildren: 'app/reports-and-logs/reports-and-logs.module#ReportsAndLogsModule'},
      { path: 'accounts', loadChildren: 'app/accounts/accounts.module#AccountsModule'}
    ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
