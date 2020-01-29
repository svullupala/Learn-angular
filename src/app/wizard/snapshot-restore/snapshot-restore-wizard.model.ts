import {SnapshotRestoreVmwareModel} from './vmware/snapshot-restore-vmware.model';
import {SnapshotRestoreOracleModel} from './oracle/snapshot-restore-oracle.model';
import {SnapshotRestoreExchModel} from './exch/snapshot-restore-exch.model';
import {SnapshotRestoreSqlModel} from './sql/snapshot-restore-sql.model';
import {SnapshotRestoreHypervModel} from './hyperv/snapshot-restore-hyperv.model';
import {SnapshotRestoreMongoModel} from './mongo/snapshot-restore-mongo.model';
import {SnapshotRestoreExchOnlineModel} from 'wizard/snapshot-restore/exchonline/snapshot-restore-exchonline.model';
import { SnapshotRestoreAwsec2Model } from "./awsec2/snapshot-restore-awsec2.model";
import { SnapshotRestoreKubernetesModel } from './kubernetes/snapshot-restore-kubernetes.model';

export const WIZARD_CATEGORY_SNAPSHOT_RESTORE = 'snapshot-restore';

export type SnapshotRestoreWizardModel = SnapshotRestoreVmwareModel
  | SnapshotRestoreHypervModel
  | SnapshotRestoreOracleModel
  | SnapshotRestoreKubernetesModel
  | SnapshotRestoreMongoModel
  | SnapshotRestoreSqlModel
  | SnapshotRestoreExchOnlineModel
  | SnapshotRestoreExchModel
  | SnapshotRestoreAwsec2Model;
