import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export abstract class SearchResultModel extends BaseModel {

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('hypervisorId', String, true)
  public hypervisorId: string = undefined;

  @JsonProperty('copyTime', Number, true)
  public copyTime: number = undefined;

  @JsonProperty('mappings', [], true)
  public mappingse: Array<any> = [];

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('primary', Boolean, true)
  public primary: boolean = false;

  @JsonProperty('protectionInfo', Object, true)
  public protectionInfo: object = undefined;

  @JsonProperty('siteId', String, true)
  public siteId: string = undefined;

  @JsonProperty('storageProfiles', [String], true)
  public storageProfiles: Array<string> = [];

  @JsonProperty('score', Number, true)
  public score: number = 0;

  @JsonProperty('summary', Object, true)
  public summary: { [key: string]: any } = {};
}
