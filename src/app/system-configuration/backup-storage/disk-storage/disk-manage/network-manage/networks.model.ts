import {JsonObject, JsonProperty} from 'json2typescript';
import {NetworkModel} from './network.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class NetworksModel extends DatasetModel<NetworkModel> {

  @JsonProperty('networks', [NetworkModel])
  public networks: Array<NetworkModel> = [];

  protected getRecords(): Array<NetworkModel> {
    return this.networks;
  }
}
