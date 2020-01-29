import { JsonObject, JsonProperty } from 'json2typescript';
import { DatabaseModel } from './database.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class VersionMappingModel {

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
    siteId?: string
  } = undefined;

  @JsonProperty('storageType', String, true)
  public storageType: string = undefined;
}

export type OffloadInfo = {
  offloadProviderId: string,
  offloadPartnerId?: string,
  offloadProvider: string,
  offloadType: string
};

@JsonObject
export class VersionModel extends DatabaseModel {

  public site: string;

  @JsonProperty('siteId', String, true)
  public siteId: string = undefined;

  @JsonProperty('copyTime', Number, true)
  public copyTime: number = 0;

  @JsonProperty('primary', Boolean, true)
  public primary: boolean = false;

  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: {
    applicationBliDestinationInfo?: { logVolumePk?: string },
    policyName?: string,
    subPolicyName?: string,
    subPolicyType?: string,
    copyTime?: number,
    protectionMethod?: string,
    offloadInfo?: OffloadInfo
  } = undefined;

  @JsonProperty('mappings', [VersionMappingModel], true)
  public mappings: VersionMappingModel[] = [];

  @JsonProperty('storageProfileId', Number, true)
  public storageProfileId: number = undefined;

  @JsonProperty('resourceType', String, true)
  public resourceType: string = undefined;

  @JsonProperty('storageProfiles', [String], true)
  public storageProfiles: string[] = [];

  get offloadInfo(): OffloadInfo {
    return this.protectionInfo ? this.protectionInfo.offloadInfo : null;
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

  public isOffload(): boolean {
    return this.protectionInfo && this.protectionInfo.subPolicyType === 'SPPOFFLOAD';
  }

  public isArchive(): boolean {
    return this.protectionInfo && this.protectionInfo.subPolicyType === 'SPPARCHIVE';
  }

  get type(): string {
    let protectionMethod = this.protectionInfo ? this.protectionInfo.protectionMethod : '';
    if (protectionMethod === 'APPLICATION_BLI') {
      return this.protectionInfo.subPolicyType === 'SPPOFFLOAD' ? 'common.textCloud' : 'common.textVsnap';
    } else {
      return 'common.textIbmSpectrumProtectOffload';
    }
  }
}

@JsonObject
export class ApplicationVersionModel extends VersionModel {


  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: {
    applicationBliDestinationInfo?: { logVolumePk?: string },
    policyName?: string,
    subPolicyName?: string,
    subPolicyType?: string,
    protectionTime?: number,
    protectionMethod?: string
  } = undefined;

  @JsonProperty('copies', [VersionModel], true)
  protected _copies: Array<VersionModel> = undefined;

  get copies(): Array<VersionModel> {
    return this._copies || [];
  }

  set copies(value: Array<VersionModel>) {
    this._copies = value;
  }

  get copiesInPlace(): boolean {
    return this._copies !== undefined;
  }

  get hasCopy(): boolean {
    return this.copies && this.copies.length > 0;
  }

  get firstCopy(): VersionModel {
    return this.hasCopy ?  this.copies[0] : null;
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
