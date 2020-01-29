import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {VolumeModel} from './volume.model';

@JsonObject
export class VolumesModel extends DatasetModel<VolumeModel> {

  @JsonProperty('volumes', [VolumeModel])
  public volumes: Array<VolumeModel> = [];

  protected getRecords(): Array<VolumeModel> {
    return this.volumes;
  }
}
