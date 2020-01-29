import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {PoolModel} from './pool.model';

@JsonObject
export class PoolsModel extends DatasetModel<PoolModel> {

  @JsonProperty('pools', [PoolModel])
  public pools: Array<PoolModel> = [];

  protected getRecords(): Array<PoolModel> {
    return this.pools;
  }
}
