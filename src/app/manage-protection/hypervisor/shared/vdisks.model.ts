import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {VdiskModel} from './vdisk.model';

@JsonObject
export class VdisksModel extends DatasetModel<VdiskModel> {

  @JsonProperty('vdisks', [VdiskModel])
  public vdisks: Array<VdiskModel> = [];

  protected getRecords(): Array<VdiskModel> {
    return this.vdisks;
  }
}
