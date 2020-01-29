import {Component, OnInit, Input, ViewChild} from '@angular/core';
import {AccessUserModel} from '../user.model';
import {PermissionRoleComponent} from '../../permission-groups/permission-role/permission-role.component';

@Component({
  selector: 'user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() model: AccessUserModel;
  @ViewChild(PermissionRoleComponent) permissionRoleComponent: PermissionRoleComponent;

  constructor() {
  }

  ngOnInit(): void {
  }

  remapPermissionRole(user: AccessUserModel): void {
    if (this.permissionRoleComponent)
      this.permissionRoleComponent.remap(user.roles);
  }
}
