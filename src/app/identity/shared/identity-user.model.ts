import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class IdentityUserModel extends BaseModel {

  public static TYPE_SYSTEM = 'system';
  public static TYPE_SQL = 'sql';
  public static TYPE_ORACLE = 'oracle';
  public static TYPE_SAPHANA = 'saphana';
  public static TYPE_ISCACHE = 'iscache';
  public static TYPE_OS = 'osvolume';

  @JsonProperty('username', String, true)
  public username: string = undefined;

  @JsonProperty('password', String, true)
  public password: string = undefined;

  @JsonProperty('realm', String, true)
  public realm: string = undefined;

  @JsonProperty('keyid', String, true)
  public keyid: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('comment', String, true)
  public comment: string = undefined;
}
