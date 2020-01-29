import {Component, Input, ViewChild, EventEmitter, Output, Renderer2, NgZone} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {RestService} from 'core';
import {SharedService} from 'shared/shared.service';
import {AccessRoleModel} from '../role.model';
import {PermissionRoleComponent} from '../../permission-groups/permission-role/permission-role.component';
import { Observable } from 'rxjs/Observable';
import { AlertType } from 'shared/components';
import { Subject } from 'rxjs/Subject';
import {FocusMonitor} from '@angular/cdk/a11y';
import {KeyboardPopover} from 'shared/util/keyboard-popover';

@Component({
  selector: 'role-details',
  templateUrl: './role-details.component.html',
  styleUrls: ['./role-details.component.scss']
})
export class RoleDetailsComponent extends KeyboardPopover {

  @Input() models: Array<AccessRoleModel> = [];
  @Output() refreshEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<AccessRoleModel>();

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  @ViewChild(PermissionRoleComponent) permissionRoleComponent: PermissionRoleComponent;

  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private textSelectedRolesTitleTpl: string;

  private masked: boolean = false;

  get hasRoles(): boolean {
    return this.models && this.models.length > 0;
  }

  get hasMore(): boolean {
    return false;
  }

  get onlyOneRole(): boolean {
    return this.models && this.models.length === 1;
  }

  get isCanned(): boolean {
    if (this.models && this.models.length === 1) {
      return this.models[0].canned;
    }
    return true;
  }

  get canModify(): boolean {
    if (this.models && this.models.length === 1) {
      return this.models[0].isDeleteAllowed() || this.models[0].isUpdateAllowed();
    }
    return false;
  }

  get title(): string {
    return this.hasRoles ? (this.models.length > 1 ? SharedService.formatString(this.textSelectedRolesTitleTpl,
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

  confirm(item: AccessRoleModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmDelete, item.name),
        AlertType.CONFIRMATION, handler);
  }

  ngOnInit(): void {
    let me = this;
    super.ngOnInit();

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'roles.textConfirmDelete',
      'roles.textSelectedRolesTitleTpl'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textSelectedRolesTitleTpl = resource['roles.textSelectedRolesTitleTpl'];
        me.textConfirmDelete = resource['roles.textConfirmDelete'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  remapPermissionRole(roles: Array<AccessRoleModel>): void {
    if (this.permissionRoleComponent)
      this.permissionRoleComponent.remap(roles);
  }

  private onModifyRoleClick(): void {
    this.editClick.emit(this.models[0]);
  }

  private onDeleteRoleClick(): void {
    let me = this,
        item: AccessRoleModel = this.models[0],
        observable: Observable<boolean>;
    me.confirm(item, function () {
      me.mask();
      observable = item.remove(me.rest);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me.unmask();
            me.refreshEvent.emit();
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
