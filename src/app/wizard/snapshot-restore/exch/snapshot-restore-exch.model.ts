import {WizardModel} from 'shared/components/wizard/wizard.model';
import {NodeRestorePolicyModel} from 'app/manage-protection/applications/restore/node-restore-policy.model';
import {ApplicationSubOptionModel} from 'app/manage-protection/applications/shared/application-sub-option.model';
import {
  ApplicationRestoreItem
} from 'app/manage-protection/applications/restore/application-list-table/application-list-table.component';
import {NvPairModel} from 'shared/models/nvpair.model';
import {StorageModel} from 'app/system-configuration/backup-storage/disk-storage/shared/storage.model';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from '../snapshot-restore-wizard.model';
import {BaseModel} from 'shared/models/base.model';

export class SnapshotRestoreExchModel extends WizardModel {
  policy: NodeRestorePolicyModel = new NodeRestorePolicyModel();

  views: Array<NvPairModel> = [];
  view: NvPairModel;
  subOption: ApplicationSubOptionModel = new ApplicationSubOptionModel();
  pitValue: number | string;
  dbGroupValue: object;
  mappingsValue: object;
  optionValue: object;
  destinationValue: object;
  triggerValue: object;
  scheduleName: string;
  originalLocation: boolean = true;
  targetLocation: string = 'original';
  dateRange: Date[];

  source: Array<ApplicationRestoreItem> = new Array<ApplicationRestoreItem>();
  copyLocation: BaseModel;
  isOffload: boolean = false;
  offloadType: string;
  isSystemDbFlag: boolean = false;
  hasMultipleVersions: boolean = false;
  runType: string = 'test';
  subPolicyType: string = 'restore';
  useAlternateVsnap: boolean = false;
  showAlternateVsnap: boolean = false;
  useLatest: boolean = false;
  onDemandPIT: boolean = false;
  selectedStorage: StorageModel;
  script: PostScriptsModel;
  copyLocationHref: string;
  selectedStorageHref: string;

  constructor() {
    super();
    this.category = WIZARD_CATEGORY_SNAPSHOT_RESTORE;
    this.workflow = 'exch';
    this.subOption.applicationType = this.workflow;
  }

  json(): object {
    return this.policy.getPersistentJson(true);
  }

  clearSchedule(): void {
    this.scheduleName = undefined;
    this.triggerValue = undefined;
  }
}
