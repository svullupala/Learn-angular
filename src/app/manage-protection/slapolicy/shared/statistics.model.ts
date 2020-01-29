import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class StatisticsModel {

  @JsonProperty('resourceType', String, true)
  public resourceType: string = undefined;

  @JsonProperty('total', Number, true)
  public total: number = 0;

  @JsonProperty('success', Number, true)
  public success: number = 0;

  @JsonProperty('failed', Number, true)
  public failed: number = 0;

}
