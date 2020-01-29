import { Routes, RouterModule }  from '@angular/router';
import { VadpProxyMonitorComponent } from './vadp-proxy-monitor.component';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: VadpProxyMonitorComponent,
    children: [ ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
