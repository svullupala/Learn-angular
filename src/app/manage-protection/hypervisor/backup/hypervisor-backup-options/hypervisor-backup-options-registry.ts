import {ComponentFactory} from '@angular/core';
import {HypervisorBackupOptionsModel} from '../../shared/hypervisor-backup-options.model';
import {
  HypervisorBackupOptionsPage
} from 'app/manage-protection/hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-page';

export class HypervisorBackupOptionsRegistry {
  hypervisorType: string;
  modelClazz: { new(): HypervisorBackupOptionsModel };
  componentFactory: ComponentFactory<HypervisorBackupOptionsPage<HypervisorBackupOptionsModel>>;
}
