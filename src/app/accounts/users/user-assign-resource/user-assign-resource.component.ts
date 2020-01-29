import {Component, EventEmitter, OnInit, Input, Output, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {AccessUserModel, AccessUserPermissionModel} from '../user.model';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {UserEditResourceComponent} from '../user-edit-resource/user-edit-resource.component';
import {ResourceGroupModel} from '../../resource-groups/resource-group.model';
import {ErrorModel} from 'shared/models/error.model';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'user-assign-resource',
  templateUrl: './user-assign-resource.component.html',
  styleUrls: ['./user-assign-resource.component.scss']
})
export class UserAssignResourceComponent implements OnInit {
  @Input() models: AccessUserModel[];
  @Output() saveDone = new EventEmitter<AccessUserModel>();
  @Output() cancelClick = new EventEmitter();

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  @ViewChild(UserEditResourceComponent) resource: UserEditResourceComponent;

  private errorTitle: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textFailedToAssignResourceToUserTpl: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private submitValid: boolean;
  private masked: boolean = false;

  get multiUsers(): boolean {
    return this.models && this.models.length > 1;
  }

  get onlyOneUser(): boolean {
    return this.models && this.models.length === 1;
  }

  constructor(private rest: RestService,
              private translate: TranslateService) {
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

  handleError(err: any, silence: boolean): ErrorModel {
    let me = this;
    if (err && me.errorHandler)
      return me.errorHandler.handle(err, false, silence);
    return null;
  }

  oneError(errs: { model: AccessUserModel, error?: ErrorModel }[]): ErrorModel {
    let me = this, msg = [];
    errs.forEach(function (item) {
      if (item.error)
        msg.push(SharedService.formatString(me.textFailedToAssignResourceToUserTpl, item.model.name,
          item.error.message));
    });
    return msg.length > 0 ? new ErrorModel(me.errorTitle, msg.join('\n')) : null;
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.errorTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'users.textFailedToAssignResourceToUserTpl',
      'users.textEditSuccessful',
      'users.textUserResources'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.errorTitle = resource['users.textUserResources'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textFailedToAssignResourceToUserTpl = resource['users.textFailedToAssignResourceToUserTpl'];
        me.textEditSucceed = resource['users.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.submitValid = ( me.multiUsers ? [] : me.onlyOneUser ? me.models[0].resources || [] : []).length > 0;
  }

  onCancelClick() {
    this.cancelClick.emit();
  }

  onSubmitClick() {
    let me = this, total = (me.models || []).length,
      result: { model: AccessUserModel, error?: ErrorModel }[] = [],
      observable: Observable<AccessUserModel>;

    (me.models || []).forEach(function (model) {

      me.mask();
      me.stageMore(model);
      observable = model.update(AccessUserModel, me.rest);
      if (observable) {
        observable.subscribe(
          record => {
            result.push({model: model});

            if (result.length === total) {
              me.unmask();
              me.handleResult(result);
            }
          },
          err => {
            me.unstageMore(model);

            result.push({model: model, error: me.handleError(err, true)});

            if (result.length === total) {
              me.unmask();
              me.handleResult(result);
            }
          }
        );
      } else {

        me.unstageMore(model);
        result.push({model: model, error: new ErrorModel()});

        if (result.length === total) {
          me.unmask();
          me.handleResult(result);
        }
      }
    });
  }

  getSelectedResources(): ResourceGroupModel[] {
    return this.resource ? this.resource.selectedResourceGroups : [];
  }

  private stageMore(model: AccessUserModel): void {
    let me = this, roles = model.roles, resouces = me.getSelectedResources(),
      permissions = [];

    model.metadata['oldPermissions'] = model.permissions;

    model.permissions = model.permissions || [];

    resouces.forEach(function (resource) {
      let permission = new AccessUserPermissionModel();
      permission.resourcePool = resource;
      permission.roles = roles;
      permissions.push(permission);
    });
    model.permissions = permissions;
  }

  private unstageMore(model: AccessUserModel): void {
    let me = this;
    model.permissions = model.metadata['oldPermissions'];
  }

  private handleResult(result: { model: AccessUserModel, error?: ErrorModel }[]): void {
    let me = this, error = me.oneError(result);
    if (error)
      me.handleError(error, false);
    else
      me.info(me.textEditSucceed);

    me.saveDone.emit();
  }

  private hasSubmit(): boolean {
    return !!this.resource;
  }

  private isValid(): boolean {
    return this.submitValid;
  }

  private onResourceChange(): void {
    this.submitValid = this.resource && this.resource.isValid();
  }
}
