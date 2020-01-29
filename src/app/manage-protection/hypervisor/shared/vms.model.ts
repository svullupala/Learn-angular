import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {VmModel} from './vm.model';

@JsonObject
export class VmsModel extends DatasetModel<VmModel> {

  @JsonProperty('vms', [VmModel])
  public vms: Array<VmModel> = [];

  protected getRecords(): Array<VmModel> {
    return this.vms;
  }
}
