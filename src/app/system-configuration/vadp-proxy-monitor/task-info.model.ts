import { JsonObject, JsonProperty } from 'json2typescript';
import { HateoasModel } from 'shared/models/hateoas.model';
import { RunningTasksModel } from './running-tasks.model';

@JsonObject
export class TaskInfoModel extends HateoasModel {

  @JsonProperty('count', Number, true)
  public count: number = 0;

  @JsonProperty('runningTasks', [RunningTasksModel], true)
  public runningTasks: Array<RunningTasksModel> = [];
}
