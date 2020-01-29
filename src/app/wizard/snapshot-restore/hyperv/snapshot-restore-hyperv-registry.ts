import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {SnapshotRestoreHypervModel} from './snapshot-restore-hyperv.model';
import {SnapshotRestoreHypervSourceComponent} from './source/snapshot-restore-hyperv-source.component';
import {SnapshotRestoreHypervSnapshotComponent} from './snapshot/snapshot-restore-hyperv-snapshot.component';
import {SnapshotRestoreHypervDestinationComponent} from './destination/snapshot-restore-hyperv-destination.component';
import {SnapshotRestoreHypervRunTypeComponent} from './run-type/snapshot-restore-hyperv-run-type.component';
import {SnapshotRestoreHypervOptionsComponent} from './options/snapshot-restore-hyperv-options.component';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from '../snapshot-restore-wizard.model';
import {SnapshotRestoreHypervScriptsComponent} from './scripts/snapshot-restore-hyperv-scripts.component';
import {SnapshotRestoreHypervScheduleComponent} from './schedule/snapshot-restore-hyperv-schedule.component';
import {SnapshotRestoreHypervDatastoreComponent} from './datastore/snapshot-restore-hyperv-datastore.component';
import {SnapshotRestoreHypervNetworkComponent} from './network/snapshot-restore-hyperv-network.component';
import {Observable} from 'rxjs';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {JobModel} from 'job/shared/job.model';
import {NodeRestorePolicyModel} from 'applications/restore/node-restore-policy.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {NvPairModel} from 'shared/models/nvpair.model';
import {HypervisorRestoreOptionsModel} from 'hypervisor/shared/hypervisor-restore-options.model';
import {SnapshotRestoreHypervSummaryComponent} from './summary/snapshot-restore-hyperv-summary.component';

export type SnapshotRestoreHypervPageComponent = SnapshotRestoreHypervSummaryComponent
  | SnapshotRestoreHypervSourceComponent
  | SnapshotRestoreHypervSnapshotComponent
  | SnapshotRestoreHypervDestinationComponent
  | SnapshotRestoreHypervDatastoreComponent
  | SnapshotRestoreHypervNetworkComponent
  | SnapshotRestoreHypervRunTypeComponent
  | SnapshotRestoreHypervOptionsComponent
  | SnapshotRestoreHypervScriptsComponent
  | SnapshotRestoreHypervScheduleComponent;

@Injectable()
export class SnapshotRestoreHypervRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_SNAPSHOT_RESTORE,
      subType: 'hyperv',
      title: 'wizard.job.textSnapshotRestoreTitle',
      subtitle: 'wizard.textHyperV',
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

  getModelClazz(category: WizardCategory): { new(): SnapshotRestoreHypervModel } {
    return SnapshotRestoreHypervModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<SnapshotRestoreHypervPageComponent> {
    let me = this, factory: ComponentFactory<SnapshotRestoreHypervPageComponent>;
    switch (pageKey) {
      case 'summary':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervSummaryComponent>(
          SnapshotRestoreHypervSummaryComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervSourceComponent>(
          SnapshotRestoreHypervSourceComponent);
        break;
      case 'snapshot':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervSnapshotComponent>(
          SnapshotRestoreHypervSnapshotComponent);
        break;
      case 'destination':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervDestinationComponent>(
          SnapshotRestoreHypervDestinationComponent);
        break;
      case 'datastore':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervDatastoreComponent>(
          SnapshotRestoreHypervDatastoreComponent);
        break;
      case 'network':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervNetworkComponent>(
          SnapshotRestoreHypervNetworkComponent);
        break;
      case 'run-type':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervRunTypeComponent>(
          SnapshotRestoreHypervRunTypeComponent);
        break;
      case 'options':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervOptionsComponent>(
          SnapshotRestoreHypervOptionsComponent);
        break;
      case 'scripts':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervScriptsComponent>(
          SnapshotRestoreHypervScriptsComponent);
        break;
      case 'schedule':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreHypervScheduleComponent>(
          SnapshotRestoreHypervScheduleComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: SnapshotRestoreHypervModel): void {
    model.getPayload();
  }

  applyPolicy(model: SnapshotRestoreHypervModel): Observable<any> {
    let me = this, editMode = model.editMode;
    return editMode ? me.service.updateRestoreJob(model.payload) : me.service.createRestoreJob(model.payload);
  }

  job2NodeRestorePolicy(job: JobModel): NodeRestorePolicyModel {
    return JsonConvert.deserializeObject(job, NodeRestorePolicyModel);
  }

  json2SubOption(json: object): HypervisorRestoreOptionsModel {
    return JsonConvert.deserializeObject(json, HypervisorRestoreOptionsModel);
  }

  playbackPolicy(model: SnapshotRestoreHypervModel): void {
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
    model.destinationType = model.originalHostCluster ? 'original' : 'alternate';

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

    model.script = policy.script;
    model.triggerValue = policy.trigger;
    model.scheduleName = policy.name;
  }

  pickEditMode(model: JobModel): SnapshotRestoreHypervModel {
    let me = this,
      result: SnapshotRestoreHypervModel;
    super.pickEditMode(model);
    result = new SnapshotRestoreHypervModel();
    result.editMode = true;
    result.policy = me.job2NodeRestorePolicy(model);
    me.playbackPolicy(result);
    return result;
  }
}
