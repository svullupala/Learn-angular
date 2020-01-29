import {JsonObject, JsonProperty} from 'json2typescript';
import { JsonConvert } from 'json2typescript/index';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';
import { HasPersistentJson } from 'core';

JsonConvert.ignorePrimitiveChecks = true;
@JsonObject
export class DiscoveryInstanceModel implements HasPersistentJson {

  @JsonProperty('id', String, true)
  public id: string = '';

  @JsonProperty('name', String, true)
  public name: string = '';

  @JsonProperty('comment', String, true)
  public comment: string = '';

  @JsonProperty('creatorId', Number, true)
  public creatorId: number = 0;

  @JsonProperty('creationTime', String, true)
  public creationTime: string = '';

  @JsonProperty('type', String, true)
  public type: string = '';

  @JsonProperty('flags', Number, true)
  public flags: number = 0;

  @JsonProperty('pk', String, true)
  public pk: string = '';

  @JsonProperty('sessionId', String, true)
  public sessionId: string = '';

  @JsonProperty('objType', String, true)
  public objType: string = '';

  @JsonProperty('jobId', String, true)
  public jobId: string = '';

  @JsonProperty('host', String, true)
  public host: string = '';

  @JsonProperty('providerNodeId', String, true)
  public providerNodeId: string = '';

  @JsonProperty('providerUniqueId', String, true)
  public providerUniqueId: string = '';

  @JsonProperty('siteId', String, true)
  public siteId: string = '';

  @JsonProperty('autoProvisionedsubPolicyName', String, true)
  public autoProvisionedsubPolicyName: string = '';

  @JsonProperty('metadataPath', String, true)
  public metadataPath: string = '';

  @JsonProperty('applicationType', String, true)
  public applicationType: string = '';

  @JsonProperty('applicationFullName', String, true)
  public applicationFullName: string = '';

  @JsonProperty('version', String, true)
  public version: string = '';

  @JsonProperty('clusterType', String, true)
  public clusterType: string = '';

  @JsonProperty('databases', undefined, true)
  public databases: any;

  @JsonProperty('capabilities', undefined, true)
  public capabilities: any;

  @JsonProperty('status', String, true)
  public status: string = '';

  // gets the user href from node
  @JsonProperty('href', String, true)
  public href: string = '';

  public user: IdentityUserEnterSelectModel;

  public isConfigured: boolean = false;

  public getPersistentJson(): object {
    return {
      name: this.name,
      user: this.user instanceof IdentityUserEnterSelectModel
        ? this.user.useExisting
          ? this.user.userHref
          : {
            username: this.user.username,
            password: this.user.password
          }
        : undefined
    };
  }
}
