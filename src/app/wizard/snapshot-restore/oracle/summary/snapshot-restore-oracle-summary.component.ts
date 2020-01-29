import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreOracleModel} from '../snapshot-restore-oracle.model';
import {NodeRestorePolicyModel, SourceModel, SubpolicyModel} from 'applications/restore/node-restore-policy.model';
import {ApplicationRestoreService} from 'applications/restore/application-restore.service';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';
import {HrefArgsMetadataModel} from 'shared/components/post-scripts/href-args-metadata.model';
import {HrefNameModel} from 'shared/components/post-scripts/href-name.model';
import {Observable, Subject} from 'rxjs';
import {SitesModel} from 'site/sites.model';
import {SiteModel} from 'site/site.model';
import {SorterModel} from 'shared/models/sorter.model';
import {CloudsModel} from 'cloud/clouds.model';
import {CloudModel} from 'cloud/cloud.model';
import {RestService} from 'core';
import {InstanceModel} from 'applications/shared/instance.model';
import {OffloadInfo, VersionModel} from 'applications/shared/version.model';

@Component({
  selector: 'snapshot-restore-oracle-summary',
  templateUrl: './snapshot-restore-oracle-summary.component.html',
  styleUrls: ['../snapshot-restore-oracle.scss']
})
export class SnapshotRestoreOracleSummaryComponent extends WizardPage<SnapshotRestoreOracleModel> implements OnInit,
  OnDestroy {

  @ViewChild('summarySource', {read: TemplateRef})
  private _summarySource: TemplateRef<any>;

  @ViewChild('summarySnapshot', {read: TemplateRef})
  private _summarySnapshot: TemplateRef<any>;

  @ViewChild('summaryRunType', {read: TemplateRef})
  private _summaryRunType: TemplateRef<any>;

  @ViewChild('summaryDestination', {read: TemplateRef})
  private _summaryDestination: TemplateRef<any>;

  @ViewChild('summaryOptions', {read: TemplateRef})
  private _summaryOptions: TemplateRef<any>;

  @ViewChild('summaryScripts', {read: TemplateRef})
  private _summaryScripts: TemplateRef<any>;

  @ViewChild('summarySchedule', {read: TemplateRef})
  private _summarySchedule: TemplateRef<any>;

  private policy: NodeRestorePolicyModel;
  private clouds: CloudModel[];
  private sites: SiteModel[];
  private destination: InstanceModel;
  private copy: VersionModel;
  private subs: Subject<void> = new Subject<void>();

  get subPolicy(): SubpolicyModel {
    return this.policy.spec.subpolicy[0];
  }

  get summaryEntries(): SummaryEntry[] {
    let me = this;
    return [
      {title: 'wizard.job.textGroupSelectDataSources', content: me._summarySource},
      {content: me._summarySnapshot},
      {content: me._summaryRunType},
      {title: 'wizard.job.textSetDestinationTitle', content: me._summaryDestination},
      {title: 'wizard.job.textGroupSetRunSettings', content: me._summaryOptions},
      {content: me._summaryScripts},
      {content: me._summarySchedule}
    ];
  }

  constructor(private proxy: RestService) {
    super();
  }

  validate(silent: boolean): boolean {
    return true;
  }

  ngOnInit(): void {
    let me = this;
    me.policy = me.json2Policy(me.model.json());
    me.policy.script.setEnableScriptsFlags();
    me.loadSites();
    me.loadClouds();
    me.loadVersion();
    me.loadDestination();
  }

  ngOnDestroy(): void {
    let me = this;
    if (me.subs) {
      me.subs.next();
      me.subs.complete();
      me.subs.unsubscribe();
    }
  }

  json2Policy(json: object): NodeRestorePolicyModel {
    return JsonConvert.deserializeObject(json, NodeRestorePolicyModel);
  }

  //
  // source
  //
  get sourceValue(): string {
    return this.source.join(', ');
  }

  //
  // snapshot
  //
  get source(): string[] {
    let me = this, names: string[] = [], items = me.policy.spec.source;
    (items || []).forEach(function (item) {
      names.push(item.metadata['name']);
    });
    return names;
  }

  get sourceItems(): SourceModel[] {
    let me = this, items = me.policy.spec.source;
    return items || [];
  }

  get recoveryType(): string {
    let subPolicy = this.subPolicy;
    return this.hasApplicationOption ? this.applicationOption.recoveryType : 'recovery';
  }

  get isRecurring(): boolean {
    return this.restoreType === 'recurring';
  }

  get isPointInTime(): boolean {
    return this.restoreType === 'pointintime';
  }

  get restoreType(): string {
    let me = this, useLatest = me.latest, recoveryType = me.recoveryType,
      restoreType: string = '';
    if (!useLatest && recoveryType === 'recovery')
      restoreType = 'ondemand';
    else if (useLatest && recoveryType === 'pitrecovery')
      restoreType = 'pointintime';
    else if (useLatest && recoveryType === 'recovery')
      restoreType = 'recurring';
    return restoreType;
  }

  get selectedRestoreType(): string {
    let types = [
        {name: 'ondemand', text: 'wizard.job.textOnDemandSnapshot'},
        {name: 'pointintime', text: 'wizard.job.textOnDemandPIT'},
        {name: 'recurring', text: 'wizard.job.textRecurring'}
      ],
      restoreType = this.restoreType,
      target = types.find((item) => {
        return item.name === restoreType;
      });
    return target ? target.text : '';
  }

  get offloadType(): string {
    let subPolicy = this.subPolicy,
      result: string = '';

    if (this.isOffload) {
      result = subPolicy.source['copy']['offload']['type'];

    } else if (this.isCopySite) {
      result = 'site';
    }
    return result;
  }

  get selectedRestoreSourceType(): string {
    let rst = (this.isRecurring || this.isPointInTime) ? this.offloadType.toLowerCase() : this.restoreSourceType,
      result: string;

    switch (rst) {
      case 'site':
        result = 'common.textSite';
        break;
      case 'cloud':
        result = 'wizard.job.textCloudOffload';
        break;
      case 'repository':
        result = 'wizard.job.textRepoOffload';
        break;
      case 'archive':
        result = 'wizard.job.textCloudArchive';
        break;
      case 'tape':
        result = 'wizard.job.textRepoArchive';
        break;
      default:
        break;
    }
    return result;
  }

  get isOffload(): boolean {
    let subPolicy = this.subPolicy;
    return (subPolicy.source && subPolicy.source['copy'] && subPolicy.source['copy']['offload'] &&
      subPolicy.source['copy']['offload']['href']);
  }

  get isCopySite(): boolean {
    let subPolicy = this.subPolicy;
    return (subPolicy.source && subPolicy.source['copy'] && subPolicy.source['copy']['site'] &&
      subPolicy.source['copy']['site']['href']);
  }

  get selectedRestoreSourceItem(): string {
    let subPolicy = this.subPolicy,
      offloadType = this.offloadType,
      copy = this.copy,
      target: SiteModel | CloudModel,
      rst: string,
      copyLocationHref: string;

    if (this.isRecurring || this.isPointInTime) {
      if (this.isOffload) {
        copyLocationHref = subPolicy.source['copy']['offload']['href'];
      } else if (this.isCopySite) {
        copyLocationHref = subPolicy.source['copy']['site']['href'];
      }
      if (offloadType.toLowerCase() === 'site') {
        target = (this.sites || []).find(function (item) {
          return item.getId() === copyLocationHref;
        });
      } else {
        target = (this.clouds || []).find(function (item) {
          return item.getId() === copyLocationHref;
        });
      }
    } else if (copy) {
      rst = this.restoreSourceType;
      if (rst === 'site') {
        target = (this.sites || []).find(function (item) {
          return item.id === copy.siteId;
        });
      } else {
        target = (this.clouds || []).find(function (item) {
          let offloadInfo = copy.offloadInfo;
          return offloadInfo && item.id === copy.offloadInfo.offloadProviderId &&
            item.provider === offloadInfo.offloadProvider;
        });
      }
    }
    return target ? target.name : copyLocationHref;
  }

  get firstSource(): SourceModel {
    let items = this.sourceItems;
    return items && items.length > 0 ? items[0] : null;
  }

  get latest(): boolean {
    let first = this.firstSource;
    return first && this.useLatest(first);
  }

  private useLatest(item: SourceModel): boolean {
    return item.metadata && item.metadata['useLatest'] === true;
  }

  private version(item: SourceModel): number {
    return item.version && item.version['metadata'] && item.version['metadata']['protectionTime'] ?
      item.version['metadata']['protectionTime'] : 0;
  }

  private sourceItemName(item: SourceModel): string {
    return item.metadata['name'];
  }

  private loadSites(callback?: Function): void {
    let me = this, observable: Observable<SitesModel>;

    observable = SitesModel.retrieve<SiteModel, SitesModel>(SitesModel,
      me.proxy, undefined, [new SorterModel('name', 'ASC')],
      0, 0);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.sites = dataset.records || [];
          }
          if (callback)
            callback.call(me);
        },
        err => me.handleError(err)
      );
  }

  private loadClouds(callback?: Function): void {
    let me = this, observable: Observable<CloudsModel>;

    observable = CloudsModel.retrieve<CloudModel, CloudsModel>(CloudsModel,
      me.proxy, undefined, [new SorterModel('name', 'ASC')],
      0, 0);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.clouds = dataset.records || [];
          }
          if (callback)
            callback.call(me);
        },
        err => me.handleError(err)
      );
  }

  private hasSpecifiedVersion(item: SourceModel): boolean {
    return !this.useLatest(item) && item.version && item.version['copy'] && item.version['copy']['href'];
  }

  get restoreSourceType(): string {
    let me = this, rst: string, version = me.copy,
      offloadInfo: OffloadInfo = version ? version.offloadInfo : null,
      isOffload: boolean = version && version.isOffload(), isArchive: boolean = version && version.isArchive(),
      isCloud: boolean = offloadInfo && offloadInfo.offloadProvider !== 'sp',
      isRepository: boolean = offloadInfo && offloadInfo.offloadProvider === 'sp';
    if (isCloud && isOffload)
      rst = 'cloud';
    else if (isCloud && isArchive)
      rst = 'archive';
    else if (isRepository && isOffload)
      rst = 'repository';
    else if (isRepository && isArchive)
      rst = 'tape';
    else
      rst = 'site';

    return rst;
  }

  private loadVersion(): void {
    let me = this, first = me.firstSource, observable: Observable<VersionModel>,
      version: VersionModel;
    if (first && me.hasSpecifiedVersion(first)) {
      version = new VersionModel();
      version.links = {
        self: {
          rel: 'self',
          href: first.version['copy']['href']
        }
      };
      observable = version.getRecord<VersionModel>(VersionModel, 'self',
        me.proxy);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me.copy = record;
          },
          err => me.handleError(err)
        );
      }
    }
  }

  //
  // run-type
  //
  get runType(): string {
    let subPolicy = this.subPolicy,
      subPolicyType = subPolicy.type;
    return subPolicyType === ApplicationRestoreService.IA_VAL ?
      ApplicationRestoreService.IA_VAL : subPolicy.mode;
  }

  get runTypeString(): string {
    let runType = this.runType;
    switch (runType) {
      case 'test':
        return 'application.textTest';
      case 'IA':
        return 'application.textInstantAccess';
      case 'production':
        return 'application.textProduction';
      default:
        return 'wizard.job.textEmpty';
    }
  }

  //
  // destination
  //
  get target(): any {
    let subPolicy = this.subPolicy;
    return subPolicy.destination['target'];
  }

  get originalLocation(): boolean {
    return this.subPolicy.destination && !this.target;
  }

  get destinationName(): string {
    let me = this, name: string, target = me.target;
    if (target) {
      if (me.destination)
        name = me.destination.name;
      name = name || target.href;
    }
    return name;
  }

  get targetInstance(): InstanceModel {
    let instance: InstanceModel, target = this.target;
    if (target && target.resourceType === 'applicationinstance' && target.href) {
      instance = new InstanceModel();
      instance.links = {
        self: {
          rel: 'self',
          href: target.href
        }
      };
    }
    return instance;
  }

  private loadDestination(): void {
    let me = this, instance = me.targetInstance, observable: Observable<InstanceModel>;
    if (instance) {
      observable = instance.getRecord<InstanceModel>(InstanceModel, 'self', me.proxy);
      if (observable)
        observable.takeUntil(me.subs).subscribe(
          record => {
            me.destination = record;
          },
          err => me.handleError(err)
        );
    }
  }

  //
  // options
  //
  get options(): any {
    return this.subPolicy.option || {};
  }

  get applicationOption(): any {
    return this.options.applicationOption;
  }

  get hasApplicationOption(): boolean {
    return !!this.options.applicationOption;
  }

  get hasMaxParallelStreams(): boolean {
    return this.runType === 'production';
  }

  get hasInitParamsTemplateFile(): boolean {
    return this.options.applicationOption.initParams === 'template';
  }

  get hasMountPathPrefix(): boolean {
    return this.runType === ApplicationRestoreService.IA_VAL &&
      this.subPolicy.type === ApplicationRestoreService.IA_VAL;
  }

  get isSubPolicyTypeIA(): boolean {
    return this.subPolicy.type === ApplicationRestoreService.IA_VAL;
  }

  //
  // scripts
  //
  get scriptModel(): PostScriptsModel {
    return this.policy.script;
  }

  get preGuestScript(): HrefArgsMetadataModel {
    return this.scriptModel.preGuest ? this.scriptModel.preGuest.script : null;
  }

  get preGuestScriptName(): string {
    return this.preGuestScript.metadata['name'];
  }

  get postGuestScript(): HrefArgsMetadataModel {
    return this.scriptModel.postGuest ? this.scriptModel.postGuest.script : null;
  }

  get postGuestScriptName(): string {
    return this.postGuestScript.metadata['name'];
  }

  get hasPreScript(): boolean {
    let script = this.scriptModel,
      hasScript = script && this.preGuestScript;
    return !!hasScript;
  }

  get preScript(): string {
    return this.hasPreScript ? this.preGuestScriptName : null;
  }

  get hasPostScript(): boolean {
    let script = this.scriptModel,
      hasScript = script && this.postGuestScript;
    return !!hasScript;
  }

  get postScript(): string {
    return this.hasPostScript ? this.postGuestScriptName : null;
  }

  get isPreScriptServer(): boolean {
    let script = this.scriptModel;
    return this.hasPreScript && script.isPreScriptServer;
  }

  get preAppServer(): HrefNameModel {
    return this.scriptModel && this.scriptModel.preGuest && this.scriptModel.preGuest.appserver;
  }

  get postAppServer(): HrefNameModel {
    return this.scriptModel && this.scriptModel.postGuest && this.scriptModel.postGuest.appserver;
  }

  get preServer(): string {
    let appServer = this.preAppServer;
    return appServer ? appServer.name : null;
  }

  get isPostScriptServer(): boolean {
    let script = this.scriptModel;
    return this.hasPreScript && script.isPostScriptServer;
  }

  get postServer(): string {
    let appServer = this.postAppServer;
    return appServer ? appServer.name : null;
  }

  get continueScriptsOnError(): boolean {
    let script = this.scriptModel;
    return script.continueScriptsOnError;
  }

  //
  // schedule
  //
  get scheduleName(): string {
    return this.policy.name;
  }

  get activateDate(): number {
    let trigger = this.trigger;
    return trigger ? trigger.activateDate : null;
  }

  get rpo(): object {
    return {trigger: this.trigger};
  }

  get trigger(): any {
    return this.policy.trigger;
  }
}
