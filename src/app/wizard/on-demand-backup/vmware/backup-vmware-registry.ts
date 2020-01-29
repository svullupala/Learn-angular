import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupVmwareModel} from './backup-vmware.model';
import {BackupVmwareSourceComponent} from './source/backup-vmware-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupVmwareSelectSlaComponent} from './select-sla/backup-vmware-select-sla.component';
import {Observable} from 'rxjs';
import {HypervisorBackupService} from 'hypervisor/backup/hypervisor-backup.service';

export type BackupVmwarePageComponent = BackupVmwareSourceComponent
  | BackupVmwareSelectSlaComponent;

@Injectable()
export class BackupVmwareRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'vmware',
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

  getModelClazz(category: WizardCategory): { new(): BackupVmwareModel } {
    return BackupVmwareModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupVmwarePageComponent> {
    let me = this, factory: ComponentFactory<BackupVmwarePageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupVmwareSelectSlaComponent>(
          BackupVmwareSelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupVmwareSourceComponent>(
          BackupVmwareSourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupVmwareModel): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupVmwareModel): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
