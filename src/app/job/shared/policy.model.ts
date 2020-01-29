import 'rxjs/Rx';
import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import { PostScriptsModel } from 'shared/components/post-scripts/post-scripts.model';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';

@JsonObject
export class PolicyModel extends BaseModel {

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('subType', String, true)
  public subType: string = undefined;

  @JsonProperty('creationTime', Number, true)
  public creationTime: number = 0;

  @JsonProperty('lastUpdated', Number, true)
  public lastUpdated: number = 0;

  @JsonProperty('logicalDelete', Boolean, true)
  public logicalDelete: boolean = false;

  @JsonProperty('serviceId', String, true)
  public serviceId: string = undefined;

  @JsonProperty('script', PostScriptsModel, true)
  public script: PostScriptsModel  = undefined;

  @JsonProperty('spec', undefined, true)
  public spec = undefined;

  @JsonProperty('tenantId', Number, true)
  public tenantId = undefined;

  @JsonProperty('version', String, true)
  public version: string = '';

  public trigger: ScheduleModel;
}
