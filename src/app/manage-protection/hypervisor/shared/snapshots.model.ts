import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {HypervisorVersionModel, SnapshotModel} from './snapshot.model';

@JsonObject
export class SnapshotsModel extends DatasetModel<SnapshotModel> {

  @JsonProperty('copies', [SnapshotModel])
  public copies: Array<SnapshotModel> = [];

  protected getRecords(): Array<SnapshotModel> {
    return this.copies;
  }
}

@JsonObject
export class HypervisorVersionsModel extends DatasetModel<HypervisorVersionModel> {
  @JsonProperty('versions', [HypervisorVersionModel])
  public versions: Array<HypervisorVersionModel> = [];

  protected getRecords(): Array<HypervisorVersionModel> {
    return this.versions;
  }
}
