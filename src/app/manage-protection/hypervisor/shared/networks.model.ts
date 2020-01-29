import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {NetworkModel} from "./network.model";

@JsonObject
export class NetworksModel extends DatasetModel<NetworkModel> {

  @JsonProperty('networks', [NetworkModel])
  public networks: Array<NetworkModel> = [];

  protected getRecords(): Array<any> {
    return this.networks;
  }
}
