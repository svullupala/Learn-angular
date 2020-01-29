import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class IdentityModel extends BaseModel {

  @JsonProperty('name', String)
  public name: string = '';

  @JsonProperty('username', String, true)
  public username: string = undefined;

  @JsonProperty('ostype', String, true)
  public ostype: string = 'LINUX';

  @JsonProperty('password', String, true)
  public password: string = undefined;

  @JsonProperty('type', String)
  public type: string = 'system';

  @JsonProperty('id', String)
  public id: string = '';

  @JsonProperty('comment', String)
  public comment: string = '';


  public getPersistentJson(): Object {
    return {
      name: this.name,
      username: this.username,
      password: this.password,
      type: this.type,
      ostype: this.ostype,
      comment: this.comment
    };
  }

  public getUpdateJson(): Object {
    return {
      name: this.name,
      username: this.username,
      password: this.password,
      comment: this.comment
    };
  }
}
