import {JsonObject, JsonProperty} from 'json2typescript';
import {AccessUserModel} from './user.model';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';

@JsonObject
export class AccessUsersModel extends DatasetModel<AccessUserModel> implements HasAPI {

  @JsonProperty('users', [AccessUserModel])
  public users: Array<AccessUserModel> = [];

  protected getRecords(): Array<AccessUserModel> {
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
    return 'api/security/user';
  }
}
