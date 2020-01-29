import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {PermissionGroupModel} from '../permission-groups/permission-group.model';

@JsonObject
export class AccessRoleModel extends BaseModel {

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('virtualresources', [PermissionGroupModel], true)
  public virtualresources: PermissionGroupModel[] = undefined;

  method: string;
  template: string;

  get canned(): boolean {
    return !this.isUpdateAllowed() && !this.isDeleteAllowed();
  }

  get permissionIds(): string[] {
    let ids = [];
    (this.virtualresources || []).forEach(function (vr) {
      (vr.permissions || []).forEach(function (perm) {
        ids.push(perm.id);
      });
    });
    return ids;
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    let me = this, permissionIds = [];
    return {
      name: me.name,
      description: '',
      permissionIds: me.permissionIds
    };
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    return this.getPersistentJson();
  }

  get permissionGroupNames(): String[] {
    let pgs = this.virtualresources || [], result: String[] = [];

    pgs.forEach(function (item) {
      result.push(String(item.name));
    });
    return result.sort();
  }

  /**
   * Constructs a copy of this model.
   * Don't use deep-copy(clone) because of performance concern.
   *
   * @returns {AccessRoleModel}
   */
  public copy(): AccessRoleModel {
    let target = new AccessRoleModel();
    Object.assign(target, this);
    if (this.virtualresources) {
      target.virtualresources = [];
      (this.virtualresources || []).forEach(function (item) {
        target.virtualresources.push(item.copy());
      });
    }
    return target;
  }
}
