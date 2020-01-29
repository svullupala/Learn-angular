import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupMongoModel} from './backup-mongo.model';
import {BackupMongoSourceComponent} from './source/backup-mongo-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupMongoSelectSlaComponent} from './select-sla/backup-mongo-select-sla.component';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import {Observable} from 'rxjs/Observable';

export type BackupMongoPageComponent = BackupMongoSourceComponent
  | BackupMongoSelectSlaComponent;

@Injectable()
export class BackupMongoRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'mongo',
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

  getModelClazz(category: WizardCategory): { new(): BackupMongoModel } {
    return BackupMongoModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupMongoPageComponent> {
    let me = this, factory: ComponentFactory<BackupMongoPageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupMongoSelectSlaComponent>(
          BackupMongoSelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupMongoSourceComponent>(
          BackupMongoSourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupMongoModel): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupMongoModel): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
