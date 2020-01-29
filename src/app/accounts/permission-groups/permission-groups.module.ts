import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MomentModule} from 'angular2-moment';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule, SharedModule} from 'shared';
import {PermissionGroupSelectComponent} from './permission-group-select/permission-group-select.component';
import {PermissionRoleComponent} from './permission-role/permission-role.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule.forRoot(),
    MomentModule,
    NgaModule,
    TranslationModule,
    SharedModule
  ],
  declarations: [
    PermissionGroupSelectComponent,
    PermissionRoleComponent
  ],
  providers: [],
  exports: [PermissionGroupSelectComponent, PermissionRoleComponent]
})
export class PermissionGroupsModule {
}
