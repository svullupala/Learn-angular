import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {TriggerModel} from 'job/shared/trigger.model';

@JsonObject
export class TriggersModel extends DatasetModel<TriggerModel> {

  @JsonProperty('triggers', [TriggerModel])
  public triggers: Array<TriggerModel> = [];

  protected getRecords(): Array<TriggerModel> {
    return this.triggers;
  }
}
