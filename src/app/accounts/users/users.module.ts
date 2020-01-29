import {NgModule}      from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {MomentModule} from 'angular2-moment';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule } from 'shared';
import {UsersComponent} from './users.component';
import {UserTableComponent} from './user-table/user-table.component';
import {UserEditComponent} from './user-edit/user-edit.component';
import {UserDetailsComponent} from './user-details/user-details.component';
import {UserViewComponent} from './user-view/user-view.component';
import {UserEditSettingComponent} from './user-edit-setting/user-edit-setting.component';
import {UserEditResourceComponent} from './user-edit-resource/user-edit-resource.component';
import {PermissionGroupsModule} from '../permission-groups/permission-groups.module';
import {UserSelectedResourcesComponent} from './user-selected-resources/user-selected-resources.component';
import {UserAssignResourceComponent} from './user-assign-resource/user-assign-resource.component';
import {UserResourcesComponent} from './user-resources/user-resources.component';
import { LdapTableComponent } from './user-edit-setting/ldap-table/ldap-table.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule.forRoot(),
    PopoverModule.forRoot(),
    MomentModule,
    NgaModule,
    TranslationModule,
    SharedModule,
    PermissionGroupsModule
  ],
  declarations: [
    UsersComponent,
    UserTableComponent,
    UserEditComponent,
    UserDetailsComponent,
    UserViewComponent,
    UserEditSettingComponent,
    UserEditResourceComponent,
    UserSelectedResourcesComponent,
    UserAssignResourceComponent,
    UserResourcesComponent,
    LdapTableComponent
  ],
  providers: [
  ],
  exports: [ ]
})
export class UsersModule {
}
