import { Routes, RouterModule }  from '@angular/router';
import { MonitorComponent } from './monitor/monitor.component';

const routes: Routes = [
  {
    path: '',
    component: MonitorComponent,
  }
];

export const routing = RouterModule.forChild(routes);
