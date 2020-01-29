import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {LoaderModule} from 'shared/components/loader/loader.module';
import {NgaModule} from '../../theme/nga.module';
import {TranslationModule} from 'shared/translation.module';
import {MonitorComponent} from './monitor.component';
import {MonitorSharedModule} from './shared/monitor-shared.module';
import {SystemInfoModule} from 'shared/components/system-info/system-info.module';
import {JobSharedModule} from 'job/shared/job-shared.module';
import {MonitorSharedService} from './monitor-shared.service';
import {SharedModule} from 'shared';
import {FormsModule} from '@angular/forms';
import {JobWizardModule} from 'wizard/job-wizard.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    LoaderModule,
    NgaModule,
    SharedModule,
    JobSharedModule,
    MonitorSharedModule,
    SystemInfoModule,
    TranslationModule,
    JobWizardModule
  ],
  declarations: [
    MonitorComponent
  ],
  providers: [
    MonitorSharedService
  ],
  exports: [JobWizardModule]
})
export class MonitorModule {
}
