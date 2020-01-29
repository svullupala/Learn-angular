import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class StorageStatModel extends BaseModel {

  @JsonProperty('storageId', String, true)
  public storageId: string = undefined;

  @JsonProperty('sizeTotal', Number, true)
  public sizeTotal: number = 0;

  @JsonProperty('sizeUsed', Number, true)
  public sizeUsed: number = 0;

  @JsonProperty('sizeFree', Number, true)
  public sizeFree: number = 0;

  @JsonProperty('writable', Boolean, true)
  public writable: boolean = false;

  @JsonProperty('site', String, true)
  public site: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('errorDescription', String, true)
  public errorDescription: string = undefined;

  @JsonProperty('deduplicationRatio', String, true)
  public deduplicationRatio: string = undefined;

  @JsonProperty('compressionRatio', String, true)
  public compressionRatio: string = undefined;

  @JsonProperty('time', undefined, true)
  public time: any = 0;

  @JsonProperty('type', String, true)
  public type: string = 'vsnap';

  @JsonProperty('jobId', String, true)
  public jobId: string = undefined;

  @JsonProperty('jobSessionId', String, true)
  public jobSessionId: string = undefined;

  @JsonProperty('logId', String, true)
  public logId: string = undefined;

  canLocateLog(): boolean {
    return !!(this.jobId && this.jobSessionId && this.logId);
  }
}
