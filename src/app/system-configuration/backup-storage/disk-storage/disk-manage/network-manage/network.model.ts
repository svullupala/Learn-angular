import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class NetworkModel extends BaseModel {

  @JsonProperty('hw_addr', String, true)
  public hwAddr: string = undefined;

  @JsonProperty('current_request', Boolean, true)
  public currentRequest: boolean = false;

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('ip4_addrs', [String], true)
  public ip4Addr: Array<String> = [];

  @JsonProperty('ip6_addrs', [String], true)
  public ip6Addr: Array<String> = [];

  @JsonProperty('services', [String], true)
  public services: Array<String> = [];

  @JsonProperty('service_types', [String], true)
  public serviceTypes: Array<String> = [];

  public getPostBody() {
    return {
      service_types: this.serviceTypes
    };
  }
}
