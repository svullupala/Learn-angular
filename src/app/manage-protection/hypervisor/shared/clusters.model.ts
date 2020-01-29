import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {ClusterModel} from './cluster.model';

@JsonObject
export class ClustersModel extends DatasetModel<ClusterModel> {

  @JsonProperty('clusters', [ClusterModel])
  public clusters: Array<ClusterModel> = [];

  protected getRecords(): Array<ClusterModel> {
    return this.clusters;
  }
}
