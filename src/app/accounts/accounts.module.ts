import {NgModule} from '@angular/core';
import {Accounts} from './accounts.component';
import {routing} from './accounts.routing';
import {UsersModule} from './users/users.module';
import {RolesModule} from './roles/roles.module';
import {ResourceGroupsModule} from './resource-groups/resource-groups.module';
import {IdentitiesModule} from './identities/identities.module';

@NgModule({
  imports: [
    routing,
    UsersModule,
    RolesModule,
    ResourceGroupsModule,
    IdentitiesModule
  ],
  declarations: [
    Accounts
  ],
  providers: [
  ],
  exports: []
})
export class AccountsModule {
}

