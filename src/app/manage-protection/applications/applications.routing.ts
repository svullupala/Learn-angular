import { Routes, RouterModule }  from '@angular/router';

import { Applications } from './applications.component';
import { ApplicationBackupComponent } from './backup/application-backup.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Applications,
    children: [
      { path: 'sql', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textSqlBackup'} },
      { path: 'oracle', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textOracleBackup'} },
      { path: 'db2', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textDb2Backup'} },
      { path: 'exch', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textExchangeBackup'} },
      { path: 'office365', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textExchangeOnlineBackup'} },
      { path: 'mongo', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textMongoDbBackup'} },
      { path: 'k8s', component: ApplicationBackupComponent,
        data: { cardTitle: 'application.textKubernetesBackup'} }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
