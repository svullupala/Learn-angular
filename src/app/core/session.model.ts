import {UserModel} from './user.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class SessionModel {

  @JsonProperty('sessionid', String)
  public sessionid: string = undefined;

  @JsonProperty('user', UserModel)
  public user: UserModel = undefined;

  @JsonProperty('demo', Boolean, true)
  public demo: boolean = false;

  @JsonProperty('tenantAdmin', Boolean, true)
  public tenantAdmin: boolean = false;

  @JsonProperty('userGroups', [undefined], true)
  public userGroups: Array<any> = [];

  @JsonProperty('screens', [Object], true)
  public screens: Array<any> = [];
}
