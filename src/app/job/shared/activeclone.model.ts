import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class ActiveCloneModel extends BaseModel {
  @JsonProperty('vm', String, true)
  public vm: string = undefined;
}
