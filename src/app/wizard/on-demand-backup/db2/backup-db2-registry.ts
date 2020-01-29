import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupDb2Model} from './backup-db2.model';
import {BackupDb2SourceComponent} from './source/backup-db2-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupDb2SelectSlaComponent} from './select-sla/backup-db2-select-sla.component';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import {Observable} from 'rxjs/Observable';

export type BackupDb2PageComponent = BackupDb2SourceComponent
  | BackupDb2SelectSlaComponent;

@Injectable()
export class BackupDb2Registry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'db2',
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

  getModelClazz(category: WizardCategory): { new(): BackupDb2Model } {
    return BackupDb2Model;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupDb2PageComponent> {
    let me = this, factory: ComponentFactory<BackupDb2PageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupDb2SelectSlaComponent>(
          BackupDb2SelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupDb2SourceComponent>(
          BackupDb2SourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupDb2Model): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupDb2Model): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
