import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {MomentModule} from 'angular2-moment';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule} from 'shared';
import {PermissionGroupsModule} from '../permission-groups/permission-groups.module';
import {RolesComponent} from './roles.component';
import {RoleTableComponent} from './role-table/role-table.component';
import {RoleEditComponent} from './role-edit/role-edit.component';
import {RoleDetailsComponent} from './role-details/role-details.component';
import {RoleViewComponent} from './role-view/role-view.component';

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
    RolesComponent,
    RoleTableComponent,
    RoleEditComponent,
    RoleDetailsComponent,
    RoleViewComponent
  ],
  providers: [],
  exports: [
  ]
})
export class RolesModule {
}
