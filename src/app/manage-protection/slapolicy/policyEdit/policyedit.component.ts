import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, TemplateRef } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { JsonConvert } from 'json2typescript';
import { ModalDirective } from 'ngx-bootstrap';

import { SlapolicyModel } from '../shared/slapolicy.model';
import { SlapolicyNodeModel } from '../shared/slapolicy-node.model';
import { SlapolicyService } from '../shared/slapolicy.service';
import { AlertType, AlertComponent, ErrorHandlerComponent } from 'shared/components';
import { SessionService } from 'core';
import { SitesModel } from 'site/sites.model';
import { SiteModel } from 'site/site.model';
import { SiteService } from 'site/site.service';
import { DefineSchedule } from 'shared/components/define-schedule/define-schedule.component';
import { ScheduleModel } from 'shared/components/define-schedule/schedule.model';
import { CloudService } from 'cloud/cloud.service';
import { CloudModel } from 'cloud/cloud.model';
import { CloudsModel } from 'cloud/clouds.model';
import { SorterModel } from 'shared/models/sorter.model';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { NvPairModel } from 'shared/models/nvpair.model';
import { BaCard } from '../../../theme/components/baCard/baCard.component';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'policy-edit',
  styleUrls: ['./policyedit.component.scss'],
  templateUrl: './policyedit.component.html',
  providers: [SiteService, CloudService]
})
export class PolicyEditComponent implements OnInit {
  @ViewChild('childModal') childModal: ModalDirective;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  model: SlapolicyModel;
  @ViewChild('policyEditContainer') editContainer: BaCard;
  @ViewChild('rpoScheduleComponent') rpoSchedule: DefineSchedule;
  @ViewChild('rpoScheduleTypeSnapshotBackupComponent') rpoScheduleTypeSnapshotBackup: DefineSchedule;
  @ViewChild('snapshotScheduleComponent') snapshotSchedule: DefineSchedule;
  @ViewChild('snapshotScheduleTypeSnapshotBackupComponent') snapshotScheduleTypeSnapshotBackup: DefineSchedule;
  @ViewChild('vsrScheduleComponent') vsrSchedule: DefineSchedule;
  @ViewChild('vsrScheduleTypeSnapshotBackupComponent') vsrScheduleTypeSnapshotBackup: DefineSchedule;
  @ViewChild('cloudOffloadScheduleComponent') cloudOffloadSchedule: DefineSchedule;
  @ViewChild('cloudOffloadScheduleTypeSnapshotBackupComponent') cloudOffloadScheduleTypeSnapshotBackup: DefineSchedule;
  @ViewChild('cloudArchiveScheduleComponent') cloudArchiveSchedule: DefineSchedule;
  @ViewChild('cloudArchiveScheduleTypeSnapshotBackupComponent') cloudArchiveScheduleTypeSnapshotBackup: DefineSchedule;

  @Output() saveSuccess = new EventEmitter();
  @Output() cancelClick = new EventEmitter();

  get scrollableHolder(): Element {
    return this.editContainer && this.editContainer.elementRef ?
      this.editContainer.elementRef.nativeElement : undefined;
  }
  scrollableHolderMargin: number = 24;

  public form: FormGroup;
  public name: AbstractControl;

  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textConfirm: string;
  private textNewPolicy: string;
  private textEditPolicy: string;
  private textChangeSiteBackupTarget: string;
  private textConfirmDisablingVSnapReplication: string;
  private textWormDefaultRetention: string = 'DEFAULT RETENTION: {0}';
  private textCloudServers: string;
  private textRepositoryServers: string;
  private textArchiveCloudServers: string;
  private textArchiveRepositoryServers: string;
  private textReducingRententionWarningMessage: string;
  private softwareBackup: boolean;
  private disableCloudRetentionIfWorm: boolean = false;
  private disableArchiveRetentionIfWorm: boolean = false;
  private wormCloudRetention: number = undefined;
  private wormArchiveRetention: number = undefined;
  private useVsnap: boolean = false;
  private retentionBackupTarget: number;
  private retentionSnapshot: number;
  private retentionReplication: number;
  private retentionReplicationCloud: number;
  private retentionReplicationArchive: number;
  private retentionTypeBackupTarget: string;
  private retentionTypeSnapshot: string;
  private retentionTypeReplication: string;
  private retentionTypeReplicationCloud: string;
  private retentionTypeReplicationArchive: string;
  private snapshotProtectionLabel: string;
  private retentionSnapshotBackupTarget: number;
  private retentionTypeSnapshotBackupTarget: string;
  private siteReplication: string;
  private cloudOffloadSource: string;
  private cloudArchiveSource: string;
  private cloudOffloadTarget: CloudModel;
  private cloudArchiveTarget: CloudModel;
  private siteBackupTarget: string;
  private enableMainPolicyBackup: boolean;
  private enableVsnapReplication: boolean;
  private enableCloudOffload: boolean;
  private enableArchive: boolean;
  private backupToEncryptedVSnapOnly: boolean = false;
  private replicateToEncryptedVSnapOnly: boolean = false;
  private snapshot: boolean;
  private sites: Array<SiteModel>;
  private clouds: Array<CloudModel>;
  private repos: Array<CloudModel>;
  private archiveClouds: Array<CloudModel>;
  private archiveRepos: Array<CloudModel>;
  private offloadTargets: Array<CloudModel>;
  private archiveTargets: Array<CloudModel>;
  private oldSiteBackupTarget: string;
  private oldSiteReplication: string;
  private masked: boolean = false;
  private offloadTypes: Array<NvPairModel> = [new NvPairModel('Cloud Servers', 'clouds'), new NvPairModel('Repository Servers', 'repos')];
  private archiveTypes: Array<NvPairModel> = [new NvPairModel('Archive Cloud Servers', 'archiveClouds'), new NvPairModel('Archive Repository Servers', 'archiveRepos')];
  private selectedOffloadType: NvPairModel;
  private selectedArchiveType: NvPairModel;
  private targetSite = []; //To store the modified options in the 'target Site' field of the Edit/New SLA Policy
  private sameRetentionAsSourceSelection: boolean = true;
  private sameRetentionAsSourceSelectionCloud: boolean = true;
  private subs: Subject<void> = new Subject<void>();
  private backupFrequency: number = 0;
  private offloadFrequency: number = 0;
  private backupFrequencyDisabled: boolean = false;
  private offloadFrequencyDisabled: boolean = false;
  private showFrequencyValidationMessage: boolean = false;
  private previousRetention: number = -1;

  constructor(private siteService: SiteService, private cloudService: CloudService,
    private policyService: SlapolicyService, fb: FormBuilder,
    private translate: TranslateService) {
    this.form = fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.name = this.form.controls['name'];
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  confirm(message: string, handlerOK: Function, handlerCancel: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message,
        AlertType.CONFIRMATION, handlerOK, handlerCancel);
  }

  ngOnInit() {
    let me = this;
    me.initDropdowns();
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'slapolicy.textCreateSucceed',
      'slapolicy.textNewPolicy',
      'slapolicy.textEditPolicy',
      'slapolicy.textChangeSiteBackupTarget',
      'slapolicy.textConfirmDisablingVSnapReplication',
      'slapolicy.textWormDefaultRetention',
      'slapolicy.textCloudServers',
      'slapolicy.textRepositoryServers',
      'slapolicy.textArchiveCloudServers',
      'slapolicy.textArchiveRepositoryServers',
      'slapolicy.textReducingRententionWarningMessage'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['slapolicy.textCreateSucceed'];
        me.textNewPolicy = resource['slapolicy.textNewPolicy'];
        me.textEditPolicy = resource['slapolicy.textEditPolicy'];
        me.textChangeSiteBackupTarget = resource['slapolicy.textChangeSiteBackupTarget'];
        me.textConfirmDisablingVSnapReplication = resource['slapolicy.textConfirmDisablingVSnapReplication'];
        me.textWormDefaultRetention = resource['slapolicy.textWormDefaultRetention'];
        me.textCloudServers = resource['slapolicy.textCloudServers'];
        me.textRepositoryServers = resource['slapolicy.textRepositoryServers'];
        me.textArchiveCloudServers = resource['slapolicy.textArchiveCloudServers'];
        me.textArchiveRepositoryServers = resource['slapolicy.textArchiveRepositoryServers'];
        me.textReducingRententionWarningMessage = resource['slapolicy.textReducingRententionWarningMessage'];
        me.offloadTypes = [new NvPairModel(this.textCloudServers, 'clouds'), new NvPairModel(this.textRepositoryServers, 'repos')];
        me.archiveTypes = [new NvPairModel(this.textArchiveCloudServers, 'archiveClouds'), new NvPairModel(this.textArchiveRepositoryServers, 'archiveRepos')];
        me.initDropdowns();
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.loadSites();
    me.loadClouds();
    me.reset();
    me.enableMainPolicyBackup = true;
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  newModel() {
    let model = new SlapolicyModel();
    model.version = '1.0';
    model.spec = {
      simple: true,
      subpolicy: []
    };
    return model;
  }

  getSites() {
    let me = this;
    if (me.model && me.model.spec && me.model.spec['demo'] === true) {
      return me.targetSite;
    }
    return me.sites;
  }

  /**
   * Compare brackup frequency and offload frequency, and display correspond message
   * @param frequency 
   * @param type 
   */
  validateFrequency(frequency: number, type: string) {
    let me = this;
    if (type === 'backup') {
      me.backupFrequency = frequency;
    } else {
      me.offloadFrequency = frequency;
    }
    this.updateFrequencyWarningMessage();
  }

  defineScheduleDisabled(disabled: boolean, type: string) {
    let me = this;
    if (type === 'backup') {
      me.backupFrequencyDisabled = disabled;
    } else {
      me.offloadFrequencyDisabled = disabled;
    }
    this.updateFrequencyWarningMessage();
  }

  updateFrequencyWarningMessage() {
    let me = this;
    me.showFrequencyValidationMessage = !me.backupFrequencyDisabled &&
      !me.offloadFrequencyDisabled &&
      me.enableCloudOffload &&
      me.backupFrequency < me.offloadFrequency;
  }

  loadSites() {
    let me = this;

    me.siteService.getAll(false)
      .subscribe(
        data => {
          let dataset = JsonConvert.deserializeObject(data, SitesModel);
          me.sites = <Array<SiteModel>>dataset.records;
        },
        err => me.handleError(err, false),
        () => {
          me.targetSite = me.sites.filter((value, index, arr) => {
            return value.demo === true;
          });

          me.sites = me.sites.filter((value, index, arr) => {
            return value.demo === false;
          });

          me.resetSites();
        }
      );
  }

  loadClouds(): void {
    let me = this, observable: Observable<CloudsModel>;

    me.clouds = [];
    me.repos = [];
    me.archiveRepos = [];
    me.archiveClouds = [];
    me.mask();
    observable = CloudsModel.retrieve<CloudModel, CloudsModel>(CloudsModel,
      me.cloudService.proxy, undefined, [new SorterModel('name', 'ASC')],
      0, 0);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            (dataset.records || []).forEach(function (item) {
              if (item.offloadEnabled === true) {
                if (item.provider === 'sp') {
                  me.repos.push(item);
                } else {
                  me.clouds.push(item);
                }
              }

              if (item.archiveEnabled === true) {
                if (item.provider === 'sp') {
                  me.archiveRepos.push(item);
                } else {
                  me.archiveClouds.push(item);
                }
              }
            });

            if (me.clouds && me.clouds.length > 0) {
              me.offloadTargets = me.clouds;
            }

            if (me.archiveClouds && me.archiveClouds.length > 0) {
              me.archiveTargets = me.archiveClouds;
            }

            me.unmask();
          }
        },
        err => {
          me.handleError(err);
          me.unmask();
        }
      );
  }

  onSelectArchiveTypeClick(item: NvPairModel): void {
    let me = this, crumb;

    if (me.selectedArchiveType.value !== item.value) {
      me.selectedArchiveType = item;
      if (me.selectedArchiveType.value === 'archiveClouds') {
        me.archiveTargets = me.archiveClouds;
        me._setCloudArchiveTarget(undefined);
      }
      else if (me.selectedArchiveType.value === 'archiveRepos') {
        me.archiveTargets = me.archiveRepos;
        me._setCloudArchiveTarget(undefined);
      }
    }
  }

  onSelectOffloadTypeClick(item: NvPairModel): void {
    let me = this, crumb;

    if (me.selectedOffloadType.value !== item.value) {
      me.selectedOffloadType = item;
      if (me.selectedOffloadType.value === 'clouds') {
        me.offloadTargets = me.clouds;
        me._setCloudOffloadTarget(undefined);
      }
      else if (me.selectedOffloadType.value === 'repos') {
        me.offloadTargets = me.repos;
        me._setCloudOffloadTarget(undefined);
      }
    }
  }

  onSelectCloudClick(item: CloudModel): void {
    this._setCloudOffloadTarget(item);
  }

  onSelectArchiveClick(item: CloudModel): void {
    this._setCloudArchiveTarget(item);
  }


  onSelectSiteReplication(item: SiteModel): void {
    this.siteReplication = item.name;
  }

  reset(): void {
    let me = this;
    me.softwareBackup = true;
    me.retentionBackupTarget = 15;
    me.retentionSnapshot = 15;
    me.retentionReplication = 15;
    me.retentionReplicationCloud = 15;
    me.retentionReplicationArchive = 3;
    // Snapshot Protection
    me.retentionSnapshotBackupTarget = 15;
    me.retentionTypeBackupTarget = 'age';
    me.retentionTypeSnapshotBackupTarget = 'age';
    me.retentionTypeSnapshot = 'age';
    me.retentionTypeReplication = 'age';
    me.retentionTypeReplicationCloud = 'age';
    me.retentionTypeReplicationArchive = 'age-months';
    me.snapshot = false;
    me.useVsnap = false;
    // me.enableMainPolicyBackup = false;
    me.enableVsnapReplication = false;
    me.enableCloudOffload = false;
    me.enableArchive = false;
    me.sameRetentionAsSourceSelection = true;
    me.sameRetentionAsSourceSelectionCloud = true;
    me.backupToEncryptedVSnapOnly = false;
    me.replicateToEncryptedVSnapOnly = false;

    me.resetSites();
    me._resetRpoSchedule();
    me._resetSnapshotSchedule();
    me._resetVsrSchedule();
    me._resetCloudOffloadSchedule();
    me._resetCloudArchiveSchedule();
    me.cloudOffloadTarget = undefined;
    me.disableCloudRetentionIfWorm = false;
    me.cloudOffloadSource = 'backup';
    me.cloudArchiveSource = 'backup';

    me.model = me.newModel();
    me.populateModel();

    me.name.reset();
    me.name.enable({ onlySelf: true });
    me.snapshotProtectionLabel = '';
  }

  resetSites(): void {
    let me = this,
      set = false;
    if (me.getSites() && me.getSites().length > 0) {
      // Loop through sites and use default site (defaultSite=true) as set as default
      me.getSites().forEach(function (eachSite: SiteModel) {
        if (eachSite.defaultSite === true) {
          me.siteBackupTarget = eachSite.name;
          set = true;
        }
      });
      if (!set) {
        me.siteBackupTarget = me.getSites()[0].name;
      }
      // Set site for replication
      if (me.siteBackupTarget) {
        let siteReplication = me.getSites().find(function (eachSite: SiteModel) {
          return (eachSite.name !== me.siteBackupTarget);
        });
        if (siteReplication)
          me.siteReplication = siteReplication.name;
      }
      // Remember old site for later change detection.
      me.oldSiteBackupTarget = me.siteBackupTarget;
      me.oldSiteReplication = me.siteReplication;
    }
  }

  onCancelClick(): void {
    this.reset();
    this.cancelClick.emit();
    // Scroll Page to the top
    let element = document.getElementById('scrollToTop');
    element.scrollIntoView();
  }

  onSaveClick(): void {
    let me = this;
    let converted = this._convertFrontToBack(me.retentionTypeBackupTarget, me.retentionBackupTarget);
    let convertedSnapshot =
      this._convertFrontToBack(me.retentionTypeSnapshotBackupTarget, me.retentionSnapshotBackupTarget);
    if ((this.isEdit() && me.previousRetention > converted.value) ||
      (this.isEdit() && me.previousRetention > convertedSnapshot.value)
    ) {
      if (me.alert)
        me.alert.show(me.textConfirm, SharedService.formatString(me.textReducingRententionWarningMessage),
          AlertType.DANGEROK, function () {
            me.onSaveClickHandler();
          });
    } else {
      me.onSaveClickHandler();
    }
  }
  onSaveClickHandler(): void {
    let me = this;
    if ((me.form.valid || !me.model.phantom) && me.populateModel()) {
      me.mask();
      if (me.model.phantom) {
        me.policyService.create(me.model)
          .subscribe(
            data => {
              me.unmask();
              // Cast the JSON object to SlapolicyModel instance.
              let vCenter = JsonConvert.deserializeObject(data, SlapolicyNodeModel).response;
              if (vCenter.getId()) {
                me.info(me.textCreateSucceed);
                me.reset();
                me.saveSuccess.emit();
                me.policyService.updateTable();
              }
            },
            err => {
              me.unmask();
              me.handleError(err, true);
            }
          );
      } else {
        me.policyService.update(me.model)
          .subscribe(
            data => {
              me.unmask();
              // Cast the JSON object to SlapolicyModel instance.
              let vCenter = JsonConvert.deserializeObject(data, SlapolicyModel);
              if (vCenter.getId()) {
                me.reset();
                me.saveSuccess.emit();
                me.policyService.updateTable();
              }
            },
            err => {
              me.unmask();
              me.handleError(err, true);
            }
          );
      }
    }
    // Scroll Page to the top
    let element = document.getElementById('scrollToTop');
    element.scrollIntoView();
  }

  startEdit(item: SlapolicyModel): void {
    let me = this;
    me.model = item;
    me.populateFields();
    me.name.disable({ onlySelf: true });
    if (!item.slaType) {
      item.slaType = 'backup'
    }
  }

  private initDropdowns(): void {
    let me = this;
    me.selectedOffloadType = me.offloadTypes[0];
    me.onSelectOffloadTypeClick(me.selectedOffloadType);
    me.selectedArchiveType = me.archiveTypes[0];
    me.onSelectArchiveTypeClick(me.selectedArchiveType);
  }

  private isEmpty(value: any) {
    return value === undefined || value === null || !(Object.keys(value).length > 0);
  }

  private populateFields(): void {
    let me = this, retention, rpo, converted,
      subpolicy = me.model.spec['subpolicy'] as Array<Object>,
      backupTarget = subpolicy.find(function (item) {
        return item['type'] === 'REPLICATION' && item['software'];
      }),
      snapshot = subpolicy.find(function (item) {
        return item['type'] === 'SNAPSHOT';
      }),
      replication = subpolicy.find(function (item) {
        return item['type'] === 'REPLICATION' && !item['software'];
      }),
      cloudOffload = subpolicy.find(function (item) {
        return item['type'] === 'SPPOFFLOAD';
      }),
      cloudArchive = subpolicy.find(function (item) {
        return item['type'] === 'SPPARCHIVE';
      });

    me.useVsnap = false;
    // if (!backupTarget) {
    //   backupTarget = {};
    // }
    if (backupTarget) {
      me.enableMainPolicyBackup = true;
      rpo = backupTarget['trigger'] || {};
      me.rpoSchedule.model = JsonConvert.deserializeObject(rpo, ScheduleModel);
      me.rpoSchedule.parseDate();
      me.rpoScheduleTypeSnapshotBackup.model = JsonConvert.deserializeObject(rpo, ScheduleModel);
      me.rpoScheduleTypeSnapshotBackup.parseDate();

      retention = backupTarget['retention'] || {};

      converted = (retention['age']) ?
        this._convertBackToFront('age', retention['age'])
        : this._convertBackToFront('numsnapshots', retention['numsnapshots']);
      me.retentionBackupTarget = converted.value;
      me.retentionTypeBackupTarget = converted.type;

      me.backupToEncryptedVSnapOnly = backupTarget['useEncryption'];

      me.siteBackupTarget = backupTarget['site'];

      me.previousRetention = retention['age'] ? retention['age'] : retention['numsnapshots'];
    } else {
      me.enableMainPolicyBackup = false;
      if (me.vsrSchedule) {
        me._resetVsrSchedule();
      }
      if (me.vsrScheduleTypeSnapshotBackup) {
        me._resetVsrSchedule();
      }
    }

    if (snapshot) {
      me.snapshot = true;
      retention = snapshot['retention'] || {};
      me.retentionTypeSnapshot = retention['age'] ? 'age' : 'numsnapshots';
      me.retentionSnapshot = retention[me.retentionTypeSnapshot];
      // me.softwareBackup = snapshot['software'];
      me.previousRetention = retention['age'] ? retention['age'] : retention['numsnapshots'];
      let snapshotConverted = (retention['age']) ?
        this._convertBackToFront('age', retention['age'])
        : this._convertBackToFront('numsnapshots', retention['numsnapshots']);
      // me.retentionBackupTarget = snapshotConverted.value;
      me.retentionSnapshotBackupTarget = snapshotConverted.value;
      me.retentionTypeSnapshotBackupTarget = snapshotConverted.type;
      me.snapshotProtectionLabel = snapshot['label'] || '';
      let rpoSnapshot = snapshot['trigger'] || {};
      me.snapshotSchedule.model = JsonConvert.deserializeObject(rpoSnapshot, ScheduleModel);
      me.snapshotSchedule.parseDate();
      me.snapshotScheduleTypeSnapshotBackup.model = JsonConvert.deserializeObject(rpoSnapshot, ScheduleModel);
      me.snapshotScheduleTypeSnapshotBackup.parseDate();
    }
    if (replication) {
      me.enableVsnapReplication = true;
      retention = replication['retention'] || {};
      me.sameRetentionAsSourceSelection = me.isEmpty(retention);
      me.replicateToEncryptedVSnapOnly = replication['useEncryption'];

      if (!me.sameRetentionAsSourceSelection) {
        converted = (retention['age']) ?
          this._convertBackToFront('age', retention['age'])
          : this._convertBackToFront('numsnapshots', retention['numsnapshots']);

        me.retentionTypeReplication = converted.type;
        me.retentionReplication = converted.value;
      }

      me.siteReplication = replication['site'];
      try {
        if (replication['trigger']) {
          me.vsrSchedule.model = JsonConvert.deserializeObject(replication['trigger'], ScheduleModel);
          me.vsrSchedule.parseDate();
          me.vsrScheduleTypeSnapshotBackup.model = JsonConvert.deserializeObject(replication['trigger'], ScheduleModel);
          me.vsrScheduleTypeSnapshotBackup.parseDate();
        }
      } catch (e) { }
    } else {
      me.enableVsnapReplication = false;
      if (me.vsrSchedule) {
        me._resetVsrSchedule();
      }
      if (me.vsrScheduleTypeSnapshotBackup) {
        me._resetVsrSchedule();
      }
    }
    if (cloudOffload) {
      me.enableCloudOffload = true;
      retention = cloudOffload['retention'] || {};
      me.cloudOffloadSource = cloudOffload['source'] || 'backup';
      me.sameRetentionAsSourceSelectionCloud = me.isEmpty(retention);
      if (!me.sameRetentionAsSourceSelectionCloud) {
        converted = (retention['age']) ?
          this._convertBackToFront('age', retention['age'])
          : this._convertBackToFront('numsnapshots', retention['numsnapshots']);

        me.retentionTypeReplicationCloud = converted.type;
        me.retentionReplicationCloud = converted.value;
      }
      if (cloudOffload['target']['resourceType'] !== 'sp') {
        me.onSelectOffloadTypeClick(me.offloadTypes[0]);
        me.clouds.find(function (cloud) {
          if (cloud.getId() === cloudOffload['target'].href) {
            me._setCloudOffloadTarget(cloud);
          }
          return undefined;
        });
      } else {
        me.onSelectOffloadTypeClick(me.offloadTypes[1]);
        me.repos.find(function (cloud) {
          if (cloud.getId() === cloudOffload['target'].href) {
            me._setCloudOffloadTarget(cloud);
          }
          return undefined;
        });
      }

      try {
        if (cloudOffload['trigger']) {
          me.cloudOffloadSchedule.model = JsonConvert.deserializeObject(cloudOffload['trigger'], ScheduleModel);
          me.cloudOffloadSchedule.parseDate();
          me.cloudOffloadScheduleTypeSnapshotBackup.model = JsonConvert.deserializeObject(cloudOffload['trigger'], ScheduleModel);
          me.cloudOffloadScheduleTypeSnapshotBackup.parseDate();
        }
      } catch (e) { }
    }

    if (cloudArchive) {
      me.enableArchive = true;
      retention = cloudArchive['retention'] || {};
      me.cloudArchiveSource = cloudArchive['source'] || 'backup';
      converted = (retention['age']) ?
        this._convertBackToFront('age', retention['age'])
        : this._convertBackToFront('numsnapshots', retention['numsnapshots']);

      me.retentionTypeReplicationArchive = converted.type;
      me.retentionReplicationArchive = converted.value;
      if (cloudArchive['target']['resourceType'] !== 'sp') {
        me.onSelectArchiveTypeClick(me.archiveTypes[0]);
        me.archiveClouds.find(function (cloud) {
          if (cloud.getId() === cloudArchive['target'].href) {
            me._setCloudArchiveTarget(cloud);
          }
          return undefined;
        });
      } else {
        me.onSelectArchiveTypeClick(me.archiveTypes[1]);
        me.archiveRepos.find(function (cloud) {
          if (cloud.getId() === cloudArchive['target'].href) {
            me._setCloudArchiveTarget(cloud);
          }
          return undefined;
        });
      }

      try {
        if (cloudArchive['trigger']) {
          me.cloudArchiveSchedule.model = JsonConvert.deserializeObject(cloudArchive['trigger'], ScheduleModel);
          me.cloudArchiveSchedule.parseDate();
          me.cloudArchiveScheduleTypeSnapshotBackup.model = JsonConvert.deserializeObject(cloudArchive['trigger'], ScheduleModel);
          me.cloudArchiveScheduleTypeSnapshotBackup.parseDate();
        }
      } catch (e) { }
    }
    // Remember old site for later change detection.
    me.oldSiteBackupTarget = me.siteBackupTarget;
    me.oldSiteReplication = me.siteReplication;
  }

  private populateModel(): boolean {
    let me = this, retention = {},
      rpo = {},
      snapshotProtectionRpo = {},
      vsrTrigger = {},
      cloudOffloadTrigger = {},
      archiveTrigger = {},
      subpolicy = me.model.spec['subpolicy'] as Array<Object>;
    if (me.rpoSchedule) {
      rpo = me.rpoSchedule.getSchedule();
    }
    if (me.rpoScheduleTypeSnapshotBackup && me.model && me.model.slaType === 'snapshot_backup') {
      rpo = me.rpoScheduleTypeSnapshotBackup.getSchedule();
    }
    if (me.snapshotSchedule) {
      snapshotProtectionRpo = me.snapshotSchedule.getSchedule();
    }
    if (me.snapshotScheduleTypeSnapshotBackup && me.model && me.model.slaType === 'snapshot_backup') {
      snapshotProtectionRpo = me.snapshotScheduleTypeSnapshotBackup.getSchedule();
    }
    if (me.vsrSchedule) {
      vsrTrigger = me.vsrSchedule.getSchedule();
    }
    if (me.vsrScheduleTypeSnapshotBackup && me.model && me.model.slaType === 'snapshot_backup') {
      vsrTrigger = me.vsrScheduleTypeSnapshotBackup.getSchedule();
    }
    if (me.cloudOffloadSchedule) {
      cloudOffloadTrigger = me.cloudOffloadSchedule.getSchedule();
    }
    if (me.cloudOffloadScheduleTypeSnapshotBackup && me.model && me.model.slaType === 'snapshot_backup') {
      cloudOffloadTrigger = me.cloudOffloadScheduleTypeSnapshotBackup.getSchedule();
    }
    if (me.cloudArchiveSchedule) {
      archiveTrigger = me.cloudArchiveSchedule.getSchedule();
    }
    if (me.cloudArchiveScheduleTypeSnapshotBackup && me.model && me.model.slaType === 'snapshot_backup') {
      archiveTrigger = me.cloudArchiveScheduleTypeSnapshotBackup.getSchedule();
    }
    subpolicy.splice(0);
    let converted: any
    if (me.enableMainPolicyBackup) {
      retention = {};
      converted = this._convertFrontToBack(me.retentionTypeBackupTarget, me.retentionBackupTarget);
      retention[converted.type] = Number(converted.value);
      subpolicy.push(
        {
          type: 'REPLICATION',
          software: me.softwareBackup,
          retention: retention,
          useEncryption: this.backupToEncryptedVSnapOnly,
          trigger: rpo,
          site: me.siteBackupTarget
        }
      );
    }
    // if (me.snapshot) {
    //   retention = {};
    //   retention[me.retentionTypeSnapshot] = Number(me.retentionSnapshot);
    //   subpolicy.push(
    //     {
    //       type: 'SNAPSHOT',
    //       software: me.softwareBackup,
    //       retention: retention
    //     }
    //   );
    // }
    if (me.enableVsnapReplication) {
      retention = {};

      if (!me.sameRetentionAsSourceSelection) {
        converted = this._convertFrontToBack(me.retentionTypeReplication, me.retentionReplication);
        retention[converted.type] = Number(converted.value);
      }

      subpolicy.push(
        {
          type: 'REPLICATION',
          retention: retention,
          useEncryption: this.replicateToEncryptedVSnapOnly,
          software: !me.softwareBackup,
          trigger: vsrTrigger,
          site: me.siteReplication // Currently the Node API only supports the site name
        });
    }
    if (me.enableCloudOffload) {
      retention = {};

      if (!me.sameRetentionAsSourceSelectionCloud) {
        converted = this._convertFrontToBack(me.retentionTypeReplicationCloud, me.retentionReplicationCloud);
        retention[converted.type] = Number(converted.value);
      }

      subpolicy.push(
        {
          type: 'SPPOFFLOAD',
          retention: retention,
          trigger: cloudOffloadTrigger,
          source: this.cloudOffloadSource,
          target: {
            href: this.cloudOffloadTarget.getId(),
            resourceType: this.cloudOffloadTarget.provider,
            id: this.cloudOffloadTarget.id,
            wormProtected: this.cloudOffloadTarget.wormProtected
          }
        });
    }

    if (me.enableArchive) {
      retention = {};

      converted = this._convertFrontToBack(me.retentionTypeReplicationArchive, me.retentionReplicationArchive);
      retention[converted.type] = Number(converted.value);

      subpolicy.push(
        {
          type: 'SPPARCHIVE',
          retention: retention,
          trigger: archiveTrigger,
          source: this.cloudArchiveSource,
          target: {
            href: this.cloudArchiveTarget.getId(),
            resourceType: this.cloudArchiveTarget.provider,
            id: this.cloudArchiveTarget.id,
            wormProtected: this.cloudArchiveTarget.wormProtected
          }
        });
    }
    if (me.snapshot) {
      retention = {};
      converted = this._convertFrontToBack(me.retentionTypeSnapshotBackupTarget, me.retentionSnapshotBackupTarget);
      retention[converted.type] = Number(converted.value);
      subpolicy.push(
        {
          name: 'Storage Snapshot',
          description: 'Storage Snapshot',
          type: 'SNAPSHOT',
          retention: retention,
          trigger: snapshotProtectionRpo,
          label: me.snapshotProtectionLabel
        }
      );
    }

    // } else {
    // let converted = this._convertFrontToBack(me.retentionTypeSnapshotBackupTarget, me.retentionSnapshotBackupTarget);
    // retention[converted.type] = Number(converted.value);
    // subpolicy.push(
    //   {
    //     name: 'Storage Snapshot',
    //     description : 'Storage Snapshot',
    //     type: 'SNAPSHOT',
    //     retention: retention,
    //     trigger: snapshotProtectionRpo,
    //     label: me.snapshotProtectionLabel
    //   }
    // );
    // }

    return true;
  }

  private isValid(): boolean {
    let me = this;
    return (me.form.valid || !me.model.phantom) && (me.rpoSchedule.isValid() || me.rpoScheduleTypeSnapshotBackup.isValid()) && me.retentionValid() && me.snapshotProtectionRetentionValid() && (me.model.phantom ? me.model.slaType: true)
      /*&& (!me.offload || me.offloadSchedule.isValid())*/
      && (me.enableMainPolicyBackup || me.snapshot)
      && (!me.enableVsnapReplication || me.vsrSchedule.isValid() || me.vsrScheduleTypeSnapshotBackup.isValid() && !!me.siteReplication)
      && (!me.enableArchive || me.cloudArchiveSchedule.isValid() || me.cloudArchiveScheduleTypeSnapshotBackup.isValid() && me.cloudArchiveTarget !== undefined)
      && (!me.enableCloudOffload || me.cloudOffloadSchedule.isValid() || me.cloudOffloadScheduleTypeSnapshotBackup && me.cloudOffloadTarget !== undefined)
      && (!me.snapshot || me.snapshotSchedule.isValid() || me.snapshotScheduleTypeSnapshotBackup.isValid());
    // } else {
    // return (me.form.valid || !me.model.phantom) && me.rpoSchedule.isValid() && me.snapshotProtectionRetentionValid();
    // }

  }

  // Snapshot protection
  private isSnapshotProtectionBackupDanger(): boolean {
    return this.retentionTypeSnapshotBackupTarget === 'numsnapshots';
  }

  // SPP-6048: Retention by snapshot is deprecated. 
  private isSnapshotBackupDanger(): boolean {
    return this.retentionTypeBackupTarget === 'numsnapshots';
  }

  private isSnapshotReplicationDanger(): boolean {
    return this.retentionTypeReplication === 'numsnapshots' && !this.sameRetentionAsSourceSelection && this.enableVsnapReplication;
  }

  private isSnapshotCloudDanger(): boolean {
    return this.retentionTypeReplicationCloud === 'numsnapshots' && !this.sameRetentionAsSourceSelectionCloud && this.enableCloudOffload;
  }

  private snapshotProtectionRetentionValid(): boolean {
    return !(this.retentionSnapshotBackupTarget === undefined ||
      this.retentionSnapshotBackupTarget < 1 || /* this.retentionBackupTarget > 365 || */
      this.retentionSnapshotBackupTarget % 1 !== 0);
  }

  private retentionValid(): boolean {
    return !(this.retentionBackupTarget === undefined ||
      this.isSnapshotBackupDanger() ||
      this.isSnapshotReplicationDanger() ||
      this.isSnapshotCloudDanger() ||
      this.retentionBackupTarget < 1 || /* this.retentionBackupTarget > 365 || */ this.retentionBackupTarget % 1 !== 0);
  }

  private onChangeSiteBackupTarget(): void {
    let me = this;
    if (me.model && !me.model.phantom && me.oldSiteBackupTarget && me.oldSiteBackupTarget !== me.siteBackupTarget) {
      me.confirm(me.textChangeSiteBackupTarget, function () {
      }, function () {
        me.siteBackupTarget = me.oldSiteBackupTarget;
        me.getSites();
      });
    }
  }

  private _setCloudOffloadTarget(item: CloudModel): void {
    let me = this;
    me.cloudOffloadTarget = item;
    if (item === undefined) {
      me.disableCloudRetentionIfWorm = false;
      me.wormCloudRetention = undefined;
    } else {
      me.disableCloudRetentionIfWorm = me.cloudOffloadTarget.wormProtected;
      if (me.disableCloudRetentionIfWorm) {
        me.wormCloudRetention = me.cloudOffloadTarget.defaultRetention;
      }
    }
  }

  private _setCloudArchiveTarget(item: CloudModel): void {
    let me = this;
    me.cloudArchiveTarget = item;
    if (item === undefined) {
      me.disableArchiveRetentionIfWorm = false;
      me.wormArchiveRetention = undefined;
    } else {
      me.disableArchiveRetentionIfWorm = me.cloudArchiveTarget.wormProtected;
      if (me.disableArchiveRetentionIfWorm) {
        me.wormArchiveRetention = me.cloudArchiveTarget.defaultRetention;
      }
    }
  }

  private _resetRpoSchedule(): void {
    let cs: ScheduleModel = new ScheduleModel(), cs2: ScheduleModel = new ScheduleModel();
    cs.activateHour = 0;
    cs2.activateHour = 1;
    if (this.rpoSchedule) {
      this.rpoSchedule.setModel(cs);
    }
    if (this.rpoScheduleTypeSnapshotBackup) {
      this.rpoScheduleTypeSnapshotBackup.setModel(cs2);
    }
  }

  private _resetSnapshotSchedule(): void {
    let cs: ScheduleModel = new ScheduleModel();
    cs.activateHour = 0;
    if (this.snapshotSchedule) {
      this.snapshotSchedule.setModel(cs);
    }
    if (this.snapshotScheduleTypeSnapshotBackup) {
      this.snapshotScheduleTypeSnapshotBackup.setModel(cs);
    }
  }

  private _resetVsrSchedule(): void {
    let cs: ScheduleModel = new ScheduleModel(), cs2: ScheduleModel = new ScheduleModel();
    cs.activateHour = 1;
    cs2.activateHour = 2;
    if (this.vsrSchedule) {
      this.vsrSchedule.setModel(cs);
    }
    if (this.vsrScheduleTypeSnapshotBackup) {
      this.vsrScheduleTypeSnapshotBackup.setModel(cs2)
    }
  }

  private _resetCloudOffloadSchedule(): void {
    let cs: ScheduleModel = new ScheduleModel(), cs2: ScheduleModel = new ScheduleModel();
    cs.activateHour = 2;
    cs2.activateHour = 3;
    if (this.cloudOffloadSchedule) {
      this.cloudOffloadSchedule.setModel(cs);
    }
    if (this.cloudOffloadScheduleTypeSnapshotBackup) {
      this.cloudOffloadScheduleTypeSnapshotBackup.setModel(cs2);
    }
  }

  private _resetCloudArchiveSchedule(): void {
    let cs: ScheduleModel = new ScheduleModel(), cs2: ScheduleModel = new ScheduleModel();
    cs.frequency = 1;
    cs.type = 'WEEKLY';
    cs.activateHour = 3;
    cs2.frequency = 1;
    cs2.type = 'WEEKLY';
    cs2.activateHour = 4;
    if (this.cloudArchiveSchedule) {
      this.cloudArchiveSchedule.setModel(cs);
    }
    if (this.cloudArchiveScheduleTypeSnapshotBackup) {
      this.cloudArchiveScheduleTypeSnapshotBackup.setModel(cs2);
    }
  }

  private _convertBackToFront(type: string, value: number): { type: string, value: number } {
    let retVal: any = { type: type, value: value };

    if (type === 'numsnapshots') {
      return retVal;
    }

    if (value % 365 === 0) {
      retVal.type = 'age-years';
      retVal.value = value / 365;
    } else if (value % 30 === 0) {
      retVal.type = 'age-months';
      retVal.value = value / 30;
    } else if (value % 7 === 0) {
      retVal.type = 'age-weeks';
      retVal.value = value / 7;
    }

    return retVal;
  }

  private _convertFrontToBack(type: string, value: number): { type: string, value: number } {
    let retVal: any = { type: type, value: value };

    if (type === 'numsnapshots' || type === 'age') {
      return retVal;
    }

    if (type === 'age-weeks') {
      retVal.type = 'age';
      retVal.value = value * 7;
    } else if (type === 'age-months') {
      retVal.type = 'age';
      retVal.value = value * 30;
    } else if (type === 'age-years') {
      retVal.type = 'age';
      retVal.value = value * 365;
    }

    return retVal;
  }

  private isEdit(): boolean {
    return this.model && !this.model.phantom;
  }

  private onEnableVsnapReplicationClick(): void {
    let me = this;
    if (!me.enableVsnapReplication) {
      if (me.isEdit() && (me.cloudOffloadSource === 'replication' || me.cloudArchiveSource === 'replication')) {
        me.confirm(me.textConfirmDisablingVSnapReplication,
          function () {
            me.cloudOffloadSource = 'backup';
            me.cloudArchiveSource = 'backup';
          },
          function () {
            me.enableVsnapReplication = true;
          });

      } else {
        me.cloudArchiveSource = 'backup';
        me.cloudOffloadSource = 'backup';
      }
    }
  }

  private getWormRetentionText(): string {
    return SharedService.formatString(this.textWormDefaultRetention, this.wormCloudRetention);
  }

  onSelectSlaType(value) {
    let me = this;
    switch (value.target.value) {
      case 'backup':
        me.enableMainPolicyBackup = true;
        me.snapshot = false;
        // me.enableVsnapReplication = false;
        // me.enableCloudOffload = false;
        break;
      case 'snapshot_backup':
        me.snapshot = true;
        me.enableMainPolicyBackup = false;
        me.enableVsnapReplication = false;
        me.enableCloudOffload = false;
        me.enableArchive = false;
        break;
      case 'snapshot':
        me.snapshot = true;
        me.enableMainPolicyBackup = false;
        me.enableVsnapReplication = false;
        me.enableCloudOffload = false;
        me.enableArchive = false;
        break;
    }
  }

}
