import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupExchModel} from './backup-exch.model';
import {BackupExchSourceComponent} from './source/backup-exch-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupExchSelectSlaComponent} from './select-sla/backup-exch-select-sla.component';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import {Observable} from 'rxjs/Observable';

export type BackupExchPageComponent = BackupExchSourceComponent
  | BackupExchSelectSlaComponent;

@Injectable()
export class BackupExchRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'exch',
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

  getModelClazz(category: WizardCategory): { new(): BackupExchModel } {
    return BackupExchModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupExchPageComponent> {
    let me = this, factory: ComponentFactory<BackupExchPageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupExchSelectSlaComponent>(
          BackupExchSelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupExchSourceComponent>(
          BackupExchSourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupExchModel): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupExchModel): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
