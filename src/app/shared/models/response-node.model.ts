import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class ResponseNodelModel {

  @JsonProperty('statusCode', Number)
  public statusCode: number = undefined;

  @JsonProperty('response', undefined)
  public response: any = undefined;
}
