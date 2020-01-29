import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {SnapshotRestoreExchModel} from './snapshot-restore-exch.model';
import {SnapshotRestoreExchSourceComponent} from './source/snapshot-restore-exch-source.component';
import {SnapshotRestoreExchSnapshotComponent} from './snapshot/snapshot-restore-exch-snapshot.component';
import {SnapshotRestoreExchDestinationComponent} from './destination/snapshot-restore-exch-destination.component';
import {SnapshotRestoreExchRunTypeComponent} from './run-type/snapshot-restore-exch-run-type.component';
import {
  SnapshotRestoreExchOptionsComponent
} from './options/snapshot-restore-exch-options.component';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from '../snapshot-restore-wizard.model';
import {SnapshotRestoreExchScriptsComponent} from './scripts/snapshot-restore-exch-scripts.component';
import {SnapshotRestoreExchScheduleComponent} from './schedule/snapshot-restore-exch-schedule.component';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {Observable} from 'rxjs/Observable';
import {JobModel} from 'job/shared/job.model';
import {NodeRestorePolicyModel} from 'app/manage-protection/applications/restore/node-restore-policy.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {ApplicationSubOptionModel} from 'app/manage-protection/applications/shared/application-sub-option.model';
import {SnapshotRestoreExchSummaryComponent} from './summary/snapshot-restore-exch-summary.component';

export type SnapshotRestoreExchPageComponent = SnapshotRestoreExchSummaryComponent
  | SnapshotRestoreExchSourceComponent
  | SnapshotRestoreExchSnapshotComponent
  | SnapshotRestoreExchDestinationComponent
  | SnapshotRestoreExchRunTypeComponent
  | SnapshotRestoreExchOptionsComponent
  | SnapshotRestoreExchScriptsComponent
  | SnapshotRestoreExchScheduleComponent;

@Injectable()
export class SnapshotRestoreExchRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_SNAPSHOT_RESTORE,
      subType: 'exch',
      title: 'wizard.job.textSnapshotRestoreTitle',
      subtitle: 'wizard.textExchange',
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
          key: 'run-type', title: 'wizard.job.textRunTypeTitle',
          group: 'wizard.job.textGroupSelectDataSources'
        },
        {
          key: 'destination', title: 'wizard.job.textSetDestinationTitle'
        },
        {
          key: 'options', title: 'wizard.job.textOptionsTitle',
          group: 'wizard.job.textGroupSetRunSettings'
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
              private service: ApplicationRestoreService) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): SnapshotRestoreExchModel } {
    return SnapshotRestoreExchModel;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<SnapshotRestoreExchPageComponent> {
    let me = this, factory: ComponentFactory<SnapshotRestoreExchPageComponent>;
    switch (pageKey) {
      case 'summary':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchSummaryComponent>(
          SnapshotRestoreExchSummaryComponent);
        break;
      case 'source':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchSourceComponent>(
          SnapshotRestoreExchSourceComponent);
        break;
      case 'snapshot':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchSnapshotComponent>(
          SnapshotRestoreExchSnapshotComponent);
        break;
      case 'run-type':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchRunTypeComponent>(
          SnapshotRestoreExchRunTypeComponent);
        break;
      case 'destination':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchDestinationComponent>(
          SnapshotRestoreExchDestinationComponent);
        break;
      case 'options':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchOptionsComponent>(
          SnapshotRestoreExchOptionsComponent);
        break;
      case 'scripts':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchScriptsComponent>(
          SnapshotRestoreExchScriptsComponent);
        break;
      case 'schedule':
        factory = me.resolver.resolveComponentFactory<SnapshotRestoreExchScheduleComponent>(
          SnapshotRestoreExchScheduleComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  protected disableVersion(recoveryType: string): boolean {
    return (recoveryType === 'fullrecovery' || recoveryType === 'pitrecovery');
  }

  buildPolicy(model: SnapshotRestoreExchModel): void {
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

  applyPolicy(model: SnapshotRestoreExchModel): Observable<any> {
    let me = this, policy = model.policy, editMode = model.editMode;
    return me.service.createUpdateRestoreJob(policy.getPersistentJson(), editMode);
  }

  job2NodeRestorePolicy(job: JobModel): NodeRestorePolicyModel {
    return JsonConvert.deserializeObject(job, NodeRestorePolicyModel);
  }

  json2SubOption(json: object): ApplicationSubOptionModel {
    return JsonConvert.deserializeObject(json, ApplicationSubOptionModel);
  }

  playbackPolicy(model: SnapshotRestoreExchModel): void {
    let me = this,
      policy = model.policy,
      source = policy.spec.source,
      subpolicy = policy.spec.subpolicy[0],
      destination = subpolicy.destination;

    model.useLatest = source.findIndex(function (item) {
      return item.metadata && item.metadata['useLatest'] === true;
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

  pickEditMode(model: JobModel): SnapshotRestoreExchModel {
    let me = this,
      result: SnapshotRestoreExchModel;
    super.pickEditMode(model);
    result = new SnapshotRestoreExchModel();
    result.editMode = true;
    result.policy = me.job2NodeRestorePolicy(model);
    me.playbackPolicy(result);
    return result;
  }
}
