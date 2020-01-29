import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupHypervModel} from './backup-hyperv.model';
import {BackupHypervSourceComponent} from './source/backup-hyperv-source.component';
import {WIZARD_CATEGORY_BACKUP} from '../backup-wizard.model';
import {BackupHypervSelectSlaComponent} from './select-sla/backup-hyperv-select-sla.component';
import {BackupVmwareModel} from 'wizard/on-demand-backup/vmware/backup-vmware.model';
import {HypervisorBackupService} from 'hypervisor/backup/hypervisor-backup.service';
import {Observable} from 'rxjs/Observable';

export type BackupHypervPageComponent = BackupHypervSourceComponent
  | BackupHypervSelectSlaComponent;

@Injectable()
export class BackupHypervRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_BACKUP,
      subType: 'hyperv',
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

  getModelClazz(category: WizardCategory): { new(): BackupHypervModel } {
    return BackupHypervModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupHypervPageComponent> {
    let me = this, factory: ComponentFactory<BackupHypervPageComponent>;
    switch (pageKey) {
      case 'sla':
        factory = me.resolver.resolveComponentFactory<BackupHypervSelectSlaComponent>(
          BackupHypervSelectSlaComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<BackupHypervSourceComponent>(
          BackupHypervSourceComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupHypervModel): void {
    model.buildPolicy();
  }

  applyPolicy(model: BackupVmwareModel): Observable<any> {
    return this.backupService.runAdHoc(model.payload);
  }
}
