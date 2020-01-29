import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class VersionModel {

  @JsonProperty('product', String, true)
  public product: string = undefined;

  @JsonProperty('version', String, true)
  public version: string = '10.1.0'; // Show this as a default

  @JsonProperty('build', String, true)
  public build: string = undefined;

  @JsonProperty('date', String, true)
  public date: string = undefined;

  @JsonProperty('epoch', String, true)
  public epoch: string = undefined;
}
