import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseNodeModel} from 'shared/models/base-node.model';
import {SlapolicyModel} from './slapolicy.model';

@JsonObject
export class SlapolicyNodeModel extends BaseNodeModel {

  @JsonProperty('response', SlapolicyModel)
  public response: SlapolicyModel = undefined;
}
