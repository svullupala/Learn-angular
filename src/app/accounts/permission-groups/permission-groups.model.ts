import {JsonObject, JsonProperty} from 'json2typescript';
import {PermissionGroupModel} from './permission-group.model';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';

@JsonObject
export class PermissionGroupsModel extends DatasetModel<PermissionGroupModel> implements HasAPI {

  public static REQUIRED_IDS = ['Application', 'Application Server', 'Cloud', 'Hypervisor',
    'Identity and Keys', 'LDAP', 'Log', 'Policy', 'Proxy', 'Report', 'Resource Pool', 'Certificate',
    'Role', 'Script', 'Script Server', 'Screen', 'Site', 'SMTP', 'Storage', 'Storage Work Flow', 'User'];
  public static SCREEN_ID = 'Screen';

  @JsonProperty('virtualresources', [PermissionGroupModel])
  public virtualresources: Array<PermissionGroupModel> = [];

  protected getRecords(): Array<PermissionGroupModel> {
    return this.virtualresources;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/security/virtualresource';
  }
}
