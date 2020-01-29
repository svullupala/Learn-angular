import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {DatacenterModel} from 'hypervisor/shared/datacenter.model';

@JsonObject
export class DatacentersModel extends DatasetModel<DatacenterModel> {

  @JsonProperty('datacenters', [DatacenterModel])
  public datacenters: Array<DatacenterModel> = [];

  protected getRecords(): Array<DatacenterModel> {
    return this.datacenters;
  }
}
