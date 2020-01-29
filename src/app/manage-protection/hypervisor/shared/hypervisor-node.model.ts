import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseNodeModel} from 'shared/models/base-node.model';
import {HypervisorModel} from './hypervisor.model';

@JsonObject
export class HypervisorNodeModel extends BaseNodeModel {

  @JsonProperty('response', HypervisorModel)
  public response: HypervisorModel = undefined;
}
