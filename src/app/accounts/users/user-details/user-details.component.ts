import {Component, EventEmitter, Input, Output, ViewChild, Renderer2, NgZone} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {AccessUserModel} from '../user.model';
import {RestService} from 'core';
import {SharedService} from 'shared/shared.service';
import {UserViewComponent} from '../user-view/user-view.component';
import {KeyboardPopover} from 'shared/util/keyboard-popover';
import {FocusMonitor} from '@angular/cdk/a11y';

@Component({
  selector: 'user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent extends KeyboardPopover {

  @Input() models: Array<AccessUserModel> = [];
  @Output() modifySettingsClick = new EventEmitter<AccessUserModel[]>();
  @Output() changePasswordClick = new EventEmitter<AccessUserModel>();
  @Output() modifyResourcesClick = new EventEmitter<AccessUserModel[]>();
  @Output() deleteUserClick = new EventEmitter<AccessUserModel[]>();
  @Output() modifyRolesClick = new EventEmitter<AccessUserModel[]>();

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  @ViewChild(UserViewComponent) viewComponent: UserViewComponent;

  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private textSelectedUsersTitleTpl: string;

  private masked: boolean = false;

  get hasUsers(): boolean {
    return this.models && this.models.length > 0;
  }

  get hasMore(): boolean {
    return this.hasUsers && (this.canModifySettings() || this.canModifyResources()
      || this.canDeleteUser() || this.canChangePassword(this.models[0]));
  }

  get onlyOneUser(): boolean {
    return this.models && this.models.length === 1;
  }

  get selectedUsersWithDiffRoles(): boolean {
    let me = this;
    if (!me.hasUsers || me.onlyOneUser)
      return false;

    for (let i = 0; i < me.models.length; i++) {
      let roles = me.models[i].roleNames;
      if (me.models.findIndex(function (item) {
          return !me.sameRoleNames(item.roleNames, roles);
        }) !== -1)
        return true;
    }
    return false;
  }

  get title(): string {
    return this.hasUsers ? (this.models.length > 1 ? SharedService.formatString(this.textSelectedUsersTitleTpl,
      this.models.length) : this.models[0].name) : '';
  }

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private rest: RestService,
              private translate: TranslateService) {
    super(renderer, focusMonitor, ngZone);
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

  ngOnInit(): void {
    let me = this;
    super.ngOnInit();

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'users.textCreationSuccessful',
      'users.textEditSuccessful',
      'users.textSelectedUsersTitleTpl'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['users.textCreationSuccessful'];
        me.textEditSucceed = resource['users.textEditSuccessful'];
        me.textSelectedUsersTitleTpl = resource['users.textSelectedUsersTitleTpl'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  remapPermissionRole(users: AccessUserModel[]): void {
    if (this.viewComponent && users && users.length === 1)
      this.viewComponent.remapPermissionRole(users[0]);
  }

  private onChangePasswordClick(): void {
    this.changePasswordClick.emit(this.models[0]);
  }

  private onModifySettingsClick(): void {
    this.modifySettingsClick.emit(this.models);
  }

  private onModifyRolesClick(): void {
    this.modifyRolesClick.emit(this.models);
  }

  private onModifyResourcesClick(): void {
    this.modifyResourcesClick.emit(this.models);
  }

  private onDeleteUserClick(): void {
    this.deleteUserClick.emit(this.models);
  }

  private canChangePassword(item: AccessUserModel): boolean {
    let builtInAdmin = item && item.isBuiltInAdminAccount(),
      hasLink = item && item.hasLink('changePassword');

    // Basic RBAC: check presence of changepassword link
    // Additional logic: regular logged in admin cannot change local admin's password
    if (builtInAdmin) {
      return SessionService.getInstance().isBuiltInAdminUser() && hasLink;
    } else {
      return hasLink;
    }
  }

  private canDelete(item: AccessUserModel) {
    let builtInAdmin = item && item.isBuiltInAdminAccount(),
      hasLink = item && item.hasLink('delete');
    // Basic RBAC: check presence of delete link
    // Additional logic: regular logged in admin cannot delete local admin
    if (builtInAdmin) {
      return SessionService.getInstance().isBuiltInAdminUser() && hasLink;
    } else {
      return hasLink;
    }
  }

  private canModifyNothing(): boolean {
    return !(this.canModifySettings() || this.canModifyRoles() || this.canModifyResources());
  }

  private canModifySettings(): boolean {
    let me = this;
    if (!me.onlyOneUser) {
      return false;
    }

    if (me.models[0].isSuperUser()) {
      return this.canChangePassword(me.models[0]);
    }

    return this._canEditSettings();
  }

  private canModifyRoles(): boolean {
    let me = this;
    if (me.onlyOneUser) {
      return false;
    }

    return this._canEditSettings();
  }

  private canModifyResources(): boolean {
    return this._canEditSettings();
  }

  private _canEditSettings(): boolean {
    let me = this, len = (me.models || []).length;

    if (len < 1) {
      return false;
    }

    return me.models.findIndex((item) => {
      return !me.canEdit(item);
    }) === -1;
  }

  private canEdit(item: AccessUserModel) {
    let builtInAdmin = item && item.isBuiltInAdminAccount(),
      hasLink = item && item.hasLink('edit');
    // Edit is limited to account name change with the following limitation:
    // No admin can edit himself.  Account name change is not allowed.
    if (builtInAdmin) {
      return false;
    } else {
      return hasLink;
    }
  }


  private canDeleteUser(): boolean {
    let me = this, len = (me.models || []).length;
    if (len < 1)
      return false;

    return me.models.findIndex(function (item) {
      return !me.canDelete(item);
    }) === -1;
  }

  private sameRoleNames(rns1: String[], rns2: String[]): boolean {
    let len1 = (rns1 || []).length, len2 = (rns2 || []).length,
      empty1 = len1 === 0, empty2 = len2 === 0;

    if (empty1 && empty1 === empty2)
      return true;

    if (len1 !== len2)
      return false;

    return rns1.findIndex(function (rn1) {
      return rns2.findIndex(function (rn2) {
        return rn2.valueOf() === rn1.valueOf();
      }) === -1;
    }) === -1;
  }
}
