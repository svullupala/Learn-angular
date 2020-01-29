import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseHypervisorModel} from './base-hypervisor.model';

@JsonObject
export class DatacenterModel extends BaseHypervisorModel {
  @JsonProperty('hostAddress', String, true)
  public hostAddress: string = undefined;

  @JsonProperty('portNumber', Number, true)
  public portNumber: number = 443;

  @JsonProperty('username', String, true)
  public username: string = undefined;

  @JsonProperty('password', String, true)
  public password: string = undefined;

  @JsonProperty('sslConnection', Boolean, true)
  public sslConnection: boolean = true;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('properties', Object, true)
  public properties: Object = undefined;

  @JsonProperty('productName', String, true)
  public productName: string = undefined;

  @JsonProperty('location', String, true)
  public location: string = undefined;

  @JsonProperty('user', Object, true)
  public user: {
    href: string
  } = undefined;

  @JsonProperty('uniqueId', String, true)
  public uniqueId: string = undefined;

}
