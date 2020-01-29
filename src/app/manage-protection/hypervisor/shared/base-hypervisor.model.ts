import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel, HasDynaIcon, HasIcon} from 'shared/models/base.model';
import {LinkModel} from 'shared/models/link.model';
import {SnapshotModel} from './snapshot.model';

@JsonObject
export class BaseHypervisorContentModel implements HasIcon {

  static readonly type2icon: object = {
    folder: 'folder',
    vm: 'screen',
    datastore: 'data--base',
    volume: 'data--base',
    datacenter: 'building',
    vmgroup: 'apps',
    vdisk: 'data-vis--2',
    tagcategory: 'tag--group',
    tag: 'tag'
  };

  static readonly type2label: object = {
    folder: ['inventory.textFolder', 'inventory.textFolders'],
    vm: ['inventory.textVm', 'inventory.textVms'],
    datastore: ['inventory.textDatastore', 'inventory.textDatastores'],
    volume: ['inventory.textVolume', 'inventory.textVolumes'],
    datacenter: ['inventory.textDatacenter', 'inventory.textDatacenters'],
    vmgroup: ['inventory.textVmgroup', 'inventory.textVmgroups'],
    vdisk: ['inventory.textVdisk', 'inventory.textVdisks'],
    tagcategory: ['inventory.textTagcategory', 'inventory.textTagcategories'],
    tag: ['inventory.textTag', 'inventory.textTags']
  };

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('count', Number, true)
  public count: number = 0;

  get icon(): string {
    return BaseHypervisorContentModel.type2icon[this.type] || '';
  }

  get label(): string {
    return BaseHypervisorContentModel.type2label[this.type][this.count === 1 ? 0 : 1] || '';
  }

  constructor(type?: string, count?: number) {
    this.type = type;
    this.count = count;
  }
}

@JsonObject
export class BaseHypervisorStatusOfLastJobRunModel implements HasDynaIcon {

  static readonly status2icon: object[] = [{
    failed: 'error--filled',
    warning: 'warning--filled',
    successful: 'checkmark--filled'
  }, {
    failed: 'error--outline',
    warning: 'warning--alt',
    successful: 'checkmark--outline'
  }];

  static readonly status2tooltip: object = {
    failed: 'inventory.textJobFailed',
    warning: 'inventory.textJobWarning',
    successful: 'inventory.textJobSuccessful'
  };

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('count', Number, true)
  public count: number = 0;

  iconPointer: 0 | 1 = 0;

  get icon(): string {
    return BaseHypervisorStatusOfLastJobRunModel.status2icon[this.iconPointer][this.status] || '';
  }

  get tooltip(): string {
    return BaseHypervisorStatusOfLastJobRunModel.status2tooltip[this.status] || '';
  }

  constructor(status: string, count?: number) {
    this.status = status;
    this.count = count;
  }
}

@JsonObject
export abstract class BaseHypervisorModel extends BaseModel implements HasIcon {
  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('siteId', String, true)
  public siteId: string = undefined;

  @JsonProperty('association', Object, true)
  public association: Object = undefined;

  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: Object = undefined;

  @JsonProperty('recoveryInfo', Object, true)
  public recoveryInfo: Object = undefined;

  @JsonProperty('recoveryPoint', Object, true)
  public recoveryPoint: Object = undefined;

  @JsonProperty('autoProvisionedsubPolicyName', String, true)
  public autoProvisionedsubPolicyName: string = undefined;

  @JsonProperty('nativeObject', Object, true)
  public nativeObject: Object = undefined;

  @JsonProperty('metadataPath', undefined, true)
  public metadataPath: any = undefined;

  @JsonProperty('extInfo', undefined, true)
  public extInfo: any = undefined;

  @JsonProperty('location', undefined, true)
  public location: any = undefined;

  @JsonProperty('hypervisorType', String, true)
  public hypervisorType: string = undefined;

  @JsonProperty('hypervisorKey', String, true)
  public hypervisorKey: string = undefined;

  @JsonProperty('hypervisorManagementServerID', String, true)
  public hypervisorManagementServerID: string = undefined;

  @JsonProperty('storageProfiles', [String], true)
  public storageProfiles: Array<string> = [];

  @JsonProperty('config', Object, true)
  public config: Object = undefined;

  @JsonProperty('cloudType', String, true)
  public cloudType: string = undefined;

  @JsonProperty('contents', [BaseHypervisorContentModel], true)
  public contents: Array<BaseHypervisorContentModel> = [
    // TODO: Use below dummy data to debug the contents field when API isn't ready.
    new BaseHypervisorContentModel('vm', Math.floor(Math.random() * 10)),
    new BaseHypervisorContentModel('folder', Math.floor(Math.random() * 10)),
    new BaseHypervisorContentModel('vdisk', Math.floor(Math.random() * 10))
  ];

  @JsonProperty('size', Number, true)
  public size: number = // -1;
    // TODO: Use below dummy data to debug the size field when API isn't ready.
    Math.floor(Math.random() * 16777216);

  @JsonProperty('statusOfLastJobRun', [BaseHypervisorStatusOfLastJobRunModel], true)
  public statusOfLastJobRun: Array<BaseHypervisorStatusOfLastJobRunModel> = [
    // TODO: Use below dummy data to debug the statusOfLastJobRun field when API isn't ready.
    new BaseHypervisorStatusOfLastJobRunModel('failed', Math.floor(Math.random() * 10)),
    new BaseHypervisorStatusOfLastJobRunModel('warning', Math.floor(Math.random() * 10)),
    new BaseHypervisorStatusOfLastJobRunModel('successful', Math.floor(Math.random() * 10))
  ];

  public metadata: object = {snapshotLoaded: false};

  public get osType(): string {
    let me = this, os = '';
    if (me.config)
      os = me.config['osName'] || '';
    return os;
  }

  public snapshots: Array<SnapshotModel> = [];

  public getStorageProfilesLink(): LinkModel {
    return this.getLink('storageprofiles');
  }

  public getOptionsLink(): LinkModel {
    return this.getLink('options');
  }

  public get hasPolicyAssociation(): boolean {
    return Array.isArray(this.storageProfiles) && this.storageProfiles.length > 0;
  }

  public getRerunPostBody(subtype: string, slaName?: string): Object {
    return {
      slaPolicyName: slaName || (this.hasPolicyAssociation ? this.storageProfiles[0] : ''),
      resource: [this.url],
      subtype: subtype
    };
  }

  public get snapshotLoaded(): boolean {
    return this.metadata && !!this.metadata['snapshotLoaded'];
  }

  public get hasSnapshot(): boolean {
    return this.snapshots && this.snapshots.length > 0;
  }

  get icon(): string {
    let me = this;
    // Use carbon icons here.
    if (me.folderIcon)
      return 'folder';
    else if (me.isVm)
      return 'screen';
    else if (me.isDatastore || me.isVolume)
      return 'data--base';
    else if (me.isDatacenter)
      return 'building';
    else if (me.isTemplate)
      return 'apps';
    else if (me.isVDisk)
      return 'data-vis--2';
    else if (me.isTagCategory)
      return 'tag--group';
    else if (me.isTag)
      return 'tag';
    return undefined;
  }

  get isDatacenter(): boolean {
    return (this.type || '').toLowerCase() === 'datacenter';
  }

  get isTemplate(): boolean {
    return (this.type || '').toLowerCase() === 'vmgroup';
  }

  get isVm(): boolean {
    return (this.type || '').toLowerCase() === 'virtualmachine' || this.resourceType === 'vm';
  }

  get isDatastore(): boolean {
    return (this.type || '').toLowerCase() === 'datastore' || this.resourceType === 'datastore';
  }

  get isVolume(): boolean {
    return (this.type || '').toLowerCase() === 'volume' || this.resourceType === 'volume';
  }

  get isVDisk(): boolean {
    return (this.type || '').toLowerCase() === 'vdisk' || this.resourceType === 'vdisk';
  }

  get isTagCategory(): boolean {
    return this.resourceType === 'tagcategory';
  }

  get isTag(): boolean {
    return this.resourceType === 'tag';
  }

  get folderIcon(): boolean {
    return this.resourceType === 'hypervisor' || this.resourceType === 'folder' ||
      (!this.type && this.resourceType !== 'vm' && this.resourceType !== 'volume');
  }

  get countOfPolicyCoverage(): number {
    return (this.storageProfiles || []).length;
  }

  get tooltipOfPolicyCoverage(): string {
    return (this.storageProfiles || []).join(', ');
  }

  get otherPolicies(): string[] {
    return this.countOfPolicyCoverage > 1 ? this.storageProfiles.slice(1) : [];
  }
}
