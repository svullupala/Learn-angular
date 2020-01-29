import { JsonObject, JsonProperty } from 'json2typescript';
import { BaseModel } from 'shared/models/base.model';

@JsonObject
export class UserModel extends BaseModel {

  @JsonProperty('keyid')
  public keyId = '';

  @JsonProperty('ostype')
  public osType: string = '';

  @JsonProperty('comment')
  public comment: string = '';

  @JsonProperty('realm')
  public realm: string = '';

  @JsonProperty('username')
  public username: string = '';

  @JsonProperty('type')
  public type: string = '';
}
