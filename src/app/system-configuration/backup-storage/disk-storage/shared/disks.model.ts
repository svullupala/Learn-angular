import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {DiskModel} from './disk.model';

@JsonObject
export class DisksModel extends DatasetModel<DiskModel> {

  @JsonProperty('disks', [DiskModel])
  public disks: Array<DiskModel> = [];

  protected getRecords(): Array<DiskModel> {
    return this.disks;
  }
}
