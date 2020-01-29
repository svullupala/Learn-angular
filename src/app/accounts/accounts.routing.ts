import { Routes, RouterModule }  from '@angular/router';

import {Accounts} from './accounts.component';
import {UsersComponent} from './users/users.component';
import {RolesComponent} from './roles/roles.component';
import {ResourceGroupsComponent} from './resource-groups/resource-groups.component';
import {IdentitiesComponent} from './identities/identities.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Accounts,
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'roles', component: RolesComponent},
      { path: 'resourcegroups', component: ResourceGroupsComponent },
      { path: 'identities', component: IdentitiesComponent }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
