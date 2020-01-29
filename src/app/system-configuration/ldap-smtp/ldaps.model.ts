import {JsonObject, JsonProperty} from 'json2typescript';
import {LdapModel} from './ldap.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class LdapsModel extends DatasetModel<LdapModel> {

  @JsonProperty('ldapServers', [LdapModel], true)
  public ldapServers: Array<LdapModel> = [];

  protected getRecords(): Array<LdapModel> {
    return this.ldapServers;
  }
}
