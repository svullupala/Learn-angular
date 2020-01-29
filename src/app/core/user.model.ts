import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class UserModel extends BaseModel {

  static NATIVE_USER = 'NATIVE_USER';
  static LDAP_USER = 'LDAP_USER';

  @JsonProperty('links', Object, true)
  public links: Object = null;

  @JsonProperty('type', String)
  public type: string = undefined;

  @JsonProperty('tenantId', Number)
  public tenantId: number = undefined;

  @JsonProperty('permissions', [Object], true)
  public permissions: Array<Object> = undefined;

  @JsonProperty('rbacPath', String)
  public rbacPath: string = undefined;

  @JsonProperty('metadata', Object, true)
  public metadata: any;
}
