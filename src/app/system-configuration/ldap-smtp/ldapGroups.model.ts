import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {LdapGroupModel} from './ldapGroup.model';

@JsonObject
export class LdapGroupsModel extends DatasetModel<LdapGroupModel> {

  @JsonProperty('groups')
  public groups: Array<LdapGroupModel> = [];

  protected getRecords(): Array<LdapGroupModel> {
    return this.groups;
  }
}
