import {Component, ElementRef, EventEmitter, OnInit, Input, Output, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {AccessRoleModel} from '../role.model';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {AccessRolesModel} from '../roles.model';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import {
  PermissionGroupSelectComponent
} from
  '../../permission-groups/permission-group-select/permission-group-select.component';
import {SdlTooltipDirective} from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';

@Component({
  selector: 'role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})

export class RoleEditComponent implements OnInit {

  @Input() createLink: LinkModel;
  @Input() model: AccessRoleModel;
  @Output() saveSuccess = new EventEmitter<AccessRoleModel>();
  @Output() cancelClick = new EventEmitter();

  public form: FormGroup;
  public name: AbstractControl;
  public method: AbstractControl;
  public template: AbstractControl;

  cannedRoles: Array<AccessRoleModel> = [];

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();
  @ViewChild('roleEditContainer') editContainer: ElementRef;
  @ViewChild(PermissionGroupSelectComponent) pgselector: PermissionGroupSelectComponent;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirmModifyTitle: string;
  private textConfirmModifyMessage: string;

  private masked: boolean = false;

  constructor(private rest: RestService, fb: FormBuilder,
              private translate: TranslateService) {

    this.form = fb.group({
      'template': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'method': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.template = this.form.controls['template'];
    this.method = this.form.controls['method'];
    this.name = this.form.controls['name'];
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  reset(): void {
    this.model = new AccessRoleModel();
    this.form.reset();
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'roles.textConfirmModifyTitle',
      'roles.textConfirmModifyMessage',
      'roles.textCreationSuccessful',
      'roles.textEditSuccessful'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirmModifyTitle = resource['roles.textConfirmModifyTitle'];
        me.textConfirmModifyMessage = resource['roles.textConfirmModifyMessage'];
        me.textCreateSucceed = resource['roles.textCreationSuccessful'];
        me.textEditSucceed = resource['roles.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    if (!me.model)
      me.model = new AccessRoleModel();

    me.loadCannedRoles();
  }

  loadCannedRoles() {
    let me = this, observable: Observable<AccessRolesModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ],
      filters = [
        new FilterModel('type', 'BUILTIN')
      ];

    me.mask();

    observable = AccessRolesModel.retrieve<AccessRoleModel, AccessRolesModel>(AccessRolesModel, me.rest,
      filters, sorters, 0, 0);

    if (observable) {
      observable.subscribe(
        dataset => {

          me.cannedRoles = dataset.records || [];
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  onCancelClick() {
    this.cancelClick.emit();
  }

  confirm(item: AccessRoleModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirmModifyTitle, me.textConfirmModifyMessage,
        AlertType.CONFIRMATION, handler);
  }

  onSaveClick() {
    let me = this, observable: Observable<AccessRoleModel>;
    if (me.model.phantom) {
      me.mask();
      if (me.pgselector)
        me.model.virtualresources = me.pgselector.getValue();
      observable = AccessRolesModel.create(AccessRoleModel, me.model, me.createLink, me.rest);
      if (observable) {
        observable.subscribe(
          record => {
            me.unmask();
            me.info(me.textCreateSucceed);
            me.saveSuccess.emit(record);
            me.reset();
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
      } else {
        me.unmask();
      }
    } else {
      me.confirm(me.model, function () {

        me.mask();
        if (me.pgselector)
          me.model.virtualresources = me.pgselector.getValue();
        observable = me.model.update(AccessRoleModel, me.rest);
        if (observable) {
          observable.subscribe(
            record => {
              me.unmask();
              me.info(me.textEditSucceed);
              me.reset();
              me.saveSuccess.emit(record);
            },
            err => {
              me.unmask();
              me.handleError(err, false);
            }
          );
        } else {
          me.unmask();
        }

      });
    }
  }

  startEdit(item: AccessRoleModel) {
    let me = this, oldId, newId = item ? item.id : undefined;

    if (me.model && !me.model.phantom) {
      oldId = me.model.id;
    }

    me.model = item;
  }

  private editForm(): any {
    let me = this, element = me.editContainer && me.editContainer.nativeElement;
    return element;
  }

  private isValid(): boolean {
    let model = this.model;
    return model.name && model.name.length > 0 &&
      (!model.phantom ||
        (model.method === 'new' || model.method === 'template' && model.template && model.template.length > 0));
  }

  private getTemplateRole(): AccessRoleModel {
    let me = this, target, hasTempalte = me.model.template && me.model.template.length > 0;
    if (hasTempalte) {
      target = (me.cannedRoles || []).find(function (item) {
        return item.id === me.model.template;
      });
    }
    return target;
  }

  private onTemplateChange(): void {
    let me = this, tempRole = me.getTemplateRole();
    if (tempRole && me.pgselector)
      me.pgselector.setValue(tempRole.virtualresources);
  }
}
