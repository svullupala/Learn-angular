import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {VersionModel} from 'applications/shared/version.model';

@JsonObject
export class CopyMappingModel {

  @JsonProperty('snapshotVersionUuid', String, true)
  public snapshotVersionUuid: string = undefined;

  @JsonProperty('snapshotVersionId', undefined, true)
  public snapshotVersionId: any = undefined;

  @JsonProperty('source', Object, true)
  public source: {
    nodeName?: string,
    nodeId?: string,
    vServerName?: string,
    storageServerId?: string,
    volumeName?: string,
    volumePk?: string,
    snapshotName?: string,
    siteId?: string
  } = undefined;

  @JsonProperty('destination', Object, true)
  public destination: {
    nodeName?: string,
    nodeId?: string,
    vServerName?: string,
    storageServerId?: string,
    volumeName?: string,
    volumePk?: string,
    snapshotName?: string,
    siteId?: string,
    offloadProvider?: string,
    offloadProviderId?: string,
  } = undefined;

  @JsonProperty('storageType', String, true)
  public storageType: string = undefined;
}

export type CopyOffloadInfo = {
  offloadProviderId: string,
  offloadPartnerId?: string,
  offloadProvider: string,
  offloadType: string
};

export type CopyOffloadInfoEx = {
  offloadProviderId: string,
  offloadProvider: string
};

@JsonObject
export class SnapshotModel extends BaseModel {

  public site: string = undefined;
  public storageSite: string = undefined;

  @JsonProperty('siteId', String, true)
  public siteId: string = undefined;

  @JsonProperty('copyTime', Number, true)
  public copyTime: number = 0;

  @JsonProperty('primary', Boolean, true)
  public primary: boolean = false;

  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: {
    policyName?: string,
    subPolicyName?: string,
    subPolicyType?: string,
    copyTime?: number,
    protectionMethod?: string,
    offloadInfo?: CopyOffloadInfo
  } = undefined;

  @JsonProperty('mappings', [CopyMappingModel], true)
  public mappings: CopyMappingModel[] = [];

  @JsonProperty('hypervisorId', String, true)
  public hypervisorId: string = undefined;

  @JsonProperty('resourceType', String, true)
  public resourceType: string = undefined;

  @JsonProperty('storageProfiles', [String], true)
  public storageProfiles: string[] = [];

  get offloadInfo(): CopyOffloadInfo {
    return this.protectionInfo ? this.protectionInfo.offloadInfo : null;
  }

  get offloadInfoEx(): CopyOffloadInfoEx {
    let firstMapping = this.mappings && this.mappings.length > 0 ? this.mappings[0] : null,
      destination = firstMapping ? firstMapping.destination : null;
    return destination ?
      {offloadProviderId: destination.offloadProviderId, offloadProvider: destination.offloadProvider} : null;
  }

  get protectionTime(): number {
    let returnValue;
    if (this.protectionInfo && this.protectionInfo.copyTime) {
      returnValue = this.protectionInfo.copyTime;
    } else {
      returnValue = 0;
    }
    return returnValue;
  }

  set protectionTime(value: number) {
    this.protectionInfo = this.protectionInfo || {};
    this.protectionInfo.copyTime = value;
  }

  get storageSiteId(): string {
    return this.siteId;
  }

  get type(): string {
    let protectionMethod = this.protectionInfo ? this.protectionInfo.protectionMethod : '';
    if (protectionMethod === 'VMWARE_CBT') {
      return this.protectionInfo.subPolicyType === 'SPPOFFLOAD' ? 'common.textCloud' : 'common.textVsnap';
    } else {
      return 'common.textIbmSpectrumProtectOffload';
    }
  }

  get slapolicy(): string {
    let names = this.storageProfiles || [];
    if (names && names.length > 0)
      return names.join(', ');
    else {
      return this.protectionInfo ? this.protectionInfo.policyName : '';
    }
  }

  get subPolicyType(): string {
    return this.protectionInfo ? this.protectionInfo.subPolicyType : '';
  }

  public isSpp(): boolean {
    let protectionMethod = this.protectionInfo ? this.protectionInfo.protectionMethod : '';
    return protectionMethod === 'VMWARE_CBT' ? false : true;
  }

  public isOffload(): boolean {
    return this.protectionInfo && this.protectionInfo.subPolicyType === 'SPPOFFLOAD';
  }

  public isArchive(): boolean {
    return this.protectionInfo && this.protectionInfo.subPolicyType === 'SPPARCHIVE';
  }
}


@JsonObject
export class HypervisorVersionModel extends SnapshotModel {

  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: {
    applicationBliDestinationInfo?: { logVolumePk?: string },
    policyName?: string,
    subPolicyName?: string,
    subPolicyType?: string,
    protectionTime?: number,
    protectionMethod?: string
  } = undefined;

  @JsonProperty('copies', [SnapshotModel], true)
  protected _copies: Array<SnapshotModel> = undefined;

  get copies(): Array<SnapshotModel> {
    return this._copies || [];
  }

  set copies(value: Array<SnapshotModel>) {
    this._copies = value;
  }

  get copiesInPlace(): boolean {
    return this._copies !== undefined;
  }

  get hasCopy(): boolean {
    return this.copies && this.copies.length > 0;
  }

  get firstCopy(): SnapshotModel {
    return this.hasCopy ? this.copies[0] : null;
  }

  get protectionTime(): number {
    let returnValue;
    if (this.protectionInfo && this.protectionInfo.protectionTime) {
      returnValue = this.protectionInfo.protectionTime;
    } else {
      returnValue = 0;
    }
    return returnValue;
  }
}

