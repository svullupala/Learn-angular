import {CommonModule} from '@angular/common';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {MomentModule} from 'angular2-moment';
import {BsDropdownModule, ModalModule} from 'ngx-bootstrap';
import {NgaModule} from '../../../theme/nga.module';
import {VmwareBackupOptionsComponent} from 'hypervisor/backup/vmware-backup-options/vmware-backup-options.component';
import {SubnetComponent} from 'hypervisor/restore/subnet/subnet.component';
import {HypervisorManageService} from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import {HypervisorManageComponent} from 'hypervisor/shared/hypervisor-manage';
import {HypervisorBackupOptionsComponent}
  from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options.component';
import {HypervisorBackupOptionsService}
  from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options.service';
import {DatastoreComponent} from 'hypervisor/restore/datastore/datastore.component';
import {SiteService} from 'site/site.service';
import {SharedModule} from 'shared/shared.module';
import {VmRecoveryPointsService} from 'hypervisor/shared/vmrecoverypoints.service';
import {RefreshButtonModule} from 'shared/components/refresh-button/refresh-button.module';
import {
  HypervisorBackupSelectionTableComponent,
  HypervisorBackupSourceTableComponent,
  VmselectbackupTableComponent
} from 'hypervisor/backup';
import {SubnetListTableComponent} from 'hypervisor/restore/subnet/subnet-list-table/subnet-list-table.component';
import {HypervisorRestoreService} from 'hypervisor/restore/hypervisor-restore.service';
import {HypervBackupOptionsComponent} from 'hypervisor/backup/hyperv-backup-options/hyperv-backup-options.component';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {JobSharedModule} from 'job/shared/job-shared.module';
import {PostScriptsModule} from 'shared/components/post-scripts/post-scripts.module';
import {TranslationModule} from 'shared/translation.module';
import {HypervisorBrowseService} from 'hypervisor/shared/hypervisor-browse.service';
import {VdiskComponent} from 'hypervisor/restore/vdisk/vdisk.component';
import {HostClusterTableComponent} from 'hypervisor/restore/host-cluster-table/host-cluster-table.component';
import {VirtualNetworkComponent} from 'hypervisor/restore/networks/networks.component';
import {HypervisorRestoreSelectionTableComponent} from 'hypervisor/restore/hypervisor-restore-selection-table';
import {HypervisorRestoreSourceTableComponent} from 'hypervisor/restore/hypervisor-restore-source-table';
import {HypervisorSingleSourceSnapshotSelectionComponent} from 'hypervisor/restore/hypervisor-single-source-snapshot-selection/hypervisor-single-source-snapshot-selection.component';
import {CloudModule} from 'cloud/cloud.module';
import {HypervisorTableComponent} from 'hypervisor/shared/hypervisor-table/hypervisor-table.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PostScriptsModule,
    NgaModule,
    TranslationModule,
    MomentModule,
    SharedModule,
    JobSharedModule,
    RefreshButtonModule,
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    AngularMultiSelectModule,
    IdentitySharedModule,
    CloudModule
  ],
  declarations: [
    HypervisorManageComponent,
    HypervisorTableComponent,
    HypervisorBackupOptionsComponent,
    HypervBackupOptionsComponent,
    VmwareBackupOptionsComponent,
    DatastoreComponent,
    VmselectbackupTableComponent,
    HypervisorBackupSourceTableComponent,
    HypervisorBackupSelectionTableComponent,
    HostClusterTableComponent,
    SubnetComponent,
    SubnetListTableComponent,
    VirtualNetworkComponent,
    VdiskComponent, HypervisorRestoreSelectionTableComponent,
    HypervisorSingleSourceSnapshotSelectionComponent,
    HypervisorRestoreSourceTableComponent
  ],
  providers: [
    HypervisorManageService,
    HypervisorRestoreService,
    HypervisorBrowseService,
    VmRecoveryPointsService,
    SiteService,
    HypervisorBackupOptionsService
  ],
  exports: [
    HypervisorManageComponent,
    HypervisorTableComponent,
    HypervisorBackupOptionsComponent,
    VmselectbackupTableComponent,
    HypervisorBackupSourceTableComponent,
    HypervisorBackupSelectionTableComponent,
    HostClusterTableComponent, HypervisorRestoreSelectionTableComponent,
    HypervisorSingleSourceSnapshotSelectionComponent,
    HypervisorRestoreSourceTableComponent,
    VdiskComponent,
    DatastoreComponent, VirtualNetworkComponent
  ],
  entryComponents: [
    HypervBackupOptionsComponent,
    VmwareBackupOptionsComponent
  ]
})
export class HypervisorSharedModule {
}
