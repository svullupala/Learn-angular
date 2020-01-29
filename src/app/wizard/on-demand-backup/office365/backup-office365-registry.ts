import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupOffice365Model} from './backup-office365.model';
import {BackupOffice365SourceComponent} from './source/backup-office365-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupOffice365SelectSlaComponent} from './select-sla/backup-office365-select-sla.component';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import {Observable} from 'rxjs/Observable';

export type BackupOffice365PageComponent = BackupOffice365SourceComponent
  | BackupOffice365SelectSlaComponent;

@Injectable()
export class BackupOffice365Registry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'office365',
      title: 'wizard.job.textBackupTitle',
      description: 'wizard.job.textBackupDescription',
      icon: 'bidi-wizard-adhoc-backup',
      pages: [
        {
          key: 'workflow', title: 'wizard.textWorkflowSelectorTitle',
          group: 'wizard.job.textGroupSelectDataSources',
          workflow: true
        },
        {
          key: 'sla', title: 'wizard.job.textSelectSlaTitle',
          group: 'wizard.job.textGroupSelectDataSources'
        },
        {
          key: 'source', title: 'wizard.job.textSourceSelectTitle',
          group: 'wizard.job.textGroupSelectDataSources',
        },
        {
          key: 'review', title: 'wizard.textReview',
          review: true
        }
      ]
    }
  ];

  constructor(private resolver: ComponentFactoryResolver,
              private backupService: ApplicationBackupService) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): BackupOffice365Model } {
    return BackupOffice365Model;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupOffice365PageComponent> {
    let me = this, factory: ComponentFactory<BackupOffice365PageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupOffice365SelectSlaComponent>(
          BackupOffice365SelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupOffice365SourceComponent>(
          BackupOffice365SourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupOffice365Model): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupOffice365Model): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
