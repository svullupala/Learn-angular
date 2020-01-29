import { Routes, RouterModule }  from '@angular/router';

import { ModuleWithProviders } from '@angular/core';
import {DashboardNew} from './dashboard-new.component';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DashboardNew
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
