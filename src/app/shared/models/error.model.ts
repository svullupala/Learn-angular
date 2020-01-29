import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class ErrorModel {

  public static unexpectedNetworkException: string = 'Network Error';

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('key', undefined, true)
  public key: any = undefined;

  @JsonProperty('log', undefined, true)
  public log: any = undefined;

  @JsonProperty('results', undefined, true)
  public results: any = undefined;

  // Note: the rc member is for NodeJS error compatibility.
  @JsonProperty('rc', String, true)
  public rc: string = undefined;

  public title: string;

  public constructor(title?: string, message?: string, id?: string) {
    this.title = title;
    this.description = message;
    this.id = id;
  }

  public get message(): string {
    return this.description || this.rc || '';
  }

  public set message(value: string) {
    this.description = value;
  }
}
