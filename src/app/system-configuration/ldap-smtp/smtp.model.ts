import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {RestService} from 'core';

@JsonObject
export class SmtpModel extends BaseModel {

  public proxy: RestService;

  @JsonProperty('hostAddress')
  public hostAddress: string = undefined;

  @JsonProperty('name')
  public name: string = undefined;

  @JsonProperty('user')
  public user: any = undefined;

  @JsonProperty('portNumber', undefined, true)
  public portNumber: number = undefined;

  @JsonProperty('timeout', undefined, true)
  public timeout: number = undefined;

  @JsonProperty('fromAddress', undefined, true)
  public fromAddress: string = undefined;

  @JsonProperty('subjectPrefix', undefined, true)
  public subjectPrefix: string = undefined;

  public username: string;
}
