import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {RestService} from 'core';

@JsonObject
export class LdapModel extends BaseModel {

  public proxy: RestService;

  @JsonProperty('hostAddress')
  public hostAddress: string = undefined;

  @JsonProperty('name')
  public name: string = undefined;

  @JsonProperty('sslConnection')
  public sslConnection: boolean = undefined;

  @JsonProperty('portNumber')
  public portNumber: number = undefined;

  @JsonProperty('baseDN')
  public baseDN: string = undefined;

  @JsonProperty('userRDN')
  public userRDN: string = undefined;

  @JsonProperty('groupRDN')
  public groupRDN: string = undefined;

  @JsonProperty('userFilter')
  public userFilter: string = undefined;

  @JsonProperty('user', Object, true)
  public user: {
    href: string
  } = undefined;
}
