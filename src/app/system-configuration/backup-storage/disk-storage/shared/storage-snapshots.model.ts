import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {PoolModel} from './pool.model';
import {StorageSnapshotModel} from './storage-snapshot.model';

@JsonObject
export class StorageSnapshotsModel extends DatasetModel<StorageSnapshotModel> {

  @JsonProperty('snapshots', [StorageSnapshotModel])
  public snapshots: Array<StorageSnapshotModel> = [];

  protected getRecords(): Array<StorageSnapshotModel> {
    return this.snapshots;
  }
}
