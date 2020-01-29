import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class AlertMessageModel extends BaseModel {

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('category', String, true)
  public category: string = undefined;

  @JsonProperty('message', String, true)
  public message: string = undefined;

  @JsonProperty('alertTime', Number, true)
  public alertTime: number = 0;

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('dataSource', String, true)
  public dataSource: string = undefined;

  @JsonProperty('retention', Number, true)
  public retention: number = 0;

  @JsonProperty('first', Number, true)
  public first: number = undefined;

  @JsonProperty('last', Number, true)
  public last: number = 0;

  @JsonProperty('expiresAt', Number, true)
  public expiresAt: number = 0;

  @JsonProperty('count', Number, true)
  public count: number = 0;

  @JsonProperty('acknowledged', Boolean, true)
  public acknowledged: boolean = false;

  @JsonProperty('expired', Boolean, true)
  public expired: boolean = false;

  @JsonProperty('unique', Boolean, true)
  public unique: boolean = false;

  @JsonProperty('jobId', String, true)
  public jobId: string = undefined;

  @JsonProperty('jobSessionId', undefined, true)
  public jobSessionId: any = undefined;

  @JsonProperty('logId', String, true)
  public logId: string = undefined;

  canLocateLog(): boolean {
    return !!(this.jobId && this.jobSessionId);
  }
}
