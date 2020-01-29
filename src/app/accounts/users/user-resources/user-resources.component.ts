import {Component, ElementRef, Input} from '@angular/core';
import {PermissionEntryModel, PermissionGroupModel} from '../permission-group.model';
import {PermissionGroupsModel} from '../permission-groups.model';
import {AccessUserModel} from '../user.model';

@Component({
  selector: 'user-resources',
  templateUrl: './user-resources.component.html',
  styleUrls: ['./user-resources.component.scss']
})
export class UserResourcesComponent {
  @Input() model: AccessUserModel;
  private masked: boolean = false;

  constructor() {
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }
}
