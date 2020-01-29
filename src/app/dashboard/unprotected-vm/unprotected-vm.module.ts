import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {NgaModule} from 'theme/nga.module';
import {DashboardSharedModule} from '../shared/dashboard-shared.module';
import {UnprotectedVmComponent} from './unprotected-vm.component';

@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    DashboardSharedModule
  ],
  declarations: [
    UnprotectedVmComponent
  ],
  providers: [

  ],
  exports: [
    UnprotectedVmComponent
  ]
})
export class UnprotectedVmModule {}
