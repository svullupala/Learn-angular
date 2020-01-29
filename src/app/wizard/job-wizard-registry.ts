import {ComponentFactory, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupWizardModel, WIZARD_CATEGORY_BACKUP} from './on-demand-backup/backup-wizard.model';
import {FileRestoreWizardModel, WIZARD_CATEGORY_FILE_RESTORE} from './file-restore/file-restore-wizard.model';
import {
  SnapshotRestoreWizardModel,
  WIZARD_CATEGORY_SNAPSHOT_RESTORE
} from './snapshot-restore/snapshot-restore-wizard.model';
import {
  BackupWizardPageComponent, BackupWizardRegistry
} from './on-demand-backup/backup-wizard-registry';
import {
  FileRestoreWizardPageComponent, FileRestoreWizardRegistry
} from './file-restore/file-restore-wizard-registry';
import {
  SnapshotRestoreWizardPageComponent, SnapshotRestoreWizardRegistry
} from './snapshot-restore/snapshot-restore-wizard-registry';
import {Observable} from 'rxjs/Observable';
import {JobModel} from 'job/shared/job.model';

export type JobWizardModel = BackupWizardModel
  | FileRestoreWizardModel
  | SnapshotRestoreWizardModel;

export type JobWizardPageComponent = BackupWizardPageComponent
  | FileRestoreWizardPageComponent
  | SnapshotRestoreWizardPageComponent;

@Injectable()
export class JobWizardRegistry extends WizardRegistry {

  title: string = 'wizard.job.textTitle';

  constructor(
              private backupRegistry: BackupWizardRegistry,
              // private fileRestoreRegistry: FileRestoreWizardRegistry,
              private snapshotRestoreRegistry: SnapshotRestoreWizardRegistry) {
    // As per - Since we are removing backup and potentially also file restore,
    // if we can launch directly into the snapshot wizard.
    // - Set hasStarter to false here.
    super(true, [].concat(
      backupRegistry.categories,
      // fileRestoreRegistry.categories,
      snapshotRestoreRegistry.categories));
  }

  getModelClazz(category: WizardCategory): { new(): JobWizardModel } {
    let me = this, clazz: { new(): JobWizardModel };

    switch (category.type) {
      case WIZARD_CATEGORY_BACKUP:
        clazz = me.backupRegistry.getModelClazz(category);
        break;
      // case WIZARD_CATEGORY_FILE_RESTORE:
      //   clazz = me.fileRestoreRegistry.getModelClazz(category);
      //   break;
      case WIZARD_CATEGORY_SNAPSHOT_RESTORE:
        clazz = me.snapshotRestoreRegistry.getModelClazz(category);
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<JobWizardPageComponent> {
    let me = this, factory: ComponentFactory<JobWizardPageComponent>;

    switch (category.type) {
      case WIZARD_CATEGORY_BACKUP:
        factory = me.backupRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      // case WIZARD_CATEGORY_FILE_RESTORE:
      //   factory = me.fileRestoreRegistry.getPageComponentFactory(category, pageIdx);
      //   break;
      case WIZARD_CATEGORY_SNAPSHOT_RESTORE:
        factory = me.snapshotRestoreRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(category: WizardCategory, model: JobWizardModel): void {
    let me = this;
    switch (category.type) {
      // TODO: Uncomment the following code when the buildPolicy is existing & ready.
      case WIZARD_CATEGORY_BACKUP:
        me.backupRegistry.buildPolicy(model as BackupWizardModel);
        break;
      // case WIZARD_CATEGORY_FILE_RESTORE:
      //   me.fileRestoreRegistry.buildPolicy(model);
      //   break;
      case WIZARD_CATEGORY_SNAPSHOT_RESTORE:
        me.snapshotRestoreRegistry.buildPolicy(model as SnapshotRestoreWizardModel);
        break;
      default:
        break;
    }
  }

  applyPolicy(category: WizardCategory, model: JobWizardModel): Observable<any> {
    let me = this, result;
    switch (category.type) {
      // TODO: Uncomment the following code when the buildPolicy is existing & ready.
      case WIZARD_CATEGORY_BACKUP:
        result = me.backupRegistry.applyPolicy(model as BackupWizardModel);
        break;
      // case WIZARD_CATEGORY_FILE_RESTORE:
      //   result = me.fileRestoreRegistry.applyPolicy(model);
      //   break;
      case WIZARD_CATEGORY_SNAPSHOT_RESTORE:
        result = me.snapshotRestoreRegistry.applyPolicy(model as SnapshotRestoreWizardModel);
        break;
      default:
        break;
    }
    return result;
  }

  jobType2category(type: string, subType: string): string {
    let category: string;
    if (type === 'recovery' && subType !== 'file')
      category = WIZARD_CATEGORY_SNAPSHOT_RESTORE;
    // TODO: add support for file restore & backup if necessary.
    return category;
  }

  pickEditMode(model: JobModel): JobWizardModel {
    let me = this,
      result: JobWizardModel,
      category = me.jobType2category(model.type, model.subType);
    super.pickEditMode(model);
    switch (category) {
      // TODO: Uncomment the following code when the pickEditMode is ready.
      // case WIZARD_CATEGORY_BACKUP:
      //   result = me.backupRegistry.pickEditMode(model);
      //   break;
      // case WIZARD_CATEGORY_FILE_RESTORE:
      //   result = me.fileRestoreRegistry.pickEditMode(model);
      //   break;
      case WIZARD_CATEGORY_SNAPSHOT_RESTORE:
        result = me.snapshotRestoreRegistry.pickEditMode(model);
        break;
      default:
        break;
    }
    return result;
  }

  pickCreateMode(hasStarter: boolean): void {
    let me = this;
    super.pickCreateMode(hasStarter);
    me.backupRegistry.pickCreateMode(hasStarter);
    // me.fileRestoreRegistry.pickCreateMode(hasStarter);
    me.snapshotRestoreRegistry.pickCreateMode(hasStarter);
  }
}
