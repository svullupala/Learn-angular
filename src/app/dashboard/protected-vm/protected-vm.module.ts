import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {NgaModule} from 'theme/nga.module';
import {DashboardSharedModule} from '../shared/dashboard-shared.module';
import {ProtectedVmComponent} from './protected-vm.component';

@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    DashboardSharedModule
  ],
  declarations: [
    ProtectedVmComponent
  ],
  providers: [ ],
  exports: [
    ProtectedVmComponent
  ]
})
export class ProtectedVmModule {}
