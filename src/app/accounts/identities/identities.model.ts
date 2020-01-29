import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import {IdentityModel} from './identity.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class IdentitiesModel extends DatasetModel<IdentityModel> {

  @JsonProperty('users', [IdentityModel])
  public users: Array<IdentityModel> = [];

  public getRecords(): Array<IdentityModel> {
    return this.users;
  };
}
