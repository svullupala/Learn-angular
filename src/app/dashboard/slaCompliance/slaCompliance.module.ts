import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {NgaModule} from 'theme/nga.module';
import {DashboardSharedModule} from '../shared/dashboard-shared.module';
import {SlaComplianceComponent} from './slaCompliance.component';

@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    DashboardSharedModule
  ],
  declarations: [
    SlaComplianceComponent
  ],
  providers: [ ],
  exports: [
    SlaComplianceComponent
  ]
})
export class SlaComplianceModule {}
