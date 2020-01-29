import {WizardModel} from 'shared/components/wizard/wizard.model';
import {NodeRestorePolicyModel} from 'app/manage-protection/applications/restore/node-restore-policy.model';
import {HypervisorRestoreOptionsModel} from 'app/manage-protection/hypervisor/shared/hypervisor-restore-options.model';
import {RestoreItem} from 'app/manage-protection/hypervisor/restore';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';
import {StorageModel} from 'app/system-configuration/backup-storage/disk-storage/shared/storage.model';
import {BaseModel} from 'shared/models/base.model';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from 'wizard/snapshot-restore/snapshot-restore-wizard.model';

export class SnapshotRestoreAwsec2Model extends WizardModel {

  hypervisorType: string = 'awsec2';
  textUseLatest: string = 'Use Latest'; // TODO this is temporary cause reasons
  policy: NodeRestorePolicyModel = new NodeRestorePolicyModel();

  source: Array<RestoreItem> = new Array<RestoreItem>();
  sourceType: string = 'vdisk';
  destination: object;
  destinationType: string = 'original';
  vmPath: any;
  mapVMNamePayload: any;
  mapvdiskPayload: any;
  mapSubnetPayload: any;
  mapNetworkPayload: any;
  mapDatastorePayload: object;
  dateRange: Date[];
  copyPayload: object;
  copyLocation: BaseModel; // TODO make this generic, not always going to be site
  originalHostCluster: boolean = true;
  isOffload: boolean = false;
  workflowType: string = HypervisorRestoreService.IA_VAL;
  scheduleName: string;
  triggerValue: object;
  script: PostScriptsModel;
  scriptsPayload: object;
  useAlternateVsnap: boolean = false;
  showAlternateVsnap: boolean = false;
  useLatest: boolean = false;
  isSpp: boolean = false;
  selectedStorage: StorageModel = undefined;
  offloadType: string;
  copyLocationHref: string;
  selectedStorageHref: string;
  systemDefined: boolean = true;
  isAWSSource: boolean = false;
  isAWSDest: boolean = false;

  isSystemDbFlag: boolean = false;
  runType: string = 'clone';
  options: HypervisorRestoreOptionsModel = new HypervisorRestoreOptionsModel();

  payload: any;

  constructor() {
    super();
    this.category = WIZARD_CATEGORY_SNAPSHOT_RESTORE;
    this.workflow = 'awsec2';
  }

  json(): object {
    return this.policy.getPersistentJson(true);
  }

  getPayload(): object {
    this.getOptions();
    return this.payload;
}

  clearSchedule(): void {
    this.scheduleName = undefined;
    this.triggerValue = undefined;
  }

  clearDatastore(): void {
    this.mapDatastorePayload = undefined;
  }

  private getOptions(): void {
    let me = this, newPayload, alternateVsnap;
    if (me.workflowType === HypervisorRestoreService.IA_VAL) {
      if (this.useAlternateVsnap) {
        alternateVsnap = {'href': this.selectedStorage.getUrl('self')};
      }
      me.payload = me.getIAPayload(me.hypervisorType,
        me.source, me.destination, me.mapvdiskPayload, me.options, me.scriptsPayload,
        me.textUseLatest, me.copyPayload, alternateVsnap);
    } else {
      if (me.originalHostCluster === false) {
      }

      if (this.useAlternateVsnap) {
        alternateVsnap = {'href': this.selectedStorage.getUrl('self')};
      }
      me.payload = me.getIVPayload(me.hypervisorType,
        me.source, me.destination, me.mapNetworkPayload, me.mapDatastorePayload, me.mapSubnetPayload,
        me.mapVMNamePayload,
        me.vmPath, me.options, me.scriptsPayload, me.textUseLatest, me.copyPayload, alternateVsnap);
    }
  }

  private getIVPayload(subType: string, restoreItems: Array<RestoreItem>, destination: Object,
               mapvirtualnetwork: Object, mapRRPdatastore: Object, mapsubnet: Object, mapvm: Object,
               vmfolderpath: string, options: Object, scripts: object,
               useLatest: string, copyPayload: object, alternateVsnap: object): any {
    let payload,
      source = this.getSourcePayload(restoreItems, useLatest);

    payload = {
      subType: subType || '',
      spec: {
        source: source,
        subpolicy: [{
          type: 'IV',
          destination: destination || {},
          source: copyPayload,
          option: options || {}
        }]
      },
      script: scripts || {},
    };
    payload.spec.subpolicy[0].destination.mapvirtualnetwork = mapvirtualnetwork || {};
    payload.spec.subpolicy[0].destination.mapRRPdatastore = mapRRPdatastore || {};
    payload.spec.subpolicy[0].destination.mapsubnet = mapsubnet || {};
    payload.spec.subpolicy[0].destination.mapvm = mapvm || {};
    if (vmfolderpath !== undefined) {
      payload.spec.subpolicy[0].destination.vmfolderpath = vmfolderpath || '';
    }
    if (alternateVsnap !== undefined) {
      payload.spec.subpolicy[0].destination.storageserver = alternateVsnap || '';
    }
    if (this.scheduleName) {
      payload['name'] = this.scheduleName;
    }
    if (this.triggerValue) {
      payload['trigger'] = this.triggerValue;
    }
    return payload;
  }

  private getIAPayload(subType: string, restoreItems: Array<RestoreItem>, destination: Object,
               mapvdisk: Object, options: Object, scripts: object,
               useLatest: string, copyPayload: object, alternateVsnap: object): any {
    let payload,
      source = this.getSourcePayload(restoreItems, useLatest);

    payload = {
      subType: subType || '',
      spec: {
        source: source,
        subpolicy: [{
          type: 'IA',
          destination: destination || {},
          source: copyPayload,
          option: options || {}
        }]
      },
      script: scripts || {}
    };
    if (mapvdisk) {
      payload.spec.subpolicy[0].destination.mapvdisk = mapvdisk;
    }
    if (alternateVsnap !== undefined) {
      payload.spec.subpolicy[0].destination.storageserver = alternateVsnap || '';
    }
    if (this.scheduleName) {
      payload['name'] = this.scheduleName;
    }
    if (this.triggerValue) {
      payload['trigger'] = this.triggerValue;
    }
    return payload;
  }

  private getSourcePayload(restoreItems: Array<RestoreItem>, useLatest: string): Array<any> {
    let source = [];
    if (restoreItems && restoreItems.length > 0) {
      for (const item of restoreItems) {
        let sourceItem = {
          href: item.resource.url || '',
          metadata: {
            name: item.resource.name
          },
          resourceType: item.resource.resourceType || '',
          id: item.resource.id || '',
          include: true,
          version: item.snapshot !== undefined ?
            {
              href: item.snapshot.getLink('version').href,
              copy: {
                href: item.snapshot.getId()
              },
              metadata: {
                useLatest: false,
                protectionTime: item.snapshot.protectionTime
              }
            } :
            {
              href: item.resource.getUrl('latestversion'),
              metadata: {
                useLatest: true,
                name: useLatest
              }
            }
        };
        source.push(sourceItem);
      }
    }
    return source;
  }
}
