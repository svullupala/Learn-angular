import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {SnapshotRestoreVmwareModel} from './snapshot-restore-vmware.model';
import {SnapshotRestoreVmwareSourceComponent} from './source/snapshot-restore-vmware-source.component';
import {SnapshotRestoreVmwareSnapshotComponent} from './snapshot/snapshot-restore-vmware-snapshot.component';
import {SnapshotRestoreVmwareDestinationComponent} from './destination/snapshot-restore-vmware-destination.component';
import {SnapshotRestoreVmwareRunTypeComponent} from './run-type/snapshot-restore-vmware-run-type.component';
import {SnapshotRestoreVmwareOptionsComponent} from './options/snapshot-restore-vmware-options.component';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from '../snapshot-restore-wizard.model';
import {SnapshotRestoreVmwareScriptsComponent} from './scripts/snapshot-restore-vmware-scripts.component';
import {SnapshotRestoreVmwareScheduleComponent} from './schedule/snapshot-restore-vmware-schedule.component';
import {SnapshotRestoreVmwareDatastoreComponent} from './datastore/snapshot-restore-vmware-datastore.component';
import {SnapshotRestoreVmwareNetworkComponent} from './network/snapshot-restore-vmware-network.component';
import {Observable} from 'rxjs';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {JobModel} from 'job/shared/job.model';
import {NodeRestorePolicyModel} from 'applications/restore/node-restore-policy.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {HypervisorRestoreOptionsModel} from 'hypervisor/shared/hypervisor-restore-options.model';
import {SnapshotRestoreVmwareSummaryComponent} from './summary/snapshot-restore-vmware-summary.component';

export type SnapshotRestoreVmwarePageComponent = SnapshotRestoreVmwareSummaryComponent
  | SnapshotRestoreVmwareSourceComponent
  | SnapshotRestoreVmwareSnapshotComponent
  | SnapshotRestoreVmwareDestinationComponent
  | SnapshotRestoreVmwareDatastoreComponent
  | SnapshotRestoreVmwareNetworkComponent
  | SnapshotRestoreVmwareRunTypeComponent
  | SnapshotRestoreVmwareOptionsComponent
  | SnapshotRestoreVmwareScriptsComponent
  | SnapshotRestoreVmwareScheduleComponent;

@Injectable()
export class SnapshotRestoreVmwareRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_SNAPSHOT_RESTORE,
      subType: 'vmware',
      title: 'wizard.job.textSnapshotRestoreTitle',
      subtitle: 'wizard.textVMware',
      description: 'wizard.job.textSnapshotRestoreDescription',
      icon: 'bidi-wizard-snapshot',
      pages: [
        {
          key: 'summary', title: 'wizard.textSummary',
          review: true,
          justForEdit: true
        },
        {
          key: 'workflow', title: 'wizard.textWorkflowSelectorTitle',
          group: 'wizard.job.textGroupSelectDataSources',
          workflow: true
        },
        {
          key: 'source', title: 'wizard.job.textSourceSelectTitle',
          group: 'wizard.job.textGroupSelectDataSources'
        },
        {
          key: 'snapshot', title: 'wizard.job.textSourceSnapshotTitle',
          group: 'wizard.job.textGroupSelectDataSources'
        },
        {
          key: 'destination', title: 'wizard.job.textSetDestinationTitle',
          group: 'wizard.job.textGroupSelectDestination'
        },
        {
          key: 'datastore', title: 'wizard.job.textSetDatastoreTitle',
          group: 'wizard.job.textGroupSelectDestination'
        },
        {
          key: 'network', title: 'wizard.job.textSetNetworkTitle',
          group: 'wizard.job.textGroupSelectDestination'
        },
        {
          key: 'run-type', title: 'wizard.job.textRunTypeTitle',
          group: 'wizard.job.textGroupSetRunSettings'
        },
        {
          key: 'options', title: 'wizard.job.textOptionsTitle',
          group: 'wizard.job.textGroupSetRunSettings',
          optional: true,
          advanced: true
        },
        {
          key: 'scripts', title: 'wizard.job.textApplyScriptsTitle',
          group: 'wizard.job.textGroupSetRunSettings',
          optional: true,
          advanced: true
        },
        {
          key: 'schedule', title: 'wizard.job.textScheduleTitle',
          group: 'wizard.job.textGroupSetRunSettings'
        },
        {
          key: 'review', title: 'wizard.textReview',
          review: true
        }
      ]
    }
  ];

  constructor(private resolver: ComponentFactoryResolver,
              private service: HypervisorRestoreService) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): SnapshotRestoreVmwareModel } {
    return SnapshotRestoreVmwareModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<SnapshotRestoreVmwarePageComponent> {
    let me = this, factory: ComponentFactory<SnapshotRestoreVmwarePageComponent>;
    switch (pageKey) {
      case 'summary':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareSummaryComponent>(
          SnapshotRestoreVmwareSummaryComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareSourceComponent>(
          SnapshotRestoreVmwareSourceComponent);
        break;
      case 'snapshot':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareSnapshotComponent>(
          SnapshotRestoreVmwareSnapshotComponent);
        break;
      case 'destination':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareDestinationComponent>(
          SnapshotRestoreVmwareDestinationComponent);
        break;
      case 'datastore':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareDatastoreComponent>(
          SnapshotRestoreVmwareDatastoreComponent);
        break;
      case 'network':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareNetworkComponent>(
          SnapshotRestoreVmwareNetworkComponent);
        break;
      case 'run-type':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareRunTypeComponent>(
          SnapshotRestoreVmwareRunTypeComponent);
        break;
      case 'options':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareOptionsComponent>(
          SnapshotRestoreVmwareOptionsComponent);
        break;
      case 'scripts':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareScriptsComponent>(
          SnapshotRestoreVmwareScriptsComponent);
        break;
      case 'schedule':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreVmwareScheduleComponent>(
          SnapshotRestoreVmwareScheduleComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: SnapshotRestoreVmwareModel): void {
    model.getPayload();
  }

  applyPolicy(model: SnapshotRestoreVmwareModel): Observable<any> {
    let me = this, editMode = model.editMode;
    return editMode ? me.service.updateRestoreJob(model.payload) : me.service.createRestoreJob(model.payload);
  }

  job2NodeRestorePolicy(job: JobModel): NodeRestorePolicyModel {
    return JsonConvert.deserializeObject(job, NodeRestorePolicyModel);
  }

  json2SubOption(json: object): HypervisorRestoreOptionsModel {
    return JsonConvert.deserializeObject(json, HypervisorRestoreOptionsModel);
  }

  playbackPolicy(model: SnapshotRestoreVmwareModel): void {
    let me = this,
      policy = model.policy,
      source = policy.spec.source,
      subpolicy = policy.spec.subpolicy[0],
      destination = subpolicy.destination;

    model.useLatest = source.findIndex(function (item) {
      return item.version && item.version['metadata'] && item.version['metadata']['useLatest'] === true;
    }) !== -1;

    if (model.useLatest) {

      if (subpolicy.source && subpolicy.source['copy'] && subpolicy.source['copy']['offload'] &&
        subpolicy.source['copy']['offload']['href']) {

        model.isOffload = true;
        model.offloadType = subpolicy.source['copy']['offload']['type'];
        model.copyLocationHref = subpolicy.source['copy']['offload']['href'];

      } else if (subpolicy.source && subpolicy.source['copy'] && subpolicy.source['copy']['site'] &&
        subpolicy.source['copy']['site']['href']) {

        model.isOffload = false;
        model.offloadType = undefined;
        model.copyLocationHref = subpolicy.source['copy']['site']['href'];
      }
    } else {
      model.isOffload = false;
    }

    model.workflowType = subpolicy.type;
    model.options = me.json2SubOption(subpolicy.option);
    if (subpolicy.type !== HypervisorRestoreService.IA_VAL) {
      model.runType = model.options.mode;
    } else {
      model.runType = subpolicy.type;
    }

    model.destination = destination;
    model.originalHostCluster = !(destination['target'] && destination['target']['href']);
    model.destinationType = model.originalHostCluster ? 'original' :
      destination['target']['user'] !== undefined ? 'esx' : 'alternate';

    if (subpolicy.destination &&
      subpolicy.destination['storageserver'] &&
      subpolicy.destination['storageserver'].href) {
      model.selectedStorageHref = subpolicy.destination['storageserver'].href;
      model.showAlternateVsnap = true;
      model.useAlternateVsnap = true;
    }

    model.mapNetworkPayload = destination['mapvirtualnetwork'];
    model.mapDatastorePayload = destination['mapRRPdatastore'];
    model.mapSubnetPayload = destination['mapsubnet'];
    model.mapVMNamePayload = destination['mapvm'];
    model.vmPath = destination['vmfolderpath'];
    model.systemDefined = !!(destination['mapsubnet'] && destination['mapsubnet']['systemDefined']);

    model.script = policy.script;
    model.triggerValue = policy.trigger;
    model.scheduleName = policy.name;
  }

  pickEditMode(model: JobModel): SnapshotRestoreVmwareModel {
    let me = this,
      result: SnapshotRestoreVmwareModel;
    super.pickEditMode(model);
    result = new SnapshotRestoreVmwareModel();
    result.editMode = true;
    result.policy = me.job2NodeRestorePolicy(model);
    me.playbackPolicy(result);
    return result;
  }
}
