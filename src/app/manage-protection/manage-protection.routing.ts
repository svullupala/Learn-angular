import { Routes, RouterModule }  from '@angular/router';
import {ManageProtectionComponent} from './manage-protection.component';
import {SlapolicyComponent} from './slapolicy/slapolicy.component';
import {CatalogSearchComponent} from './catalog/search/catalog-search.component';
import {CatalogResourceComponent} from './catalog/resource/catalog-resource.component';
import {CatalogBackupComponent} from './catalog/backup/catalog-backup.component';
import {CatalogRestoreComponent} from './catalog/restore/catalog-restore.component';
import {CatalogManageComponent} from './catalog/manage/catalog-manage.component';
import {FileRestoreComponent} from './file-restore/file-restore.component';
import {ManageHypervisorsComponent} from './manage-hypervisors';
import {ManageApplicationsComponent} from './manage-applications';

const routes: Routes = [
  {
    path: '',
    component: ManageProtectionComponent,
    children: [
      { path: 'policyoverview', component: SlapolicyComponent },
      { path: 'filerestore', component: FileRestoreComponent },
      { path: 'hypervisor',
        loadChildren: 'app/manage-protection/hypervisor/hypervisor.module#HypervisorModule' },
      { path: 'virtsystems',
        loadChildren: 'app/manage-protection/hypervisor/hypervisor.module#HypervisorModule' },
      { path: 'applications',
        loadChildren: 'app/manage-protection/applications/applications.module#ApplicationsModule' },
      { path: 'databases',
        loadChildren: 'app/manage-protection/applications/applications.module#ApplicationsModule' },
      { path: 'cloud',
        loadChildren: 'app/manage-protection/applications/applications.module#ApplicationsModule' },
      { path: 'containers',
        loadChildren: 'app/manage-protection/applications/applications.module#ApplicationsModule' },
      { path: 'spectrum/manage', component: CatalogManageComponent },
      { path: 'spectrum/backup', component: CatalogBackupComponent },
      { path: 'spectrum/restore', component: CatalogRestoreComponent },
      { path: 'manage-hypervisors', component: ManageHypervisorsComponent },
      { path: 'manage-applications', component: ManageApplicationsComponent }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
