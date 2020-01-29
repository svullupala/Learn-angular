import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {HypervisorContentModel} from './hypervisor-content.model';

@JsonObject
export class HypervisorContentsModel extends DatasetModel<HypervisorContentModel> {

  @JsonProperty('contents', [HypervisorContentModel])
  public contents: Array<HypervisorContentModel> = [];

  protected getRecords(): Array<HypervisorContentModel> {
    return this.contents;
  }
}
