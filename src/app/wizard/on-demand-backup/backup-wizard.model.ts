import {BackupVmwareModel} from 'wizard/on-demand-backup/vmware/backup-vmware.model';
import {BackupHypervModel} from 'wizard/on-demand-backup/hyperv/backup-hyperv.model';
import {BackupOracleModel} from 'wizard/on-demand-backup/oracle/backup-oracle.model';
import {BackupKubernetesModel} from 'wizard/on-demand-backup/kubernetes/backup-kubernetes.model';
import {BackupMongoModel} from 'wizard/on-demand-backup/mongo/backup-mongo.model';
import {BackupDb2Model} from 'wizard/on-demand-backup/db2/backup-db2.model';
import {BackupSqlModel} from 'wizard/on-demand-backup/sql/backup-sql.model';
import {BackupExchModel} from 'wizard/on-demand-backup/exch/backup-exch.model';
import {BackupOffice365Model} from 'wizard/on-demand-backup/office365/backup-office365.model';
import { BackupAwsec2Model } from './awsec2/backup-awsec2.model';

export const WIZARD_CATEGORY_BACKUP = 'backup';

export type BackupWizardModel = BackupVmwareModel
  | BackupHypervModel
  | BackupAwsec2Model
  | BackupOracleModel
  | BackupMongoModel
  | BackupDb2Model
  | BackupExchModel
  | BackupOffice365Model
  | BackupKubernetesModel
  | BackupSqlModel;
