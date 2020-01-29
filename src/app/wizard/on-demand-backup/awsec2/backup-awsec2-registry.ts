import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupAwsec2Model} from './backup-awsec2.model';
import {BackupAwsec2SourceComponent} from './source/backup-awsec2-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupAwsec2SelectSlaComponent} from './select-sla/backup-awsec2-select-sla.component';
import {Observable} from 'rxjs';
import {HypervisorBackupService} from 'hypervisor/backup/hypervisor-backup.service';

export type BackupAwsec2PageComponent = BackupAwsec2SourceComponent
  | BackupAwsec2SelectSlaComponent;

@Injectable()
export class BackupAwsec2Registry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'awsec2',
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
              private backupService: HypervisorBackupService) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): BackupAwsec2Model } {
    return BackupAwsec2Model;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupAwsec2PageComponent> {
    let me = this, factory: ComponentFactory<BackupAwsec2PageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupAwsec2SelectSlaComponent>(
          BackupAwsec2SelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupAwsec2SourceComponent>(
          BackupAwsec2SourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupAwsec2Model): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupAwsec2Model): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
