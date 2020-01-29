import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MomentModule} from 'angular2-moment';
import {NgaModule} from '../../theme/nga.module';
import {SharedModule} from 'shared';
import {TranslationModule} from 'shared/translation.module';
import {HypervisorSharedModule} from 'hypervisor/shared/hypervisor-shared.module';
import {ApplicationsSharedModule} from 'applications/shared/applications-shared.module';
import {ReportWizardRegistry} from './report-wizard-registry';
import {ReportWizardComponent} from './report-wizard.component';
import {ConfigurationReportWizardRegistry} from './system/configuration/configuration-report-wizard-registry';
import {ConfigurationReportWizardComponent} from './system/configuration/configuration-report-wizard.component';
import {ConfigurationReportWizardPage1Component} from './system/configuration/page1/configuration-report-wizard-page1.component';
import {ConfigurationReportWizardPage2Component} from './system/configuration/page2/configuration-report-wizard-page2.component';
import {ConfigurationReportWizardPage3Component} from './system/configuration/page3/configuration-report-wizard-page3.component';

import {PostScriptsModule} from 'shared/components/post-scripts/post-scripts.module';
import {ApplicationRestoreService} from 'applications/restore/application-restore.service';
import {HypervisorRestoreService} from 'hypervisor/restore/hypervisor-restore.service';
import {HypervisorBackupService} from 'hypervisor/backup/hypervisor-backup.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MomentModule,
    SharedModule,
    TranslationModule,
    PostScriptsModule,
    HypervisorSharedModule,
    NgaModule,
    ApplicationsSharedModule
  ],
  declarations: [
    ReportWizardComponent,
    ConfigurationReportWizardComponent,

    ConfigurationReportWizardPage1Component,
    ConfigurationReportWizardPage2Component,
    ConfigurationReportWizardPage3Component,

  ],
  providers: [
    ApplicationRestoreService,
    HypervisorRestoreService,
    HypervisorBackupService,
    ConfigurationReportWizardRegistry,

    ReportWizardRegistry
  ],
  exports: [
    ConfigurationReportWizardComponent,
    ConfigurationReportWizardPage1Component,
    ConfigurationReportWizardPage2Component,
    ConfigurationReportWizardPage3Component,

    ReportWizardComponent,

  ],
  entryComponents: [
    ConfigurationReportWizardPage1Component,
    ConfigurationReportWizardPage2Component,
    ConfigurationReportWizardPage3Component,

  ]
})
export class ReportWizardModule {
}
