import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {AccessRoleModel} from '../roles/role.model';

@JsonObject
export class PermissionEntryModel {
  @JsonProperty('id', String, true)
  public id: string = undefined;
  @JsonProperty('name', String, true)
  public name: string = undefined;
  @JsonProperty('virtualResource', String, true)
  public virtualResource: string = undefined;
  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  public metadata: Object = {};

  public belongsTo: AccessRoleModel[] = [];


  get belongsToNames(): String[] {
    let result: String[] = [];
    (this.belongsTo || []).forEach(function (role) {
      result.push(String(role.displayName));
    });
    return result.sort();
  }

  /**
   * Constructs a copy of this model.
   * Don't use deep-copy(clone) because of performance concern.
   *
   * @returns {PermissionEntryModel}
   */
  public copy(): PermissionEntryModel {
    let target = new PermissionEntryModel();
    Object.assign(target, this);
    return target;
  }
}

@JsonObject
export class PermissionGroupModel extends BaseModel {

  @JsonProperty('permissions', [PermissionEntryModel], true)
  public permissions: PermissionEntryModel[] = undefined;

  /**
   * Constructs a copy of this model.
   * Don't use deep-copy(clone) because of performance concern.
   *
   * @returns {PermissionGroupModel}
   */
  public copy(): PermissionGroupModel {
    let target = new PermissionGroupModel();
    Object.assign(target, this);
    if (this.permissions) {
      target.permissions = [];
      (this.permissions || []).forEach(function (item) {
        target.permissions.push(item.copy());
      });
    }
    return target;
  }
}
