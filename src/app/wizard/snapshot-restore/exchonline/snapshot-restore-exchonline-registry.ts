import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {SnapshotRestoreExchOnlineModel} from './snapshot-restore-exchonline.model';
import {SnapshotRestoreExchOnlineSourceComponent} from './source/snapshot-restore-exchonline-source.component';
import {SnapshotRestoreExchOnlineSnapshotComponent} from './snapshot/snapshot-restore-exchonline-snapshot.component';
import {SnapshotRestoreExchOnlineDestinationComponent} from './destination/snapshot-restore-exchonline-destination.component';
import {SnapshotRestoreExchOnlineRunTypeComponent} from './run-type/snapshot-restore-exchonline-run-type.component';
import {
  SnapshotRestoreExchOnlineOptionsComponent
} from './options/snapshot-restore-exchonline-options.component';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from '../snapshot-restore-wizard.model';
import {SnapshotRestoreExchOnlineScriptsComponent} from './scripts/snapshot-restore-exchonline-scripts.component';
import {SnapshotRestoreExchOnlineScheduleComponent} from './schedule/snapshot-restore-exchonline-schedule.component';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {Observable} from 'rxjs/Observable';
import {JobModel} from 'job/shared/job.model';
import {NodeRestorePolicyModel} from 'app/manage-protection/applications/restore/node-restore-policy.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {ApplicationSubOptionModel} from 'app/manage-protection/applications/shared/application-sub-option.model';
import {SnapshotRestoreExchOnlineSummaryComponent} from './summary/snapshot-restore-exchonline-summary.component';

export type SnapshotRestoreExchOnlinePageComponent = SnapshotRestoreExchOnlineSummaryComponent
  | SnapshotRestoreExchOnlineSourceComponent
  | SnapshotRestoreExchOnlineSnapshotComponent
  | SnapshotRestoreExchOnlineDestinationComponent
  | SnapshotRestoreExchOnlineRunTypeComponent
  | SnapshotRestoreExchOnlineOptionsComponent
  | SnapshotRestoreExchOnlineScriptsComponent
  | SnapshotRestoreExchOnlineScheduleComponent;

@Injectable()
export class SnapshotRestoreExchOnlineRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_SNAPSHOT_RESTORE,
      subType: 'office365',
      title: 'wizard.job.textSnapshotRestoreTitle',
      subtitle: 'wizard.textExchangeOnline',
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
          key: 'destination', title: 'wizard.job.textSelectDestinationTitle'
        },
        {
          key: 'options', title: 'wizard.job.textOptionsTitle'
        },
        {
          key: 'review', title: 'wizard.textReview',
          review: true
        }
      ]
    }
  ];

  constructor(private resolver: ComponentFactoryResolver,
              private service: ApplicationRestoreService) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): SnapshotRestoreExchOnlineModel } {
    return SnapshotRestoreExchOnlineModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<SnapshotRestoreExchOnlinePageComponent> {
    let me = this, factory: ComponentFactory<SnapshotRestoreExchOnlinePageComponent>;
    switch (pageKey) {
      case 'summary':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineSummaryComponent>(
          SnapshotRestoreExchOnlineSummaryComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineSourceComponent>(
          SnapshotRestoreExchOnlineSourceComponent);
        break;
      case 'snapshot':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineSnapshotComponent>(
          SnapshotRestoreExchOnlineSnapshotComponent);
        break;
      case 'run-type':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineRunTypeComponent>(
          SnapshotRestoreExchOnlineRunTypeComponent);
        break;
      case 'destination':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineDestinationComponent>(
          SnapshotRestoreExchOnlineDestinationComponent);
        break;
      case 'options':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineOptionsComponent>(
          SnapshotRestoreExchOnlineOptionsComponent);
        break;
      case 'scripts':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineScriptsComponent>(
          SnapshotRestoreExchOnlineScriptsComponent);
        break;
      case 'schedule':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOnlineScheduleComponent>(
          SnapshotRestoreExchOnlineScheduleComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  protected disableVersion(recoveryType: string): boolean {
    return (recoveryType === 'fullrecovery' || recoveryType === 'pitrecovery');
  }

  buildPolicy(model: SnapshotRestoreExchOnlineModel): void {
    let me = this,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0],
      view = model.view.value,
      restoreItems = model.source,
      pitValue = model.pitValue,
      dbGroupValue = model.dbGroupValue,
      optionValue = model.optionValue,
      destination = model.originalLocation
        ? me.service.getOriginalDestinationPayload(model.mappingsValue,
          model.subPolicyType)
        : me.service.getDestinationPayload(view,
          model.destinationValue, model.mappingsValue, model.subPolicyType,
          dbGroupValue, model.runType);

    policy.spec.source = me.service.getSourcePayload(restoreItems,
      pitValue,
      me.disableVersion(model.subOption.recoveryType));

    if (model.useLatest){
      policy.siteModel = model.copyLocation;
      policy.offload = model.isOffload;
      if (model.isOffload) {
        policy.offloadType = model.offloadType;
      }
    } else {
      policy.siteModel = undefined;
      policy.offload = false;
    }
    subpolicy.type = model.subPolicyType;
    subpolicy.mode = model.runType;
    subpolicy.option = optionValue;
    destination['targetLocation'] = model.targetLocation;
    destination['targetPath'] = model.policy.spec.subpolicy[0].destination['targetPath'];
    if (model.targetLocation === 'alternate') {
      destination['metadata'] = model.metadata;
      destination['target'] = model.target;
    }
    subpolicy.destination = destination;
    if (model.useAlternateVsnap) {
      subpolicy.destination['storageserver'] =
        {'href': model.selectedStorage.getUrl('self')};
    }
    policy.script = model.script;
    policy.trigger = model.triggerValue;
    policy.subType = model.workflow;
    policy.spec.view = view;
    policy.name = model.scheduleName;
  }

  applyPolicy(model: SnapshotRestoreExchOnlineModel): Observable<any> {
    let me = this, policy = model.policy, editMode = model.editMode;
    return me.service.createUpdateRestoreJob(policy.getPersistentJson(), editMode);
  }

  job2NodeRestorePolicy(job: JobModel): NodeRestorePolicyModel {
    return JsonConvert.deserializeObject(job, NodeRestorePolicyModel);
  }

  json2SubOption(json: object): ApplicationSubOptionModel {
    return JsonConvert.deserializeObject(json, ApplicationSubOptionModel);
  }

  playbackPolicy(model: SnapshotRestoreExchOnlineModel): void {
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
    }

    model.subPolicyType = subpolicy.type;
    model.runType = model.subPolicyType === ApplicationRestoreService.IA_VAL ?
      ApplicationRestoreService.IA_VAL : subpolicy.mode;
    model.optionValue = subpolicy.option;
    model.targetLocation = destination['targetLocation'];
    model.originalLocation = ['original', 'originalPrimary'].indexOf(model.targetLocation) !== -1;

    if (subpolicy.destination &&
      subpolicy.destination['storageserver'] &&
      subpolicy.destination['storageserver'].href) {
      model.selectedStorageHref = subpolicy.destination['storageserver'].href;
      model.showAlternateVsnap = true;
      model.useAlternateVsnap = true;
    }

    model.script = policy.script;
    model.triggerValue = policy.trigger;
    model.view = new NvPairModel('', policy.spec.view);
    model.scheduleName = policy.name;
    if (model.optionValue && model.optionValue['applicationOption']) {
      model.subOption = me.json2SubOption(model.optionValue['applicationOption']);
      model.subOption.applicationType = model.workflow;
    }

    model.mappingsValue = subpolicy.destination['mapdatabase'];
  }

  pickEditMode(model: JobModel): SnapshotRestoreExchOnlineModel {
    let me = this,
      result: SnapshotRestoreExchOnlineModel;
    super.pickEditMode(model);
    result = new SnapshotRestoreExchOnlineModel();
    result.editMode = true;
    result.policy = me.job2NodeRestorePolicy(model);
    me.playbackPolicy(result);
    return result;
  }
}
