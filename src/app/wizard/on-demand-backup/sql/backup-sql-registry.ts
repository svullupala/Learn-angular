import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupSqlModel} from './backup-sql.model';
import {BackupSqlSourceComponent} from './source/backup-sql-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupSqlSelectSlaComponent} from './select-sla/backup-sql-select-sla.component';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import {Observable} from 'rxjs/Observable';

export type BackupSqlPageComponent = BackupSqlSourceComponent
  | BackupSqlSelectSlaComponent;

@Injectable()
export class BackupSqlRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'sql',
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

  getModelClazz(category: WizardCategory): { new(): BackupSqlModel } {
    return BackupSqlModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupSqlPageComponent> {
    let me = this, factory: ComponentFactory<BackupSqlPageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupSqlSelectSlaComponent>(
          BackupSqlSelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupSqlSourceComponent>(
          BackupSqlSourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupSqlModel): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupSqlModel): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
