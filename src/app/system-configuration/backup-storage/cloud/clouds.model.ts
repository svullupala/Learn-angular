import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import { DatasetModel, HasAPI } from 'shared/models/dataset.model';
import { CloudModel } from './cloud.model';

@JsonObject
export class CloudsModel extends DatasetModel<CloudModel> implements HasAPI {

  @JsonProperty('clouds', [CloudModel])
  public clouds: Array<CloudModel> = [];


  public getRecords(): Array<CloudModel> {
    return this.clouds;
  }

  public api(): string {
    return 'api/cloud';
  }
}
