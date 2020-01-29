import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from './base.model';

@JsonObject
export abstract class BaseNodeModel {

  @JsonProperty('statusCode', Number)
  public ecxStatusCode: number = undefined;

  @JsonProperty('response', BaseModel)
  public response: BaseModel = undefined;
}
