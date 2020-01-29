import {ComponentFactory, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {BackupWizardModel} from './backup-wizard.model';
import {Observable} from 'rxjs/Observable';
import {JobModel} from 'job/shared/job.model';
import {BackupHypervPageComponent, BackupHypervRegistry} from 'wizard/on-demand-backup/hyperv';
import {BackupVmwarePageComponent, BackupVmwareRegistry} from 'wizard/on-demand-backup/vmware';
import {BackupDb2PageComponent, BackupDb2Registry} from 'wizard/on-demand-backup/db2';
import {BackupOraclePageComponent, BackupOracleRegistry} from 'wizard/on-demand-backup/oracle';
import {BackupKubernetesPageComponent, BackupKubernetesRegistry} from 'wizard/on-demand-backup/kubernetes';
import {BackupExchPageComponent, BackupExchRegistry} from 'wizard/on-demand-backup/exch';
import {BackupOffice365PageComponent, BackupOffice365Registry} from 'wizard/on-demand-backup/office365';
import {BackupMongoPageComponent, BackupMongoRegistry} from 'wizard/on-demand-backup/mongo';
import {BackupSqlPageComponent, BackupSqlRegistry} from 'wizard/on-demand-backup/sql';
import {BackupVmwareModel} from 'wizard/on-demand-backup/vmware/backup-vmware.model';
import {BackupHypervModel} from 'wizard/on-demand-backup/hyperv/backup-hyperv.model';
import {BackupOracleModel} from 'wizard/on-demand-backup/oracle/backup-oracle.model';
import {BackupKubernetesModel} from 'wizard/on-demand-backup/kubernetes/backup-kubernetes.model';
import {BackupSqlModel} from 'wizard/on-demand-backup/sql/backup-sql.model';
import {BackupExchModel} from 'wizard/on-demand-backup/exch/backup-exch.model';
import {BackupOffice365Model} from 'wizard/on-demand-backup/office365/backup-office365.model';
import {BackupDb2Model} from 'wizard/on-demand-backup/db2/backup-db2.model';
import {BackupMongoModel} from 'wizard/on-demand-backup/mongo/backup-mongo.model';
import { BackupAwsec2PageComponent, BackupAwsec2Registry } from './awsec2';
import { BackupAwsec2Model } from './awsec2/backup-awsec2.model';

export type BackupWizardPageComponent = BackupVmwarePageComponent
| BackupHypervPageComponent
| BackupAwsec2PageComponent
| BackupOraclePageComponent
| BackupKubernetesPageComponent
| BackupExchPageComponent
| BackupOffice365PageComponent
| BackupDb2PageComponent
| BackupMongoPageComponent
| BackupSqlPageComponent;

@Injectable()
export class BackupWizardRegistry extends WizardRegistry {

  constructor(private vmwareRegistry: BackupVmwareRegistry,
              private hypervRegistry: BackupHypervRegistry,
              private awsec2Registry: BackupAwsec2Registry,
              private oracleRegistry: BackupOracleRegistry,
              private kubernetesRegistry: BackupKubernetesRegistry,
              private mongoRegistry: BackupMongoRegistry,
              private sqlRegistry: BackupSqlRegistry,
              private db2Registry: BackupDb2Registry,
              private exchRegistry: BackupExchRegistry,
              private office365Registry: BackupOffice365Registry
  ) {
    super(true, [].concat(
      vmwareRegistry.categories,
      hypervRegistry.categories,
      awsec2Registry.categories,
      oracleRegistry.categories,
      kubernetesRegistry.categories,
      mongoRegistry.categories,
      sqlRegistry.categories,
      db2Registry.categories,
      exchRegistry.categories,
      office365Registry.categories
    ));
  }



  getModelClazz(category: WizardCategory): { new(): BackupWizardModel } {
    let me = this, clazz: { new(): BackupWizardModel };

    switch (category.subType) {
      case 'vmware':
        clazz = me.vmwareRegistry.getModelClazz(category);
        break;
      case 'hyperv':
        clazz = me.hypervRegistry.getModelClazz(category);
        break;
      case 'awsec2':
        clazz = me.awsec2Registry.getModelClazz(category);
        break;
      case 'oracle':
        clazz = me.oracleRegistry.getModelClazz(category);
        break;
      case 'k8s':
        clazz = me.kubernetesRegistry.getModelClazz(category);
        break;
      case 'mongo':
        clazz = me.mongoRegistry.getModelClazz(category);
        break;
      case 'sql':
        clazz = me.sqlRegistry.getModelClazz(category);
        break;
      case 'exch':
        clazz = me.exchRegistry.getModelClazz(category);
        break;
      case 'office365':
        clazz = me.office365Registry.getModelClazz(category);
        break;
      case 'db2':
        clazz = me.db2Registry.getModelClazz(category);
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<BackupWizardPageComponent> {
    let me = this, factory: ComponentFactory<BackupWizardPageComponent>;

    switch (category.subType) {
      case 'vmware':
        factory = me.vmwareRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'hyperv':
        factory = me.hypervRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'awsec2':
        factory = me.awsec2Registry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'oracle':
        factory = me.oracleRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'k8s':
        factory = me.kubernetesRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'mongo':
        factory = me.mongoRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'sql':
        factory = me.sqlRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'db2':
        factory = me.db2Registry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'exch':
        factory = me.exchRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      case 'office365':
        factory = me.office365Registry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: BackupWizardModel): void {
    let me = this;
    switch (model.workflow) {
      case 'vmware':
        me.vmwareRegistry.buildPolicy(model as BackupVmwareModel);
        break;
      case 'hyperv':
        me.hypervRegistry.buildPolicy(model as BackupHypervModel);
        break;
      case 'awsec2':
        me.awsec2Registry.buildPolicy(model as BackupAwsec2Model);
        break;
      case 'oracle':
        me.oracleRegistry.buildPolicy(model as BackupOracleModel);
        break;
      case 'k8s':
        me.kubernetesRegistry.buildPolicy(model as BackupKubernetesModel);
        break;
      case 'mongo':
        me.mongoRegistry.buildPolicy(model as BackupMongoModel);
        break;
      case 'sql':
        me.sqlRegistry.buildPolicy(model as BackupSqlModel);
        break;
      case 'db2':
        me.db2Registry.buildPolicy(model as BackupDb2Model);
        break;
      case 'exch':
        me.exchRegistry.buildPolicy(model as BackupExchModel);
        break;
      case 'office365':
        me.office365Registry.buildPolicy(model as BackupOffice365Model);
        break;
      default:
        break;
    }
  }

  applyPolicy(model: BackupWizardModel): Observable<any> {
    let me = this, result;
    switch (model.workflow) {
      // TODO: Uncomment the following code when the applyPolicy is existing & ready.
      case 'vmware':
        result = me.vmwareRegistry.applyPolicy(model as BackupVmwareModel);
        break;
      case 'hyperv':
        result = me.hypervRegistry.applyPolicy(model as BackupHypervModel);
        break;
      case 'awsec2':
        result = me.awsec2Registry.applyPolicy(model as BackupAwsec2Model);
        break;
      case 'oracle':
        result = me.oracleRegistry.applyPolicy(model as BackupOracleModel);
        break;
      case 'k8s':
        result = me.kubernetesRegistry.applyPolicy(model as BackupKubernetesModel);
        break;
      case 'mongo':
        result = me.mongoRegistry.applyPolicy(model as BackupMongoModel);
        break;
      case 'sql':
        result = me.sqlRegistry.applyPolicy(model as BackupSqlModel);
        break;
      case 'db2':
        result = me.db2Registry.applyPolicy(model as BackupDb2Model);
        break;
      case 'exch':
        result = me.exchRegistry.applyPolicy(model as BackupExchModel);
        break;
      case 'office365':
        result = me.office365Registry.applyPolicy(model as BackupOffice365Model);
        break;
      default:
        break;
    }
    return result;
  }

  pickEditMode(model: JobModel): BackupWizardModel {
    let me = this,
      result: BackupWizardModel;
    super.pickEditMode(model);

    switch (model.subType) {
      // TODO: Uncomment the following code when the pickEditMode is ready.
      // case 'vmware':
      //   result = me.vmwareRegistry.pickEditMode(model);
      //   break;
      // case 'oracle':
      //   result = me.oracleRegistry.pickEditMode(model);
      //   break;
      // case 'sql':
      //   result = me.sqlRegistry.pickEditMode(model);
      //   break;
      // case 'db2':
      //   result = me.db2Registry.pickEditMode(model);
      //   break;
      // case 'exch':
      //   result = me.exchRegistry.pickEditMode(model);
      //   break;
      default:
        break;
    }
    return result;
  }

  pickCreateMode(hasStarter: boolean): void {
    let me = this;
    super.pickCreateMode(hasStarter);
    me.vmwareRegistry.pickCreateMode(hasStarter);
    me.hypervRegistry.pickCreateMode(hasStarter);
    me.awsec2Registry.pickCreateMode(hasStarter);
    me.oracleRegistry.pickCreateMode(hasStarter);
    me.kubernetesRegistry.pickCreateMode(hasStarter);
    me.mongoRegistry.pickCreateMode(hasStarter);
    me.sqlRegistry.pickCreateMode(hasStarter);
    me.db2Registry.pickCreateMode(hasStarter);
    me.exchRegistry.pickCreateMode(hasStarter);
    me.office365Registry.pickCreateMode(hasStarter);
  }
}

