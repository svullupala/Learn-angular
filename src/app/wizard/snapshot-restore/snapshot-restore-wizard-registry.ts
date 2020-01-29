import {ComponentFactory, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {SnapshotRestoreWizardModel} from './snapshot-restore-wizard.model';
import {
  SnapshotRestoreVmwarePageComponent,
  SnapshotRestoreVmwareRegistry
} from './vmware/snapshot-restore-vmware-registry';
import {
  SnapshotRestoreOraclePageComponent,
  SnapshotRestoreOracleRegistry
} from './oracle/snapshot-restore-oracle-registry';
import {
  SnapshotRestoreSqlPageComponent,
  SnapshotRestoreSqlRegistry
} from './sql/snapshot-restore-sql-registry';
import {
  SnapshotRestoreExchPageComponent,
  SnapshotRestoreExchRegistry
} from './exch/snapshot-restore-exch-registry';
import {
  SnapshotRestoreExchOnlinePageComponent,
  SnapshotRestoreExchOnlineRegistry
} from './exchonline/snapshot-restore-exchonline-registry';
import {SnapshotRestoreOracleModel} from './oracle/snapshot-restore-oracle.model';
import {SnapshotRestoreSqlModel} from './sql/snapshot-restore-sql.model';
import {Observable} from 'rxjs/Observable';
import {
  SnapshotRestoreDb2PageComponent,
  SnapshotRestoreDb2Registry
} from './db2/snapshot-restore-db2-registry';
import {SnapshotRestoreDb2Model} from './db2/snapshot-restore-db2.model';
import {JobModel} from 'job/shared/job.model';
import {SnapshotRestoreExchModel} from './exch/snapshot-restore-exch.model';
import {SnapshotRestoreVmwareModel} from './vmware/snapshot-restore-vmware.model';
import {
  SnapshotRestoreHypervPageComponent,
  SnapshotRestoreHypervRegistry
} from './hyperv/snapshot-restore-hyperv-registry';
import {SnapshotRestoreHypervModel} from './hyperv/snapshot-restore-hyperv.model';
import {SnapshotRestoreMongoModel} from './mongo/snapshot-restore-mongo.model';
import {SnapshotRestoreMongoPageComponent, SnapshotRestoreMongoRegistry} from './mongo/snapshot-restore-mongo-registry';
import { SnapshotRestoreExchOnlineModel } from './exchonline/snapshot-restore-exchonline.model';
import { SnapshotRestoreAwsec2Model } from './awsec2/snapshot-restore-awsec2.model';
import { SnapshotRestoreAwsec2PageComponent, SnapshotRestoreAwsec2Registry } from './awsec2';
import { SnapshotRestoreKubernetesPageComponent, SnapshotRestoreKubernetesRegistry } from './kubernetes';
import { SnapshotRestoreKubernetesModel } from './kubernetes/snapshot-restore-kubernetes.model';

export type SnapshotRestoreWizardPageComponent = SnapshotRestoreVmwarePageComponent
  | SnapshotRestoreHypervPageComponent
  | SnapshotRestoreAwsec2PageComponent
  | SnapshotRestoreOraclePageComponent
  | SnapshotRestoreMongoPageComponent
  | SnapshotRestoreSqlPageComponent
  | SnapshotRestoreDb2PageComponent
  | SnapshotRestoreExchPageComponent
  | SnapshotRestoreExchOnlinePageComponent
  | SnapshotRestoreKubernetesPageComponent;

@Injectable()
export class SnapshotRestoreWizardRegistry extends WizardRegistry {

  constructor(private vmwareRegistry: SnapshotRestoreVmwareRegistry,
              private hypervRegistry: SnapshotRestoreHypervRegistry,
              private awsec2Registry: SnapshotRestoreAwsec2Registry,
              private oracleRegistry: SnapshotRestoreOracleRegistry,
              private kubernetesRegistry: SnapshotRestoreKubernetesRegistry,
              private mongoRegistry: SnapshotRestoreMongoRegistry,
              private sqlRegistry: SnapshotRestoreSqlRegistry,
              private db2Registry: SnapshotRestoreDb2Registry,
              private exchRegistry: SnapshotRestoreExchRegistry,
              private exchOnlineRegistry: SnapshotRestoreExchOnlineRegistry) {
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
      exchOnlineRegistry.categories));
  }

  getModelClazz(category: WizardCategory): { new(): SnapshotRestoreWizardModel } {
    let me = this, clazz: { new(): SnapshotRestoreWizardModel };

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
      case 'db2':
        clazz = me.db2Registry.getModelClazz(category);
        break;
      case 'exch':
        clazz = me.exchRegistry.getModelClazz(category);
        break;
      case 'office365':
        clazz = me.exchOnlineRegistry.getModelClazz(category);
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<SnapshotRestoreWizardPageComponent> {
    let me = this, factory: ComponentFactory<SnapshotRestoreWizardPageComponent>;

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
        factory = me.exchOnlineRegistry.getPageComponentFactory(category, pageIdx, pageKey);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: SnapshotRestoreWizardModel): void {
    let me = this;
    switch (model.workflow) {
      // TODO: Uncomment the following code when the buildPolicy is existing & ready.
      case 'vmware':
        me.vmwareRegistry.buildPolicy(model as SnapshotRestoreVmwareModel);
        break;
      case 'hyperv':
        me.hypervRegistry.buildPolicy(model as SnapshotRestoreHypervModel);
        break;
      case 'awsec2':
        me.awsec2Registry.buildPolicy(model as SnapshotRestoreAwsec2Model);
        break;
      case 'oracle':
        me.oracleRegistry.buildPolicy(model as SnapshotRestoreOracleModel);
        break;
      case 'k8s':
        me.kubernetesRegistry.buildPolicy(model as SnapshotRestoreKubernetesModel);
        break;
      case 'mongo':
        me.mongoRegistry.buildPolicy(model as SnapshotRestoreMongoModel);
        break;
      case 'sql':
        me.sqlRegistry.buildPolicy(model as SnapshotRestoreSqlModel);
        break;
      case 'db2':
        me.db2Registry.buildPolicy(model as SnapshotRestoreDb2Model);
        break;
      case 'exch':
        me.exchRegistry.buildPolicy(model as SnapshotRestoreExchModel);
        break;
      case 'office365':
        me.exchOnlineRegistry.buildPolicy(model as SnapshotRestoreExchOnlineModel);
        break;
      default:
        break;
    }
  }

  applyPolicy(model: SnapshotRestoreWizardModel): Observable<any> {
    let me = this, result;
    switch (model.workflow) {
      // TODO: Uncomment the following code when the applyPolicy is existing & ready.
      case 'vmware':
        result = me.vmwareRegistry.applyPolicy(model as SnapshotRestoreVmwareModel);
        break;
      case 'hyperv':
        result = me.hypervRegistry.applyPolicy(model as SnapshotRestoreHypervModel);
        break;
      case 'awsec2':
        result = me.awsec2Registry.applyPolicy(model as SnapshotRestoreAwsec2Model);
        break;
      case 'oracle':
        result = me.oracleRegistry.applyPolicy(model as SnapshotRestoreOracleModel);
        break;
      case 'k8s':
        result = me.kubernetesRegistry.applyPolicy(model as SnapshotRestoreKubernetesModel);
        break;
      case 'mongo':
        result = me.mongoRegistry.applyPolicy(model as SnapshotRestoreMongoModel);
        break;
      case 'sql':
        result = me.sqlRegistry.applyPolicy(model as SnapshotRestoreSqlModel);
        break;
      case 'db2':
        result = me.db2Registry.applyPolicy(model as SnapshotRestoreDb2Model);
        break;
      case 'exch':
        result = me.exchRegistry.applyPolicy(model as SnapshotRestoreExchModel);
        break;
      case 'office365':
        result = me.exchOnlineRegistry.applyPolicy(model as SnapshotRestoreExchOnlineModel);
        break;
      default:
        break;
    }
    return result;
  }

  pickEditMode(model: JobModel): SnapshotRestoreWizardModel {
    let me = this,
      result: SnapshotRestoreWizardModel;
    super.pickEditMode(model);

    switch (model.subType) {
      // TODO: Uncomment the following code when the pickEditMode is ready.
      case 'vmware':
        result = me.vmwareRegistry.pickEditMode(model);
        break;
      case 'hyperv':
        result = me.hypervRegistry.pickEditMode(model);
        break;
      case 'awsec2':
        result = me.awsec2Registry.pickEditMode(model);
        break;
      case 'oracle':
        result = me.oracleRegistry.pickEditMode(model);
        break;
      case 'k8s':
        result = me.kubernetesRegistry.pickEditMode(model);
        break;
      case 'mongo':
        result = me.mongoRegistry.pickEditMode(model);
        break;
      case 'sql':
        result = me.sqlRegistry.pickEditMode(model);
        break;
      case 'db2':
        result = me.db2Registry.pickEditMode(model);
        break;
      case 'exch':
        result = me.exchRegistry.pickEditMode(model);
        break;
      case 'office365':
        result = me.exchOnlineRegistry.pickEditMode(model);
        break;
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
    me.exchOnlineRegistry.pickCreateMode(hasStarter);
  }
}
