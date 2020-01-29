import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MomentModule} from 'angular2-moment';
import {NgaModule} from '../theme/nga.module';
import {BsDatepickerModule} from 'ngx-bootstrap';
import {TranslationModule} from 'shared/translation.module';
import {HypervisorSharedModule} from 'app/manage-protection/hypervisor/shared/hypervisor-shared.module';
import {ApplicationsSharedModule} from 'app/manage-protection/applications/shared/applications-shared.module';
import {JobWizardRegistry} from './job-wizard-registry';
import {JobWizardComponent} from './job-wizard.component';

import {PostScriptsModule} from 'shared/components/post-scripts/post-scripts.module';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {HypervisorBackupService} from 'app/manage-protection/hypervisor/backup/hypervisor-backup.service';

import {FileRestoreWizardPage1Component} from './file-restore/page1/file-restore-wizard-page1.component';
import {FileRestoreWizardPage2Component} from './file-restore/page2/file-restore-wizard-page2.component';
import {FileRestoreWizardPage3Component} from './file-restore/page3/file-restore-wizard-page3.component';
import {FileRestoreWizardPage4Component} from './file-restore/page4/file-restore-wizard-page4.component';
import {FileRestoreWizardPage5Component} from './file-restore/page5/file-restore-wizard-page5.component';

import {BackupWizardRegistry} from './on-demand-backup/backup-wizard-registry';
import {BackupWizardComponent} from './on-demand-backup/backup-wizard.component';
import {FileRestoreWizardRegistry} from './file-restore/file-restore-wizard-registry';
import {FileRestoreWizardComponent} from './file-restore/file-restore-wizard.component';
import {SnapshotRestoreWizardRegistry} from './snapshot-restore/snapshot-restore-wizard-registry';
import {SnapshotRestoreWizardComponent} from './snapshot-restore/snapshot-restore-wizard.component';

import {
  SnapshotRestoreHypervSourceComponent,
  SnapshotRestoreHypervSnapshotComponent,
  SnapshotRestoreHypervDestinationComponent,
  SnapshotRestoreHypervDatastoreComponent,
  SnapshotRestoreHypervNetworkComponent,
  SnapshotRestoreHypervRunTypeComponent,
  SnapshotRestoreHypervOptionsComponent,
  SnapshotRestoreHypervScheduleComponent,
  SnapshotRestoreHypervScriptsComponent,
  SnapshotRestoreHypervSummaryComponent,
  SnapshotRestoreHypervRegistry
} from './snapshot-restore/hyperv';

import {
  SnapshotRestoreVmwareSourceComponent,
  SnapshotRestoreVmwareSnapshotComponent,
  SnapshotRestoreVmwareDestinationComponent,
  SnapshotRestoreVmwareDatastoreComponent,
  SnapshotRestoreVmwareNetworkComponent,
  SnapshotRestoreVmwareRunTypeComponent,
  SnapshotRestoreVmwareOptionsComponent,
  SnapshotRestoreVmwareScheduleComponent,
  SnapshotRestoreVmwareScriptsComponent,
  SnapshotRestoreVmwareSummaryComponent,
  SnapshotRestoreVmwareRegistry
} from './snapshot-restore/vmware';

import {
  SnapshotRestoreAwsec2SourceComponent,
  SnapshotRestoreAwsec2SnapshotComponent,
  SnapshotRestoreAwsec2DestinationComponent,
  SnapshotRestoreAwsec2DatastoreComponent,
  SnapshotRestoreAwsec2NetworkComponent,
  SnapshotRestoreAwsec2RunTypeComponent,
  SnapshotRestoreAwsec2OptionsComponent,
  SnapshotRestoreAwsec2ScheduleComponent,
  SnapshotRestoreAwsec2ScriptsComponent,
  SnapshotRestoreAwsec2SummaryComponent,
  SnapshotRestoreAwsec2Registry
} from './snapshot-restore/awsec2';

import {
  SnapshotRestoreDb2DestinationComponent,
  SnapshotRestoreDb2OptionsComponent,
  SnapshotRestoreDb2RunTypeComponent,
  SnapshotRestoreDb2ScheduleComponent,
  SnapshotRestoreDb2ScriptsComponent,
  SnapshotRestoreDb2SnapshotComponent,
  SnapshotRestoreDb2SourceComponent,
  SnapshotRestoreDb2SummaryComponent,
  SnapshotRestoreDb2Registry
} from './snapshot-restore/db2';

import {
  SnapshotRestoreExchDestinationComponent,
  SnapshotRestoreExchOptionsComponent,
  SnapshotRestoreExchRunTypeComponent,
  SnapshotRestoreExchScheduleComponent,
  SnapshotRestoreExchScriptsComponent,
  SnapshotRestoreExchSnapshotComponent,
  SnapshotRestoreExchSourceComponent,
  SnapshotRestoreExchSummaryComponent,
  SnapshotRestoreExchRegistry
} from './snapshot-restore/exch';

import {
  SnapshotRestoreExchOnlineDestinationComponent,
  SnapshotRestoreExchOnlineOptionsComponent,
  SnapshotRestoreExchOnlineRunTypeComponent,
  SnapshotRestoreExchOnlineScheduleComponent,
  SnapshotRestoreExchOnlineScriptsComponent,
  SnapshotRestoreExchOnlineSnapshotComponent,
  SnapshotRestoreExchOnlineSourceComponent,
  SnapshotRestoreExchOnlineSummaryComponent,
  SnapshotRestoreExchOnlineRegistry
} from './snapshot-restore/exchonline';

import {
  SnapshotRestoreMongoDestinationComponent,
  SnapshotRestoreMongoOptionsComponent,
  SnapshotRestoreMongoRunTypeComponent,
  SnapshotRestoreMongoScheduleComponent,
  SnapshotRestoreMongoScriptsComponent,
  SnapshotRestoreMongoSnapshotComponent,
  SnapshotRestoreMongoSourceComponent,
  SnapshotRestoreMongoSummaryComponent,
  SnapshotRestoreMongoRegistry
} from './snapshot-restore/mongo';

import {
  SnapshotRestoreOracleDestinationComponent,
  SnapshotRestoreOracleOptionsComponent,
  SnapshotRestoreOracleRunTypeComponent,
  SnapshotRestoreOracleScheduleComponent,
  SnapshotRestoreOracleScriptsComponent,
  SnapshotRestoreOracleSnapshotComponent,
  SnapshotRestoreOracleSourceComponent,
  SnapshotRestoreOracleSummaryComponent,
  SnapshotRestoreOracleRegistry
} from './snapshot-restore/oracle';

import {
  SnapshotRestoreSqlDestinationComponent,
  SnapshotRestoreSqlOptionsComponent,
  SnapshotRestoreSqlRunTypeComponent,
  SnapshotRestoreSqlScheduleComponent,
  SnapshotRestoreSqlScriptsComponent,
  SnapshotRestoreSqlSnapshotComponent,
  SnapshotRestoreSqlSourceComponent,
  SnapshotRestoreSqlSummaryComponent,
  SnapshotRestoreSqlRegistry
} from './snapshot-restore/sql';

import {
  BackupAwsec2SelectSlaComponent,
  BackupAwsec2SourceComponent,
  BackupAwsec2Registry
} from './on-demand-backup/awsec2';

import {
  BackupHypervSelectSlaComponent,
  BackupHypervSourceComponent,
  BackupHypervRegistry
} from './on-demand-backup/hyperv';

import {
  BackupVmwareSelectSlaComponent,
  BackupVmwareSourceComponent,
  BackupVmwareRegistry
} from './on-demand-backup/vmware';

import {
  BackupOracleSelectSlaComponent,
  BackupOracleSourceComponent,
  BackupOracleRegistry
} from './on-demand-backup/oracle';

import {
  BackupMongoSelectSlaComponent,
  BackupMongoSourceComponent,
  BackupMongoRegistry
} from './on-demand-backup/mongo';

import {
  BackupExchSelectSlaComponent,
  BackupExchSourceComponent,
  BackupExchRegistry
} from './on-demand-backup/exch';

import {
  BackupOffice365SelectSlaComponent,
  BackupOffice365SourceComponent,
  BackupOffice365Registry
} from './on-demand-backup/office365';

import {
  BackupSqlSelectSlaComponent,
  BackupSqlSourceComponent,
  BackupSqlRegistry
} from './on-demand-backup/sql';

import {
  BackupDb2SelectSlaComponent,
  BackupDb2SourceComponent,
  BackupDb2Registry
} from './on-demand-backup/db2';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import { tenantUsernamesComponent } from "./snapshot-restore/exchonline/destination/tenant-usernames/tenant-usernames.component";
import {SlapolicySharedModule} from 'slapolicy/shared/slapolicy-shared.module';
import {SharedModule} from 'shared/shared.module';
import { BackupKubernetesRegistry, BackupKubernetesSourceComponent, BackupKubernetesSelectSlaComponent } from './on-demand-backup/kubernetes';
import { SnapshotRestoreKubernetesSummaryComponent, SnapshotRestoreKubernetesSourceComponent, SnapshotRestoreKubernetesSnapshotComponent, SnapshotRestoreKubernetesDestinationComponent, SnapshotRestoreKubernetesRunTypeComponent, SnapshotRestoreKubernetesOptionsComponent, SnapshotRestoreKubernetesScriptsComponent, SnapshotRestoreKubernetesScheduleComponent, SnapshotRestoreKubernetesRegistry } from './snapshot-restore/kubernetes';
import {
  PolicyAssignmentsWizardComponent
} from 'wizard/policy-assignments/policy-assignments-wizard.component';
import {
  PolicyAssignmentsResourceTypeComponent
} from 'wizard/policy-assignments/resource-type/policy-assignments-resource-type.component';
import {
  PolicyAssignmentsResourcesComponent
} from 'wizard/policy-assignments/resources/policy-assignments-resources.component';
import {PolicyAssignmentsReviewComponent} from 'wizard/policy-assignments/review/policy-assignments-review.component';
import {PolicyAssignmentsWizardRegistry} from 'wizard/policy-assignments/policy-assignments-wizard-registry';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MomentModule,
    SharedModule,
    SlapolicySharedModule,
    TranslationModule,
    PostScriptsModule,
    HypervisorSharedModule,
    NgaModule,
    ApplicationsSharedModule,
    BsDatepickerModule.forRoot()
  ],
  declarations: [
    BackupWizardComponent,
    FileRestoreWizardComponent,
    SnapshotRestoreWizardComponent,
    JobWizardComponent,
    PolicyAssignmentsWizardComponent,

    FileRestoreWizardPage1Component,
    FileRestoreWizardPage2Component,
    FileRestoreWizardPage3Component,
    FileRestoreWizardPage4Component,
    FileRestoreWizardPage5Component,

    BackupVmwareSourceComponent,
    BackupVmwareSelectSlaComponent,

    BackupHypervSourceComponent,
    BackupHypervSelectSlaComponent,

    BackupAwsec2SourceComponent,
    BackupAwsec2SelectSlaComponent,

    BackupOracleSourceComponent,
    BackupOracleSelectSlaComponent,

    BackupKubernetesSourceComponent,
    BackupKubernetesSelectSlaComponent,

    BackupMongoSourceComponent,
    BackupMongoSelectSlaComponent,

    BackupExchSourceComponent,
    BackupExchSelectSlaComponent,

    BackupOffice365SourceComponent,
    BackupOffice365SelectSlaComponent,

    BackupDb2SourceComponent,
    BackupDb2SelectSlaComponent,

    BackupSqlSourceComponent,
    BackupSqlSelectSlaComponent,

    SnapshotRestoreVmwareSummaryComponent,
    SnapshotRestoreVmwareSourceComponent,
    SnapshotRestoreVmwareSnapshotComponent,
    SnapshotRestoreVmwareDestinationComponent,
    SnapshotRestoreVmwareDatastoreComponent,
    SnapshotRestoreVmwareNetworkComponent,
    SnapshotRestoreVmwareRunTypeComponent,
    SnapshotRestoreVmwareOptionsComponent,
    SnapshotRestoreVmwareScriptsComponent,
    SnapshotRestoreVmwareScheduleComponent,

    SnapshotRestoreHypervSummaryComponent,
    SnapshotRestoreHypervSourceComponent,
    SnapshotRestoreHypervSnapshotComponent,
    SnapshotRestoreHypervDestinationComponent,
    SnapshotRestoreHypervDatastoreComponent,
    SnapshotRestoreHypervNetworkComponent,
    SnapshotRestoreHypervRunTypeComponent,
    SnapshotRestoreHypervOptionsComponent,
    SnapshotRestoreHypervScriptsComponent,
    SnapshotRestoreHypervScheduleComponent,

    SnapshotRestoreAwsec2SummaryComponent,
    SnapshotRestoreAwsec2SourceComponent,
    SnapshotRestoreAwsec2SnapshotComponent,
    SnapshotRestoreAwsec2DestinationComponent,
    SnapshotRestoreAwsec2DatastoreComponent,
    SnapshotRestoreAwsec2NetworkComponent,
    SnapshotRestoreAwsec2RunTypeComponent,
    SnapshotRestoreAwsec2OptionsComponent,
    SnapshotRestoreAwsec2ScriptsComponent,
    SnapshotRestoreAwsec2ScheduleComponent,

    SnapshotRestoreOracleSummaryComponent,
    SnapshotRestoreOracleSourceComponent,
    SnapshotRestoreOracleSnapshotComponent,
    SnapshotRestoreOracleDestinationComponent,
    SnapshotRestoreOracleRunTypeComponent,
    SnapshotRestoreOracleOptionsComponent,
    SnapshotRestoreOracleScriptsComponent,
    SnapshotRestoreOracleScheduleComponent,

    SnapshotRestoreKubernetesSummaryComponent,
    SnapshotRestoreKubernetesSourceComponent,
    SnapshotRestoreKubernetesSnapshotComponent,
    SnapshotRestoreKubernetesDestinationComponent,
    SnapshotRestoreKubernetesRunTypeComponent,
    SnapshotRestoreKubernetesOptionsComponent,
    SnapshotRestoreKubernetesScriptsComponent,
    SnapshotRestoreKubernetesScheduleComponent,

    SnapshotRestoreMongoSummaryComponent,
    SnapshotRestoreMongoSourceComponent,
    SnapshotRestoreMongoSnapshotComponent,
    SnapshotRestoreMongoDestinationComponent,
    SnapshotRestoreMongoRunTypeComponent,
    SnapshotRestoreMongoOptionsComponent,
    SnapshotRestoreMongoScriptsComponent,
    SnapshotRestoreMongoScheduleComponent,

    SnapshotRestoreSqlSummaryComponent,
    SnapshotRestoreSqlSourceComponent,
    SnapshotRestoreSqlSnapshotComponent,
    SnapshotRestoreSqlDestinationComponent,
    SnapshotRestoreSqlRunTypeComponent,
    SnapshotRestoreSqlOptionsComponent,
    SnapshotRestoreSqlScriptsComponent,
    SnapshotRestoreSqlScheduleComponent,

    SnapshotRestoreDb2SummaryComponent,
    SnapshotRestoreDb2SourceComponent,
    SnapshotRestoreDb2SnapshotComponent,
    SnapshotRestoreDb2DestinationComponent,
    SnapshotRestoreDb2RunTypeComponent,
    SnapshotRestoreDb2OptionsComponent,
    SnapshotRestoreDb2ScriptsComponent,
    SnapshotRestoreDb2ScheduleComponent,

    SnapshotRestoreExchSummaryComponent,
    SnapshotRestoreExchSourceComponent,
    SnapshotRestoreExchSnapshotComponent,
    SnapshotRestoreExchDestinationComponent,
    SnapshotRestoreExchRunTypeComponent,
    SnapshotRestoreExchOptionsComponent,
    SnapshotRestoreExchScriptsComponent,
    SnapshotRestoreExchScheduleComponent,

    SnapshotRestoreExchOnlineSummaryComponent,
    SnapshotRestoreExchOnlineSourceComponent,
    SnapshotRestoreExchOnlineSnapshotComponent,
    SnapshotRestoreExchOnlineDestinationComponent,
    tenantUsernamesComponent,
    SnapshotRestoreExchOnlineRunTypeComponent,
    SnapshotRestoreExchOnlineOptionsComponent,
    SnapshotRestoreExchOnlineScriptsComponent,
    SnapshotRestoreExchOnlineScheduleComponent,

    PolicyAssignmentsResourceTypeComponent,
    PolicyAssignmentsResourcesComponent,
    PolicyAssignmentsReviewComponent
  ],
  providers: [
    ApplicationRestoreService,
    HypervisorRestoreService,
    HypervisorBackupService,
    ApplicationBackupService,
    BackupWizardRegistry,
    BackupVmwareRegistry,
    BackupHypervRegistry,
    BackupAwsec2Registry,
    BackupOracleRegistry,
    BackupKubernetesRegistry,
    BackupMongoRegistry,
    BackupExchRegistry,
    BackupOffice365Registry,
    BackupDb2Registry,
    BackupSqlRegistry,
    FileRestoreWizardRegistry,
    SnapshotRestoreWizardRegistry,
    SnapshotRestoreVmwareRegistry,
    SnapshotRestoreHypervRegistry,
    SnapshotRestoreAwsec2Registry,
    SnapshotRestoreOracleRegistry,
    SnapshotRestoreKubernetesRegistry,
    SnapshotRestoreMongoRegistry,
    SnapshotRestoreSqlRegistry,
    SnapshotRestoreDb2Registry,
    SnapshotRestoreExchRegistry,
    SnapshotRestoreExchOnlineRegistry,
    PolicyAssignmentsWizardRegistry,
    JobWizardRegistry
  ],
  exports: [
    BackupWizardComponent,
    FileRestoreWizardComponent,
    SnapshotRestoreWizardComponent,
    JobWizardComponent,
    PolicyAssignmentsWizardComponent
  ],
  entryComponents: [
    BackupVmwareSourceComponent,
    BackupVmwareSelectSlaComponent,

    BackupHypervSourceComponent,
    BackupHypervSelectSlaComponent,

    BackupAwsec2SourceComponent,
    BackupAwsec2SelectSlaComponent,

    BackupOracleSourceComponent,
    BackupOracleSelectSlaComponent,

    BackupKubernetesSourceComponent,
    BackupKubernetesSelectSlaComponent,

    BackupMongoSourceComponent,
    BackupMongoSelectSlaComponent,

    BackupExchSourceComponent,
    BackupExchSelectSlaComponent,

    BackupOffice365SourceComponent,
    BackupOffice365SelectSlaComponent,

    BackupDb2SourceComponent,
    BackupDb2SelectSlaComponent,

    BackupSqlSourceComponent,
    BackupSqlSelectSlaComponent,

    FileRestoreWizardPage1Component,
    FileRestoreWizardPage2Component,
    FileRestoreWizardPage3Component,
    FileRestoreWizardPage4Component,
    FileRestoreWizardPage5Component,

    SnapshotRestoreVmwareSummaryComponent,
    SnapshotRestoreVmwareSourceComponent,
    SnapshotRestoreVmwareSnapshotComponent,
    SnapshotRestoreVmwareDestinationComponent,
    SnapshotRestoreVmwareDatastoreComponent,
    SnapshotRestoreVmwareNetworkComponent,
    SnapshotRestoreVmwareRunTypeComponent,
    SnapshotRestoreVmwareOptionsComponent,
    SnapshotRestoreVmwareScriptsComponent,
    SnapshotRestoreVmwareScheduleComponent,

    SnapshotRestoreHypervSummaryComponent,
    SnapshotRestoreHypervSourceComponent,
    SnapshotRestoreHypervSnapshotComponent,
    SnapshotRestoreHypervDestinationComponent,
    SnapshotRestoreHypervDatastoreComponent,
    SnapshotRestoreHypervNetworkComponent,
    SnapshotRestoreHypervRunTypeComponent,
    SnapshotRestoreHypervOptionsComponent,
    SnapshotRestoreHypervScriptsComponent,
    SnapshotRestoreHypervScheduleComponent,

    SnapshotRestoreAwsec2SummaryComponent,
    SnapshotRestoreAwsec2SourceComponent,
    SnapshotRestoreAwsec2SnapshotComponent,
    SnapshotRestoreAwsec2DestinationComponent,
    SnapshotRestoreAwsec2DatastoreComponent,
    SnapshotRestoreAwsec2NetworkComponent,
    SnapshotRestoreAwsec2RunTypeComponent,
    SnapshotRestoreAwsec2OptionsComponent,
    SnapshotRestoreAwsec2ScriptsComponent,
    SnapshotRestoreAwsec2ScheduleComponent,

    SnapshotRestoreOracleSummaryComponent,
    SnapshotRestoreOracleSourceComponent,
    SnapshotRestoreOracleSnapshotComponent,
    SnapshotRestoreOracleDestinationComponent,
    SnapshotRestoreOracleRunTypeComponent,
    SnapshotRestoreOracleOptionsComponent,
    SnapshotRestoreOracleScriptsComponent,
    SnapshotRestoreOracleScheduleComponent,

    SnapshotRestoreKubernetesSummaryComponent,
    SnapshotRestoreKubernetesSourceComponent,
    SnapshotRestoreKubernetesSnapshotComponent,
    SnapshotRestoreKubernetesDestinationComponent,
    SnapshotRestoreKubernetesRunTypeComponent,
    SnapshotRestoreKubernetesOptionsComponent,
    SnapshotRestoreKubernetesScriptsComponent,
    SnapshotRestoreKubernetesScheduleComponent,

    SnapshotRestoreMongoSummaryComponent,
    SnapshotRestoreMongoSourceComponent,
    SnapshotRestoreMongoSnapshotComponent,
    SnapshotRestoreMongoDestinationComponent,
    SnapshotRestoreMongoRunTypeComponent,
    SnapshotRestoreMongoOptionsComponent,
    SnapshotRestoreMongoScriptsComponent,
    SnapshotRestoreMongoScheduleComponent,

    SnapshotRestoreSqlSummaryComponent,
    SnapshotRestoreSqlSourceComponent,
    SnapshotRestoreSqlSnapshotComponent,
    SnapshotRestoreSqlDestinationComponent,
    SnapshotRestoreSqlRunTypeComponent,
    SnapshotRestoreSqlOptionsComponent,
    SnapshotRestoreSqlScriptsComponent,
    SnapshotRestoreSqlScheduleComponent,

    SnapshotRestoreDb2SummaryComponent,
    SnapshotRestoreDb2SourceComponent,
    SnapshotRestoreDb2SnapshotComponent,
    SnapshotRestoreDb2DestinationComponent,
    SnapshotRestoreDb2RunTypeComponent,
    SnapshotRestoreDb2OptionsComponent,
    SnapshotRestoreDb2ScriptsComponent,
    SnapshotRestoreDb2ScheduleComponent,

    SnapshotRestoreExchSummaryComponent,
    SnapshotRestoreExchSourceComponent,
    SnapshotRestoreExchSnapshotComponent,
    SnapshotRestoreExchDestinationComponent,
    SnapshotRestoreExchRunTypeComponent,
    SnapshotRestoreExchOptionsComponent,
    SnapshotRestoreExchScriptsComponent,
    SnapshotRestoreExchScheduleComponent,

    SnapshotRestoreExchOnlineSummaryComponent,
    SnapshotRestoreExchOnlineSourceComponent,
    SnapshotRestoreExchOnlineSnapshotComponent,
    SnapshotRestoreExchOnlineDestinationComponent,
    SnapshotRestoreExchOnlineRunTypeComponent,
    SnapshotRestoreExchOnlineOptionsComponent,
    SnapshotRestoreExchOnlineScriptsComponent,
    SnapshotRestoreExchOnlineScheduleComponent,
    tenantUsernamesComponent,

    PolicyAssignmentsResourceTypeComponent,
    PolicyAssignmentsResourcesComponent,
    PolicyAssignmentsReviewComponent
  ]
})
export class JobWizardModule {
}
