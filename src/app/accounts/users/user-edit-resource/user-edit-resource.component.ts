import {Component, ElementRef, EventEmitter, OnInit, Input, Output, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {SessionService} from 'core';
import {AccessUserModel} from '../user.model';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {SorterModel} from 'shared/models/sorter.model';
import {ResourceGroupsModel} from '../../resource-groups/resource-groups.model';
import {ResourceGroupModel} from '../../resource-groups/resource-group.model';
import {UserSelectedResourcesComponent} from '../user-selected-resources/user-selected-resources.component';
import {AccessRoleModel} from '../../roles/role.model';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'user-edit-resource',
  templateUrl: './user-edit-resource.component.html',
  styleUrls: ['./user-edit-resource.component.scss']
})
export class UserEditResourceComponent implements OnInit {
  @Input() models: AccessUserModel[];
  @Input() selectedRoles: Array<AccessRoleModel> = [];
  @Output() saveSuccess = new EventEmitter<AccessUserModel>();
  @Output() cancelClick = new EventEmitter();
  @Output() resourceChange = new EventEmitter();

  private form: FormGroup;
  private resourceType: AbstractControl;
  private type: string;
  private resourceGroups: Array<ResourceGroupModel> = [];
  private errorHandler: ErrorHandlerComponent;
  private model: AccessUserModel;
  @ViewChild(UserSelectedResourcesComponent) private srgComponent: UserSelectedResourcesComponent;
  private textUsersTitleTpl: string;

  get selectedResources(): ResourceGroupModel[] {
    return this.multiUsers ? [] : this.model.resources;
  }

  get selectedResourceGroups(): Array<ResourceGroupModel> {
    return this.srgComponent ? this.srgComponent.getValue() : [];
  }

  get hasPendingSelectedResourceGroups(): boolean {
    let me = this, groups = me.resourceGroups || [];
    return groups.findIndex(function (item) {
      return item.metadata['selected'];
    }) !== -1;
  }

  get selectedRolesNames(): string {
    let names = [];
    (this.selectedRoles || []).forEach(function (role, idx) {
      names.push(role.displayName || '');
    });
    return names.join(', ');
  }

  get multiUsers(): boolean {
    return this.models && this.models.length > 1;
  }

  get onlyOneUser(): boolean {
    return this.models && this.models.length === 1;
  }

  get title(): string {
    return this.multiUsers ? SharedService.formatString(this.textUsersTitleTpl,
      this.models.length) : (this.onlyOneUser ? this.model.name : '');
  }

  constructor(private rest: RestService, fb: FormBuilder,
              private translate: TranslateService) {

    this.form = fb.group({
      'resourceType': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.resourceType = this.form.controls['resourceType'];
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit(): void {
    let me = this;
    me.translate.get([
      'users.textUsersTitleTpl'
    ]).subscribe((resource: Object) => {
      me.textUsersTitleTpl = resource['users.textUsersTitleTpl'];
    });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];

    if (!me.models || me.models.length < 1)
      me.model = new AccessUserModel();
    else
      me.model = me.models[0];

    me.loadResourceGroups();
  }

  isValid(): boolean {
    return this.selectedResourceGroups.length > 0;
  }

  loadResourceGroups() {
    let me = this, observable: Observable<ResourceGroupsModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];

    observable = ResourceGroupsModel.retrieve<ResourceGroupModel, ResourceGroupsModel>(ResourceGroupsModel, me.rest,
      undefined, sorters, 0, 0);

    if (observable) {
      observable.subscribe(
        dataset => {

          me.resourceGroups = dataset.records || [];
          // NOTE: the resourceGroup API does not support sort by name.
          me.resourceGroups.sort(function (a, b) {
            return a.name > b.name ? 1 : (a.name === b.name ? 0 : -1);
          });
        },
        err => {
          me.handleError(err, false);
        }
      );
    }
  }

  private resourceTypeValid(): boolean {
    let model = this.model;
    return this.resourceType.valid || !model.phantom;
  }

  private onAddResourcesClick(): void {
    let me = this, groups = me.resourceGroups || [];
    groups.forEach(function (item) {
      if (item.metadata['selected'])
        if (me.srgComponent)
          me.srgComponent.add(item);
    });
  }

  private onResourceChange(): void {
    this.resourceChange.emit();
  }
}
