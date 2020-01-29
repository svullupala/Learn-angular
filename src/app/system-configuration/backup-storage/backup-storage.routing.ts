import { Routes, RouterModule }  from '@angular/router';
import {DiskStorageComponent} from 'diskstorage/disk-storage.component';
import { CloudComponent } from './cloud/cloud.component';
import { RepositoryServerComponent } from './repository-server/repository-server.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'disk', component: DiskStorageComponent},
      { path: 'cloud', component: CloudComponent},
      { path: 'repository', component: RepositoryServerComponent}
    ]
  }
];

export const routing = RouterModule.forChild(routes);
