import {Component, OnInit, Input} from '@angular/core';
import {AccessRoleModel} from '../role.model';

@Component({
  selector: 'role-view',
  templateUrl: './role-view.component.html',
  styleUrls: ['./role-view.component.scss']
})
export class RoleViewComponent implements OnInit {
  @Input() model: AccessRoleModel;

  constructor() {
  }

  ngOnInit(): void {
  }
}
