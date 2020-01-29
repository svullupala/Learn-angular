import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AccessRoleModel} from '../../roles/role.model';
import {PermissionEntryModel, PermissionGroupModel} from '../permission-group.model';
import {PermissionGroupsModel} from '../permission-groups.model';
import {MD5} from 'shared/util/md5';

@Component({
  selector: 'permission-role',
  templateUrl: './permission-role.component.html',
  styleUrls: ['./permission-role.component.scss']
})
export class PermissionRoleComponent implements OnInit {
  @Input() roles: AccessRoleModel[];
  private model: PermissionGroupModel[];
  private _roles: AccessRoleModel[] = [];
  private masked: boolean = false;
  private requiredIds: string[] = PermissionGroupsModel.REQUIRED_IDS;
  private timers: { key: string, timer: number }[] = [];

  constructor(private elementRef: ElementRef) {
  }

  ngOnInit(): void {
    let me = this;
    me.model = [];
    me._roles = [];
    me.remap(me.roles);
  }

  remap(roles: AccessRoleModel[]): void {
    let me = this, addRoles = [], removeRoles = [];

    (me._roles || []).forEach(function (item) {
      let target = (roles || []).find(function (role) {
        return role.equals(item);
      });
      if (!target)
        removeRoles.push(item.copy());
    });
    (roles || []).forEach(function (item) {
      let target = (me._roles || []).find(function (role) {
        return role.equals(item);
      });
      if (!target)
        addRoles.push(item.copy());
    });

    if (addRoles.length > 0) {
      addRoles.forEach(function (item) {
        me._roles.push(item);
      });
      me.addRoles(addRoles);
    }
    if (removeRoles.length > 0) {
      removeRoles.forEach(function (item) {
        me.removeRole(item);
      });
    }
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  addRole(role: AccessRoleModel): void {
    let me = this, newRole, index = (me._roles || []).findIndex(function (item) {
      return item.equals(role);
    });
    if (index !== -1)
      return;

    newRole = role.copy();
    me._roles.push(newRole);
    me.addRoles([newRole]);
  }

  removeRole(role: AccessRoleModel): void {
    let me = this, removeGroups = [], index = (me._roles || []).findIndex(function (item) {
      return item.equals(role);
    });
    if (index === -1)
      return;

    me._roles.splice(index, 1);
    (me.model || []).forEach(function (group) {
      let removeEntries = [];
      (group.permissions || []).forEach(function (item, idxOfItem) {
        let idx = (item.belongsTo || []).findIndex(function (btr) {
          return btr.equals(role);
        });
        if (idx !== -1) {
          item.belongsTo.splice(idx, 1);
        }
        if ((item.belongsTo || []).length === 0)
          removeEntries.push(item);
      });
      if (removeEntries.length > 0) {
        removeEntries.forEach(function (entry) {
          let idx = group.permissions.findIndex(function (item) {
            return item.id === entry.id;
          });
          if (idx !== -1)
            group.permissions.splice(idx, 1);
        });
      }
      if ((group.permissions || []).length === 0)
        removeGroups.push(group);
    });
    if (removeGroups.length > 0) {
      removeGroups.forEach(function (group) {
        let idx = me.model.findIndex(function (item) {
          return item.equals(group);
        });
        if (idx !== -1) {
          me.model.splice(idx, 1);
        }
      });
    }
  }

  private isNewGroup(group: PermissionGroupModel): boolean {
    let me = this,
      idx = (me.model || []).findIndex(function (item) {
        return item.equals(group);
      });
    return idx === -1;
  }

  private isNewPermission(group: PermissionGroupModel, entry: PermissionEntryModel): boolean {
    let me = this, idx,
      target = (me.model || []).find(function (item) {
        return item.equals(group);
      });
    if (!target)
      return true;

    idx = (target.permissions || []).findIndex(function (item) {
      return item.id === entry.id;
    });
    return idx === -1;
  }

  private addRoles(roles: AccessRoleModel[]): void {
    let me = this;

    (roles || []).forEach(function (role) {
      (role.virtualresources || []).forEach(function (group) {
        if (me.requiredIds.indexOf(group.id) !== -1) {
          if (me.isNewGroup(group)) {
            (group.permissions || []).forEach(function (item) {
              item.belongsTo = [];
            });
          } else {
            (group.permissions || []).forEach(function (item) {
              if (me.isNewPermission(group, item))
                item.belongsTo = [];
            });
          }
        }
      });
    });

    (roles || []).forEach(function (role) {
      (role.virtualresources || []).forEach(function (group) {
        if (me.requiredIds.indexOf(group.id) !== -1) {
          let target = me.model.find(function (item) {
            return item.equals(group);
          });
          if (target) {
            (group.permissions || []).forEach(function (item) {
              let perm = (target.permissions || []).find(function (entry) {
                return entry.id === item.id;
              });
              if (!perm) {
                target.permissions = target.permissions || [];
                item.belongsTo = item.belongsTo || [];
                item.belongsTo.push(role);
                target.permissions.push(item);
              } else {
                perm.belongsTo = perm.belongsTo || [];
                perm.belongsTo.push(role);
              }
            });
          } else {
            (group.permissions || []).forEach(function (item) {
              item.belongsTo = item.belongsTo || [];
              item.belongsTo.push(role);
            });
            me.model.push(group);
          }
        }
      });
    });

    me.model.sort(function (a, b) {
      return a.name > b.name ? 1 : (a.name === b.name ? 0 : -1);
    });
  }

  private onDetailClick(item: PermissionGroupModel): void {
    this.addCollapsibleListeners(item);
  }

  private addCollapsibleListeners(item: PermissionGroupModel): void {
    let me = this, selector = '#' + me.getCollapsibleContainerId(item), element = jQuery(selector),
      operatorId = me.getCollapsibleOperatorId(item),
      context = {operatorId: operatorId, done: false};
    if (element) {
      element.off('shown.bs.collapse').on('shown.bs.collapse',
        context, function (eventObject) {
          if (!eventObject.data.done) {
            eventObject.data.done = true;
            element.off('shown.bs.collapse');
            element.off('hidden.bs.collapse');
            me.setExpanded(item);
            me.setCollapsibleIcon(eventObject.data.operatorId, 'ion-chevron-right', 'ion-chevron-down');
          }
        });
      element.off('hidden.bs.collapse').on('hidden.bs.collapse',
        context, function (eventObject) {
          if (!eventObject.data.done) {
            eventObject.data.done = true;
            element.off('hidden.bs.collapse');
            element.off('shown.bs.collapse');
            me.setCollapsed(item);
            me.setCollapsibleIcon(eventObject.data.operatorId, 'ion-chevron-down', 'ion-chevron-right');
          }
        });
    }
  }

  private isExpanded(item: PermissionGroupModel): boolean {
    if (item) {
      return !!item.metadata['expanded'];
    }
    return false;
  }

  private setExpanded(item: PermissionGroupModel): void {
    if (item) {
      item.metadata['expanded'] = true;
    }
  }

  private setCollapsed(item: PermissionGroupModel): void {
    if (item) {
      item.metadata['expanded'] = false;
    }
  }

  private setCollapsibleIcon(operatorId: string, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + operatorId);
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }

  private getCollapsibleOperatorId(item: PermissionGroupModel): string {
    return 'permission-role-collapsible-icon-' + MD5.encode(item.getId());
  }

  private getCollapsibleContainerId(item: PermissionGroupModel): string {
    return 'permission-role-' + MD5.encode(item.getId());
  }
}
