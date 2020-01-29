import {JsonObject, JsonProperty} from 'json2typescript';
import { DatasetModel } from 'shared/models/dataset.model';
import { BucketModel } from './bucket.model';

@JsonObject
export class BucketsModel {

  @JsonProperty('buckets', [BucketModel])
  public buckets: Array<BucketModel> = [];


  public getRecords(): Array<BucketModel> {
    return this.buckets;
  }
}
