import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseNodeModel} from 'shared/models/base-node.model';
import {StorageModel} from './storage.model';

@JsonObject
export class StorageNodeModel extends BaseNodeModel {

  @JsonProperty('response', StorageModel)
  public response: StorageModel = undefined;
}
