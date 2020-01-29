import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export abstract class CatalogModel extends BaseModel {

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('score', Number, true)
  public score: number = 0;

  @JsonProperty('summary', Object, true)
  public summary: { [key: string]: any } = {};
}
