import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {AccessRoleModel} from '../roles/role.model';
import {ResourceGroupModel} from '../resource-groups/resource-group.model';
import {HasPersistentJson, RestService} from 'core';
import {LdapGroupModel} from 'ldapsmtp/ldapGroup.model';

@JsonObject
export class AccessUserPermissionModel implements HasPersistentJson {

  @JsonProperty('resourcePool', ResourceGroupModel, true)
  public resourcePool: ResourceGroupModel = undefined;

  @JsonProperty('roles', [AccessRoleModel], true)
  public roles: AccessRoleModel[] = undefined;

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    let me = this, roleIds = [];
    (me.roles || []).forEach(function (item) {
      roleIds.push(item.id);
    });
    return {
      resourcePoolId: me.resourcePool ? me.resourcePool.id : undefined,
      roleIds: roleIds
    };
  }
}

@JsonObject
export class AccessUserModel extends BaseModel {

  @JsonProperty('type', String, true)
  public type: string = 'NATIVE_USER';

  @JsonProperty('group', LdapGroupModel, true)
  public group: LdapGroupModel = undefined;

  @JsonProperty('password', String, true)
  public password: string = undefined;

  @JsonProperty('oldPassword', String, true)
  public oldPassword: string = undefined;

  @JsonProperty('tenantId', Number, true)
  public tenantId: number;

  @JsonProperty('metadata', Object, true)
  public metadata: any;

  @JsonProperty('permissions', [AccessUserPermissionModel], true)
  public permissions: AccessUserPermissionModel[] = [];

  get hasType(): boolean {
    return this.type && this.type.length > 0;
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    let me = this, permissions = [];
    (me.permissions || []).forEach(function (item) {
      permissions.push(item.getPersistentJson());
    });

    return {
      name: me.type === 'LDAP_GROUP' ? me.group ? me.group.name : me.name : me.name,
      password: me.type === 'LDAP_GROUP' ? undefined : me.password,
      type: me.type,
      sourceProvider: me.type === 'LDAP_GROUP' && me.group ? me.group.getUrl('up') : null,
      sourceUser: me.type === 'LDAP_GROUP' && me.group ? me.group.getId() : null,
      sourceUserDN: me.type === 'LDAP_GROUP' && me.group ? me.group.distinguishedName : '',
      permissions: permissions,
      metadata: me.metadata
    };
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    let result: any = this.getPersistentJson();
    result.password = undefined; // Note: Password can not be changed by user update.
    return result;
  }

  public getChangePasswordJson(): Object {
    return {
      oldPassword: this.oldPassword,
      newPassword: this.password
    };
  }

  public isSuperUser(): boolean {
    return this.roles.findIndex(function (item) {
      return item.name === 'SUPERUSER';
    }) !== -1;
  }

  public isBuiltInAdminAccount() {
    return this.id === '1000';
  }

  /**
   * Update a single user metadata property.  Set value to null to remove property.
   * @param key
   * @param value
   * @param proxy
   */
  public updateMetadata(key: string, value: any, proxy?: RestService) {
    let meta = {};

    meta[key] = value;
    let observable = super.doAction<AccessUserModel>(AccessUserModel, 'changeMetadata', { 'metadata': meta }, proxy);
    if (observable) {
      let subscription = observable.subscribe(
        res => {
          this.metadata = res.metadata;
          subscription.unsubscribe();
        },
        err => {
          console.error('Failed to update user metadata');
        }
      );
    }

  }

  /*
  * Get a single user metadata property.
  * @param key
  */

  public getMetadata(key: string): any {
    if (this.metadata !== undefined && this.metadata[key] !== undefined) {
      return this.metadata[key];
    } else {
      return undefined;
    }
  }

  get resources(): ResourceGroupModel[] {
    let permissions = this.permissions || [],
      result: ResourceGroupModel[] = [];
    permissions.forEach(function (item) {
      result.push(item.resourcePool);
    });
    return result;
  }

  get roles(): AccessRoleModel[] {
    let permissions = this.permissions, permission = this.getPermissionWithResourcePool(this.permissions),
      result: AccessRoleModel[] = [];

    if (permission && permission.roles) {
      for (let i = 0; i < permission.roles.length; i++) {
        result.push(permission.roles[i]);
      }
    } else {
      for (let i = 0; i < permissions.length; i++) {
        if (permissions[i].roles)
          permissions[i].roles.forEach(function (role) {
            if (result.findIndex(function (item) {
                return item.id === role.id;
              }) === -1)
              result.push(role);
          });
        break;
      }
    }
    return result;
  }

  get roleNames(): String[] {
    let roles = this.roles, result: String[] = [];

    roles.forEach(function (role) {
      if (result.findIndex(function (item) {
          return item.valueOf() === role.name;
        }) === -1)
        result.push(String(role.name));
    });
    return result.sort();
  }

  public hasPermission(permissionId: string): boolean {
    return this.roles.findIndex(function (role) {
      return role.permissionIds.findIndex(function (perm) {
        return perm === permissionId;
      }) !== -1;
    }) !== -1;
  }

  private getPermissionWithResourcePool(permissions: AccessUserPermissionModel[]): AccessUserPermissionModel {
    for (let i = 0; i < permissions.length; i++) {
      if (permissions[i].resourcePool && permissions[i].resourcePool.name &&
        permissions[i].resourcePool.name.endsWith('_rpool')) {
        return permissions[i];
      }
    }
    return null;
  }
}
