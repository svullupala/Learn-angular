import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {HostModel} from './host.model';

@JsonObject
export class HostsModel extends DatasetModel<HostModel> {

  @JsonProperty('hosts', [HostModel])
  public hosts: Array<HostModel> = [];

  protected getRecords(): Array<any> {
    return this.hosts;
  }
}
