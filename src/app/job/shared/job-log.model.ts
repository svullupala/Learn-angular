import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class JobLogModel extends BaseModel {

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('category', String, true)
  public category: string = undefined;

  @JsonProperty('logTime', undefined, true)
  public logTime: any = undefined;

  @JsonProperty('modName', String, true)
  public modName: string = undefined;

  @JsonProperty('jobsessionTaskId', undefined, true)
  public jobsessionTaskId: any = undefined;

  @JsonProperty('jobsessionId', Number, true)
  public jobsessionId: number = 0;

  @JsonProperty('threadId', undefined, true)
  public threadId: any = undefined;

  @JsonProperty('message', String, true)
  public message: string = undefined;

  @JsonProperty('messageId', String, true)
  public messageId: string = undefined;

  @JsonProperty('detail', String, true)
  public detail: string = null;
}
