import { Routes, RouterModule }  from '@angular/router';

import {Hypervisor} from './hypervisor.component';
import {HypervisorBackupComponent} from './backup';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Hypervisor,
    children: [
      { path: 'vmware', component: HypervisorBackupComponent,
        data: { hypervisorType: 'vmware', cardTitle: 'vmware.textVMwareBackup'} },
      { path: 'hyperv', component: HypervisorBackupComponent,
        data: { hypervisorType: 'hyperv', cardTitle: 'hyperv.textHypervBackup'} },
        { path: 'awsec2', component: HypervisorBackupComponent,
        data: { hypervisorType: 'awsec2', cardTitle: 'awsec2.textAWSEC2Backup'} }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
