import {Routes, RouterModule}  from '@angular/router';

import {LogoutComponent} from './logout.component';
import {ModuleWithProviders} from '@angular/core';

export const routes: Routes = [
  {
    path: '',
    component: LogoutComponent
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
