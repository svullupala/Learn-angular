import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {RestService} from 'core';

@JsonObject
export class UserModel extends BaseModel {
  public proxy: RestService;

  @JsonProperty('username', String)
  public username: string = undefined;

}
