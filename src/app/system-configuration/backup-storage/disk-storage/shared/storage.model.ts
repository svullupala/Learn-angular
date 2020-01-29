import { BaseModel } from 'shared/models/base.model';
import { JsonObject, JsonProperty } from 'json2typescript';

@JsonObject
export class StorageModel extends BaseModel {

  @JsonProperty('name', String)
  public hostAddress: string = undefined;

  @JsonProperty('site', String)
  public site: string = '1000';

  @JsonProperty('storageId', String)
  public storageId: string = '';

  @JsonProperty('activeDirectoryInfo', Object, true)
  public activeDirectoryInfo: {
    domain: string,
    workgroup: string
  } = undefined;

  @JsonProperty('portNumber', Number, true)
  public portNumber: number = undefined;

  @JsonProperty('username', String, true)
  public username: string = undefined;

  @JsonProperty('password', String, true)
  public password: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('typeDisplayName', String, true)
  public typeDisplayName: string = undefined;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('initializeStatus', String, true)
  public initializeStatus: string = '';

  @JsonProperty('initializeStatusDisplayName', String, true)
  public initializeStatusDisplayName: string = '';

  @JsonProperty('sslConnection', Boolean, true)
  public sslConnection: boolean = true;

  @JsonProperty('metadataPath', undefined, true)
  public metadataPath: any = undefined;

  @JsonProperty('capacity', undefined, true)
  public capacity: any = undefined;

  @JsonProperty('demo', Boolean, true)
  public demo: boolean = false;

  @JsonProperty('isReady', Boolean, true)
  public isReady: boolean = true;

  @JsonProperty('user', Object, true)
  public user: {
    href: string
  } = undefined;

  public siteName: string = '';
  // We need this boolean to track state for auto refresh
  public isLoadingFromLive: boolean = false;

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    return {
      hostAddress: this.hostAddress ? this.hostAddress.trim() : undefined,
      siteId: this.site === 'new' ? undefined : this.site,
      siteName: this.site === 'new' ? this.siteName.trim() : undefined,
      type: this.type,
      username: this.username ? this.username.trim() : undefined,
      password: this.password ? this.password.trim() : undefined,
      portNumber: this.portNumber ? this.portNumber : (this.type === 'vsnap') ? 8900 : 443,
      sslConnection: this.sslConnection,
    };
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    return this.getPersistentJson();
  }

  public hasUser(): boolean {
    return this.user && this.user.href && this.user.href.length > 0;
  }

  /**
   * Constructs a copy of this model.
   * Don't use deep-copy(clone) because of performance concern.
   *
   * @returns {StorageModel}
   */
  public copy(): StorageModel {
    let target = new StorageModel();
    Object.assign(target, this);
    return target;
  }

  public getInitJson(): Object {
    return {
      async: true
    };
  }
}
