import { JsonObject, JsonProperty, JsonConvert } from 'json2typescript';
import {BaseModel, HasDynaIcon, HasIcon} from 'shared/models/base.model';
import { VersionModel } from './version.model';
import { HasPersistentJson } from 'core';

@JsonObject
export class BaseApplicationContentModel implements HasIcon {

  static readonly type2icon: object = {
    folder: 'folder',
    database: 'data--base',
    applicationinstance: 'data--base',
    mailbox: 'email',
    contacts: 'user--profile',
    calendar: 'calendar',
    onedrive: 'upload',
    user: 'user'
  };

  static readonly type2label: object = {
    folder: ['inventory.textFolder', 'inventory.textFolders'],
    database: ['inventory.textDatabase', 'inventory.textDatabases'],
    applicationinstance: ['inventory.textInstance', 'inventory.textInstances'],
    mailbox:  ['inventory.textMailbox', 'inventory.textMailboxes'],
    contacts:  ['inventory.textContact', 'inventory.textContacts'],
    calendar:  ['inventory.textCalendar', 'inventory.textCalendars'],
    onedrive:  ['inventory.textOneDrive', 'inventory.textOneDrives'],
    user:  ['inventory.textUser', 'inventory.textUsers'],
  };

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('count', Number, true)
  public count: number = 0;

  get icon(): string {
    return BaseApplicationContentModel.type2icon[this.type] || '';
  }

  get label(): string {
    return BaseApplicationContentModel.type2label[this.type][this.count === 1 ? 0 : 1] || '';
  }

  constructor(type?: string, count?: number) {
    this.type = type;
    this.count = count;
  }
}

@JsonObject
export class BaseApplicationStatusOfLastJobRunModel implements HasDynaIcon {

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
    return BaseApplicationStatusOfLastJobRunModel.status2icon[this.iconPointer][this.status] || '';
  }

  get tooltip(): string {
    return BaseApplicationStatusOfLastJobRunModel.status2tooltip[this.status] || '';
  }

  constructor(status: string, count?: number) {
    this.status = status;
    this.count = count;
  }
}

@JsonObject
export class PartitionModel {
  @JsonProperty('host', String, true)
  public host: string = '';
  public id: string = '';
}

@JsonObject
export class PathModel implements HasPersistentJson {

  @JsonProperty('name', String, true)
  public name: string = '';

  @JsonProperty('mountPoint', String, true)
  public mountPoint: string = '';

  @JsonProperty('fileType', String, true)
  public fileType: string = '';

  @JsonProperty('source', String, true)
  public source: string = '';

  @JsonProperty('destination', String, true)
  public destination: string = '';

  getPersistentJson(): object {
    return {
      source: this.name,
      destination: this.destination
    };
  }
}

@JsonObject
export class EligibleReasonModel {

  @JsonProperty('eligible', Boolean, true)
  public eligible: boolean = false;

  @JsonProperty('reason', String, true)
  public reason: string = '';

}

@JsonObject
export class EligibilityModel {

  @JsonProperty('backup', EligibleReasonModel, true)
  public backup: EligibleReasonModel = undefined;

  @JsonProperty('logbackup', EligibleReasonModel, true)
  public logbackup: EligibleReasonModel = undefined;

  public get isBackupEligible(): boolean {
    return (this.backup && this.backup.eligible) || false;
  }

  public set setBackupEligibility(eligible: boolean) {
    this.backup = this.backup || new EligibleReasonModel();
    this.backup.eligible = eligible;
  }

  public set setLogbackupEligibility(eligible: boolean) {
    this.logbackup = this.logbackup || new EligibleReasonModel();
    this.logbackup.eligible = eligible;
  }

  public get isLogbackupEligble(): boolean {
    return (this.logbackup && this.logbackup.eligible) || false;
  }

  public get isBackupEligibleReason(): string {
    return (this.backup && this.backup.reason) || '';
  }

  public get isLogbackupEligibleReason(): string {
    return (this.logbackup && this.logbackup.reason) || '';
  }
}

JsonConvert.ignorePrimitiveChecks = true;
@JsonObject
export class BaseApplicationModel extends BaseModel implements HasIcon {
  @JsonProperty('type', String, true)
  public type: string;

  @JsonProperty('subType', String, true)
  public subType: string;

  @JsonProperty('appServerVmInfos', undefined, true)
  public appServerVmInfos: Object = {};

  @JsonProperty('applicationFullName', String, true)
  public applicationFullName: Object = {};

  @JsonProperty('eligibility', EligibilityModel, true)
  public eligibility: EligibilityModel = undefined;

  @JsonProperty('ineligibleForCopyReason', String, true)
  public ineligibleForCopyReason: string = '';

  @JsonProperty('isEligibleForCopy', Boolean, true)
  public isEligibleForCopy: boolean = false;

  @JsonProperty('isEligibleForLogBackup', Boolean, true)
  public isEligibleForLogBackup: boolean = false;

  @JsonProperty('isEligibleForPIT', Boolean, true)
  public isEligibleForPIT: boolean = false;

  @JsonProperty('isClustered', Boolean, true)
  public isClustered: boolean = false;

  @JsonProperty('isOwnerNode', Boolean, true)
  public isOwnerNode: boolean = false;

  @JsonProperty('host', String, true)
  public host: string = '';

  @JsonProperty('version', String, true)
  public version: string = '';

  @JsonProperty('osname', String, true)
  public osname: string = '';

  @JsonProperty('location', String, true)
  public location: string = '';

  @JsonProperty('osversion', String, true)
  public osversion: string = '';

  @JsonProperty('osType', String, true)
  public osType: string = undefined;

  @JsonProperty('serverType', String, true)
  public serverType: string = '';

  @JsonProperty('siteId', String, true)
  public siteId: string = '';

  @JsonProperty('providerNodeId', String, true)
  public providerNodeId: string = '';

  @JsonProperty('providerUniqueId', String, true)
  public providerUniqueId: string = '';

  @JsonProperty('sessionId', Number, true)
  public sessionId: number;

  @JsonProperty('jobId', String, true)
  public jobId: string = '';

  @JsonProperty('serverIds', undefined, true)
  public serverIds = [];

  @JsonProperty('storageProfiles', undefined, true)
  public storageProfiles = [];

  @JsonProperty('metadataPath', String, true)
  public metadataPath: string = '';

  @JsonProperty('peerhostnames', undefined, true)
  public peerhostnames = [];

  @JsonProperty('partitions', [PartitionModel], true)
  public partitions: Array<PartitionModel> = [];

  @JsonProperty('paths', [PathModel], true)
  public paths: Array<PathModel> = [];

  @JsonProperty('peerAddresses', Object, true)
  public peerAddresses = {};

  @JsonProperty('vmInfos', [], true)
  public vmInfos = [];

  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: {
    applicationBliDestinationInfo?: { logVolumePk?: string }
  } = {};

  @JsonProperty('capabilities', undefined, true)
  public capabilities;

  @JsonProperty('contents', [BaseApplicationContentModel], true)
  public contents: Array<BaseApplicationContentModel> = [
    // TODO: Use below dummy data to debug the contents field when API isn't ready.
    new BaseApplicationContentModel('folder', Math.floor(Math.random() * 10)),
    new BaseApplicationContentModel('database', Math.floor(Math.random() * 10))
  ];

  @JsonProperty('size', Number, true)
  public size: number = // -1;
    // TODO: Use below dummy data to debug the size field when API isn't ready.
    Math.floor(Math.random() * 16777216);

  @JsonProperty('statusOfLastJobRun', [BaseApplicationStatusOfLastJobRunModel], true)
  public statusOfLastJobRun: Array<BaseApplicationStatusOfLastJobRunModel> = [
    // TODO: Use below dummy data to debug the statusOfLastJobRun field when API isn't ready.
    new BaseApplicationStatusOfLastJobRunModel('failed', Math.floor(Math.random() * 10)),
    new BaseApplicationStatusOfLastJobRunModel('warning', Math.floor(Math.random() * 10)),
    new BaseApplicationStatusOfLastJobRunModel('successful', Math.floor(Math.random() * 10))
  ];

  public metadata: object = {version: undefined, selected: false, snapshotLoaded: false};

  public versions: Array<VersionModel> = [];

  public disable: boolean = false;

  public set setBackupEligibility(eligible: boolean) {
    if (this.eligibility)
      this.eligibility.setBackupEligibility = eligible;
  }

  public set setLogbackupEligibility(eligible: boolean) {
    if (this.eligibility)
      this.eligibility.setLogbackupEligibility = eligible;
  }

  public createEligibilityObject(): void {
    this.eligibility = new EligibilityModel();
  }

  public isBackupEligible(): boolean {
    if (this.eligibility) {
      return this.eligibility.isBackupEligible;
    }
    return true;
  }

  public isLogBackupEnabled(): boolean {
    return !!(this.isLogBackupEligible() &&
      this.protectionInfo && this.protectionInfo.applicationBliDestinationInfo &&
      this.protectionInfo.applicationBliDestinationInfo.logVolumePk != null);
  }

  public isLogBackupEligible(): boolean {
    if (this.eligibility) {
      return this.eligibility.isLogbackupEligble;
    }
    return false;
  }

  public isBackupEligibleReason(): string {
    if (this.eligibility) {
      return this.eligibility.isBackupEligibleReason;
    }
    return '';
  }

  public isLogbackupEligibleReason(): string {
    if (this.eligibility) {
      return this.eligibility.isLogbackupEligibleReason;
    }
    return '';
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
    return this.versions && this.versions.length > 0;
  }

  public get parseName(): string {
    return this.location && this.location.substring(this.location.lastIndexOf('/') + 1);
  }

  public get parseLocation(): string {
    return this.location && this.location.substring(1, this.location.lastIndexOf('/'));
  }


  get isInstance(): boolean {
    return(this.resourceType || '').toLowerCase() === 'applicationinstance';
  }

  get isDatabase(): boolean {
    return(this.resourceType || '').toLowerCase() === 'database';
  }

  get isDatabaseGroup(): boolean {
    return(this.resourceType || '').toLowerCase() === 'databasegroup';
  }

  get isFolder(): boolean {
    return(this.resourceType || '').toLowerCase() === 'folder';
  }

  get icon(): string {
    let me = this;
    // Use carbon icons here.
    if (me.type === 'office365') {
      if (me.isInstance)
        return 'building';
      if (me.subType === 'mailbox')
        return 'email';
      if (me.subType === 'contacts')
        return 'user--profile';
      if (me.subType === 'calendar')
        return 'calendar';
      if (me.subType === 'onedrive')
        return 'upload';
      if (me.subType === 'user')
        return 'user';
      return 'email';
    } else {
      if (me.isDatabase)
        return 'data--base';
      if (me.isInstance)
        return 'data--base';
      if (me.isFolder)
        return 'folder';
      return 'data--base';
    }
  }

  get resourcesNameTransKey(): string {
    let me = this;

    if (me.type === 'office365') {
      if (me.isInstance)
        return 'textOffice365';
      if (me.subType === 'mailbox')
        return 'textOffice365Mailbox';
      if (me.subType === 'contacts')
        return 'textOffice365Contacts';
      if (me.subType === 'calendar')
        return 'textOffice365Calendar';
      if (me.subType === 'onedrive')
        return 'textOffice365OneDrive';
      if (me.subType === 'user')
        return 'textOffice365User';
      return 'textOffice365';
    } else {
      if (me.isDatabaseGroup)
        return 'textDatabaseGroup';
      if (me.isDatabase)
        return 'textDatabase';
      if (me.isInstance)
        return 'textInstance';
      if (me.isFolder)
        return 'textFolder';
      return '';
    }
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


