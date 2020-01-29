import { JsonObject, JsonProperty, JsonConvert } from 'json2typescript';

import { UserModel } from '../users/users.model';
import { DatasetModel } from 'shared/models/dataset.model';

@JsonObject
export class CredentialsModel extends DatasetModel<UserModel> {

  public static CREDENTIAL_API_ENDPOINT: string = 'api/identity/user';

  @JsonProperty('users', [UserModel])
  public users = [];

  public getRecords(): Array<UserModel> {
    return this.users;
  }
}
