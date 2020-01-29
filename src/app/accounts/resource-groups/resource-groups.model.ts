import {JsonObject, JsonProperty} from 'json2typescript';
import {ResourceGroupModel} from './resource-group.model';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';

@JsonObject
export class ResourceGroupsModel extends DatasetModel<ResourceGroupModel> implements HasAPI {

  @JsonProperty('resourcePools', [ResourceGroupModel])
  public resourceGroups: Array<ResourceGroupModel> = [];

  protected getRecords(): Array<ResourceGroupModel> {
    return this.resourceGroups;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/security/resourcepool';
  }
}
