import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class LdapGroupModel extends BaseModel {

  @JsonProperty('name')
  public name: string = undefined;

  @JsonProperty('cn')
  public cn: string = undefined;

  @JsonProperty('distinguishedName')
  public distinguishedName: string = undefined;

  @JsonProperty('type')
  public type: string = undefined;

  @JsonProperty('sid')
  public sid: string = undefined;

  @JsonProperty('id')
  public id: string = undefined;

  public roleIds: string[] = [];

  public getRegistrationJson(): Object {
    return {
      name: this.name,
      sourceProvider: this.getUrl('up'),
      sourceUser: this.getId(),
      sourceUserDN: this.distinguishedName,
      type: 'LDAP_GROUP',
      roleIds: this.roleIds
    };
  }
}
