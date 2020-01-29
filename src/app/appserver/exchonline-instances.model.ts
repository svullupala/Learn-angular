import {JsonObject, JsonProperty} from 'json2typescript';
import {ExchOnlineInstanceModel} from 'appserver/exchonline-instance.model';

@JsonObject
export class ExchOnlineInstancesModel {

  @JsonProperty('instances', [ExchOnlineInstanceModel], true)
  public instances: Array<ExchOnlineInstanceModel> = [];

  public getRecords(): Array<ExchOnlineInstanceModel> {
    return this.instances;
  }
}
