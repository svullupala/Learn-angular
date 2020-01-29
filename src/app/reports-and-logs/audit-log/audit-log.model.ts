import {JsonObject, JsonProperty} from 'json2typescript';
import {HasProxy, RestService} from 'core';

@JsonObject
export class AuditLogModel implements HasProxy{

  public proxy: RestService;

  @JsonProperty('accessTime')
  public accessTime: string = undefined;

  @JsonProperty('serverTime')
  public serverTime: any = undefined;

  @JsonProperty('user')
  public user: string = undefined;

  @JsonProperty('groups')
  public groups: string = undefined;

  @JsonProperty('operation')
  public operation: string = undefined;

  @JsonProperty('description')
  public description: string = undefined;

  @JsonProperty('requesterIp')
  public requesterIp: string = undefined;
}
