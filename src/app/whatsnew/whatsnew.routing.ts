import { Routes, RouterModule }  from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { WhatsNewComponent } from './whatsnew.component';

export const routes: Routes = [
  {
    path: '',
    component: WhatsNewComponent
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
