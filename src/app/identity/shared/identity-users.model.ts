import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {IdentityUserModel} from './identity-user.model';

@JsonObject
export class IdentityUsersModel extends DatasetModel<IdentityUserModel> implements HasAPI {

  @JsonProperty('users', [IdentityUserModel])
  public users: Array<IdentityUserModel> = [];

  protected getRecords(): Array<IdentityUserModel> {
    return this.users;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/identity/user';
  }
}
