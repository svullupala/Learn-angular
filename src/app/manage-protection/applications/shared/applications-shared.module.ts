import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgaModule} from 'theme/nga.module';
import {MomentModule} from 'angular2-moment';
import {ApplicationService} from '../shared/application.service';
import {DbBackupTableComponent} from '../backup/db-backup-table/db-backup-table.component';
import {BsDatepickerModule, BsDropdownModule, ModalModule, TimepickerModule, TooltipModule} from 'ngx-bootstrap';
import {SharedModule} from 'shared';
import {TranslateModule} from '@ngx-translate/core';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {JobSharedModule} from 'job/shared/job-shared.module';
import {ApplicationRestoreService} from '../restore/application-restore.service';
import {
  ApplicationDestinationTableComponent
}
  from '../restore/application-destination-table/application-destination-table.component';
import {ApplicationPSTOptionsComponent} from '../restore/application-pst-options/application-pst-options.component';
import {PostScriptsModule} from 'shared/components/post-scripts/post-scripts.module';
import {
  ApplicationMappingTableComponent
}
  from '../restore/application-mapping-table/application-mapping-table.component';
import {DateTimePickerComponent} from '../shared/date-time-picker/date-time-picker.component';
import {ApplicationPitComponent} from '../restore/application-pit/application-pit.component';
import {ApplicationOptionsComponent} from '../restore/application-options/application-options.component';
import {
  ApplicationBackupOptionsComponent
} from 'applications/backup/application-backup-options/application-backup-options.component';
import {
  ApplicationBackupOptionsService
} from 'applications/backup/application-backup-options/application-backup-options.service';
import {ApplicationOptionsService} from 'applications/restore/application-options/application-options.service';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {Db2BackupOptionsComponent} from 'applications/backup/db2-backup-options/db2-backup-options.component';
import {ExchBackupOptionsComponent} from 'applications/backup/exch-backup-options/exch-backup-options.component';
import {ExchOnlineBackupOptionsComponent} from 'applications/backup/exchonline-backup-options/exchonline-backup-options.component';
import {MongoBackupOptionsComponent} from 'applications/backup/mongo-backup-options/mongo-backup-options.component';
import {OracleBackupOptionsComponent} from 'applications/backup/oracle-backup-options/oracle-backup-options.component';
import {SqlBackupOptionsComponent} from 'applications/backup/sql-backup-options/sql-backup-options.component';
import {Db2RestoreOptionsComponent} from 'applications/restore/db2-restore-options/db2-restore-options.component';
import {
  OracleRestoreOptionsComponent
} from 'applications/restore/oracle-restore-options/oracle-restore-options.component';
import {ExchRestoreOptionsComponent} from 'applications/restore/exch-restore-options/exch-restore-options.component';
import {SqlRestoreOptionsComponent} from 'applications/restore/sql-restore-options/sql-restore-options.component';
import {MongoRestoreOptionsComponent} from 'applications/restore/mongo-restore-options/mongo-restore-options.component';
import {ApplicationRestoreSourceTableComponent}
  from 'applications/restore/application-restore-source-table/application-restore-source-table.component';
import {ApplicationRestoreSelectionTableComponent}
  from 'applications/restore/application-restore-selection-table/application-restore-selection-table.component';
import {PartitionDisplayPipe} from './partition-display.pipe';
import {ApplicationBackupSourceTableComponent}
  from 'applications/backup/application-backup-source-table/application-backup-source-table.component';
import {ApplicationBackupSelectionTableComponent}
  from 'applications/backup/application-backup-selection-table/application-backup-selection-table.component';
import { from } from 'rxjs/observable/from';
import { ExchonlineRestoreOptionsComponent } from 'applications/restore/exchonline-restore-options/exchonline-restore-options.component';
import {ApplicationSingleSourceSnapshotSelectionComponent} from 'applications/restore/application-single-source-snapshot-selection/application-single-source-snapshot-selection.component';
import { KubernetesBackupOptionsComponent } from 'applications/backup/kubernetes-backup-options/kubernetes-backup-options.component';
import { TagModule } from '@carbon/icons-angular/lib/tag';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    MomentModule,
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    TooltipModule.forRoot(),
    SharedModule,
    TranslateModule,
    AngularMultiSelectModule,
    JobSharedModule,
    IdentitySharedModule,
    PostScriptsModule,
    ReactiveFormsModule,
    TagModule
  ],
  declarations: [
    DbBackupTableComponent,
    ApplicationOptionsComponent,
    ApplicationDestinationTableComponent,
    ApplicationPSTOptionsComponent,
    ApplicationMappingTableComponent,
    ApplicationPitComponent,
    ApplicationBackupOptionsComponent,
    Db2BackupOptionsComponent,
    ExchBackupOptionsComponent,
    ExchOnlineBackupOptionsComponent,
    MongoBackupOptionsComponent,
    OracleBackupOptionsComponent,
    KubernetesBackupOptionsComponent,
    SqlBackupOptionsComponent,
    Db2RestoreOptionsComponent,
    OracleRestoreOptionsComponent,
    ExchRestoreOptionsComponent,
    ExchonlineRestoreOptionsComponent,
    SqlRestoreOptionsComponent,
    MongoRestoreOptionsComponent,
    ApplicationRestoreSourceTableComponent,
    ApplicationRestoreSelectionTableComponent,
    ApplicationSingleSourceSnapshotSelectionComponent,
    PartitionDisplayPipe,
    ApplicationBackupSourceTableComponent,
    ApplicationBackupSelectionTableComponent
  ],
  providers: [
    ApplicationService,
    ApplicationRestoreService,
    ApplicationBackupOptionsService,
    ApplicationOptionsService
  ],
  exports: [
    DbBackupTableComponent,
    ApplicationBackupOptionsComponent,
    ApplicationDestinationTableComponent,
    ApplicationMappingTableComponent,
    ApplicationPitComponent,
    ApplicationPSTOptionsComponent,
    ApplicationOptionsComponent,
    ApplicationRestoreSourceTableComponent,
    ApplicationRestoreSelectionTableComponent,
    ApplicationSingleSourceSnapshotSelectionComponent,
    ApplicationBackupSourceTableComponent,
    PartitionDisplayPipe,
    ApplicationBackupSelectionTableComponent
  ],
  entryComponents: [
    Db2BackupOptionsComponent,
    ExchBackupOptionsComponent,
    ExchOnlineBackupOptionsComponent,
    MongoBackupOptionsComponent,
    OracleBackupOptionsComponent,
    KubernetesBackupOptionsComponent,
    SqlBackupOptionsComponent,
    Db2RestoreOptionsComponent,
    OracleRestoreOptionsComponent,
    ExchRestoreOptionsComponent,
    ExchonlineRestoreOptionsComponent,
    SqlRestoreOptionsComponent,
    MongoRestoreOptionsComponent,
    ApplicationRestoreSourceTableComponent,
    ApplicationRestoreSelectionTableComponent,
    ApplicationBackupSourceTableComponent,
    ApplicationBackupSelectionTableComponent
  ]
})
export class ApplicationsSharedModule {
}
