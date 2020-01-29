import {NgModule} from '@angular/core';
import {NgaModule} from 'theme/nga.module';
import {SharedModule, TranslationModule} from 'shared';
import {HypervisorManageService} from './shared/hypervisor-manage/hypervisor-manage.service';
import {VmRecoveryPointsService} from './shared/vmrecoverypoints.service';
import {VmRecoveryPoints} from './vmware/vmrecoverypoints.service';
import {HypervisorRestoreService} from './restore/hypervisor-restore.service';
import {SiteService} from 'site/site.service';
import {routing} from './hypervisor.routing';
import {Hypervisor} from './hypervisor.component';
import {HypervisorBrowseService} from './shared/hypervisor-browse.service';
// import {VmwareBackupOptionsComponent} from 'hypervisor/backup/vmware-backup-options/vmware-backup-options.component';
// import {HypervBackupOptionsComponent} from 'hypervisor/backup/hyperv-backup-options/hyperv-backup-options.component';
// import {HypervisorBackupOptionsService}
//   from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options.service';
// import {HypervRestoreOptionsComponent}
//   from 'hypervisor/restore/hyperv-restore-options/hyperv-restore-options.component';
// import {VmwareRestoreOptionsComponent}
//   from 'hypervisor/restore/vmware-restore-options/vmware-restore-options.component';
// import {HypervisorRestoreOptionsService}
//   from 'hypervisor/restore/hypervisor-restore-options/hypervisor-restore-options.service';
import {HypervisorSharedModule} from 'hypervisor/shared/hypervisor-shared.module';
import {HypervisorBackupComponent} from 'hypervisor/backup';
import {SlapolicySharedModule} from 'slapolicy/shared/slapolicy-shared.module';
import {JobWizardModule} from 'wizard/job-wizard.module';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MomentModule} from 'angular2-moment';
import {BsDatepickerModule, BsDropdownModule, ModalModule, TimepickerModule, TooltipModule} from 'ngx-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown/src/app/angular2-multiselect-dropdown/multiselect.component';
import {RefreshButtonModule} from 'shared/components/refresh-button/refresh-button.module';

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
    routing,
    RefreshButtonModule,
    HypervisorSharedModule,
    SlapolicySharedModule,
    JobWizardModule
  ],
  declarations: [
    Hypervisor,
    HypervisorBackupComponent
  ],
  providers: [
    HypervisorManageService,
    HypervisorRestoreService,
    HypervisorBrowseService,
    VmRecoveryPointsService,
    SiteService
  ],
  exports: [
  ],
  entryComponents: [
  ]
})
export class HypervisorModule {
}
