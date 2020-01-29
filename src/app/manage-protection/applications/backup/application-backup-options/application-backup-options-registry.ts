import {ComponentFactory} from '@angular/core';
import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {
  ApplicationBackupOptionsPage
} from 'applications/backup/application-backup-options/application-backup-options-page';

export class ApplicationBackupOptionsRegistry {
  applicationType: string;
  modelClazz: { new(): ApplicationBackupOptionsModel };
  componentFactory: ComponentFactory<ApplicationBackupOptionsPage<ApplicationBackupOptionsModel>>;
}
