import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';

@JsonObject
export class TriggerModel extends BaseModel {

  @JsonProperty('triggerInfo', Object, true)
  public triggerInfo: {
    id?: number,
    name?: string
    creationTime?: number,
    triggerId?: string,
    jobId?: string,
    category?: string
  } = undefined;

  @JsonProperty('properties', ScheduleModel, true)
  public properties: ScheduleModel = undefined;
}
