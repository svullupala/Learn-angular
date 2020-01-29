import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {SnapshotRestoreAwsec2Model} from './snapshot-restore-awsec2.model';
import {SnapshotRestoreAwsec2SourceComponent} from './source/snapshot-restore-awsec2-source.component';
import {SnapshotRestoreAwsec2SnapshotComponent} from './snapshot/snapshot-restore-awsec2-snapshot.component';
import {SnapshotRestoreAwsec2DestinationComponent} from './destination/snapshot-restore-awsec2-destination.component';
import {SnapshotRestoreAwsec2RunTypeComponent} from './run-type/snapshot-restore-awsec2-run-type.component';
import {SnapshotRestoreAwsec2OptionsComponent} from './options/snapshot-restore-awsec2-options.component';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from '../snapshot-restore-wizard.model';
import {SnapshotRestoreAwsec2ScriptsComponent} from './scripts/snapshot-restore-awsec2-scripts.component';
import {SnapshotRestoreAwsec2ScheduleComponent} from './schedule/snapshot-restore-awsec2-schedule.component';
import {SnapshotRestoreAwsec2DatastoreComponent} from './datastore/snapshot-restore-awsec2-datastore.component';
import {SnapshotRestoreAwsec2NetworkComponent} from './network/snapshot-restore-awsec2-network.component';
import {Observable} from 'rxjs';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {JobModel} from 'job/shared/job.model';
import {NodeRestorePolicyModel} from 'applications/restore/node-restore-policy.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {HypervisorRestoreOptionsModel} from 'hypervisor/shared/hypervisor-restore-options.model';
import {SnapshotRestoreAwsec2SummaryComponent} from './summary/snapshot-restore-awsec2-summary.component';

export type SnapshotRestoreAwsec2PageComponent = SnapshotRestoreAwsec2SummaryComponent
  | SnapshotRestoreAwsec2SourceComponent
  | SnapshotRestoreAwsec2SnapshotComponent
  | SnapshotRestoreAwsec2DestinationComponent
  | SnapshotRestoreAwsec2DatastoreComponent
  | SnapshotRestoreAwsec2NetworkComponent
  | SnapshotRestoreAwsec2RunTypeComponent
  | SnapshotRestoreAwsec2OptionsComponent
  | SnapshotRestoreAwsec2ScriptsComponent
  | SnapshotRestoreAwsec2ScheduleComponent;

@Injectable()
export class SnapshotRestoreAwsec2Registry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_SNAPSHOT_RESTORE,
      subType: 'awsec2',
      title: 'wizard.job.textSnapshotRestoreTitle',
      subtitle: 'wizard.textAwsec2',
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
        // {
        //   key: 'datastore', title: 'wizard.job.textSetDatastoreTitle',
        //   group: 'wizard.job.textGroupSelectDestination'
        // },
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

  getModelClazz(category: WizardCategory): { new(): SnapshotRestoreAwsec2Model } {
    return SnapshotRestoreAwsec2Model;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<SnapshotRestoreAwsec2PageComponent> {
    let me = this, factory: ComponentFactory<SnapshotRestoreAwsec2PageComponent>;
    switch (pageKey) {
      case 'summary':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2SummaryComponent>(
          SnapshotRestoreAwsec2SummaryComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2SourceComponent>(
          SnapshotRestoreAwsec2SourceComponent);
        break;
      case 'snapshot':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2SnapshotComponent>(
          SnapshotRestoreAwsec2SnapshotComponent);
        break;
      case 'destination':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2DestinationComponent>(
          SnapshotRestoreAwsec2DestinationComponent);
        break;
      case 'datastore':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2DatastoreComponent>(
          SnapshotRestoreAwsec2DatastoreComponent);
        break;
      case 'network':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2NetworkComponent>(
          SnapshotRestoreAwsec2NetworkComponent);
        break;
      case 'run-type':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2RunTypeComponent>(
          SnapshotRestoreAwsec2RunTypeComponent);
        break;
      case 'options':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2OptionsComponent>(
          SnapshotRestoreAwsec2OptionsComponent);
        break;
      case 'scripts':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2ScriptsComponent>(
          SnapshotRestoreAwsec2ScriptsComponent);
        break;
      case 'schedule':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreAwsec2ScheduleComponent>(
          SnapshotRestoreAwsec2ScheduleComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  buildPolicy(model: SnapshotRestoreAwsec2Model): void {
    model.getPayload();
  }

  applyPolicy(model: SnapshotRestoreAwsec2Model): Observable<any> {
    let me = this, editMode = model.editMode;
    return editMode ? me.service.updateRestoreJob(model.payload) : me.service.createRestoreJob(model.payload);
  }

  job2NodeRestorePolicy(job: JobModel): NodeRestorePolicyModel {
    return JsonConvert.deserializeObject(job, NodeRestorePolicyModel);
  }

  json2SubOption(json: object): HypervisorRestoreOptionsModel {
    return JsonConvert.deserializeObject(json, HypervisorRestoreOptionsModel);
  }

  playbackPolicy(model: SnapshotRestoreAwsec2Model): void {
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

  pickEditMode(model: JobModel): SnapshotRestoreAwsec2Model {
    let me = this,
      result: SnapshotRestoreAwsec2Model;
    super.pickEditMode(model);
    result = new SnapshotRestoreAwsec2Model();
    result.editMode = true;
    result.policy = me.job2NodeRestorePolicy(model);
    me.playbackPolicy(result);
    return result;
  }
}
