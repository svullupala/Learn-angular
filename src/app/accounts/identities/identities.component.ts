import {Component, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {SessionService} from 'core';
import {SharedService} from 'shared/shared.service';

import {ErrorHandlerComponent, AlertComponent, AlertType} from 'shared/components/index';
import {IdentityModel} from './identity.model';
import {IdentitiesTableComponent} from './identitiesTable/identitiesTable.component';
import {IdentitiesService} from './identities.service';
import {IdentitiesEditComponent} from './identitiesEdit/identitiesEdit.component';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'identities',
  templateUrl: './identities.component.html',
})
export class IdentitiesComponent extends RefreshSameUrl {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  canCreate: boolean = false;

  @ViewChild(IdentitiesTableComponent) identitiesTable: IdentitiesTableComponent;
  @ViewChild(IdentitiesEditComponent) identitiesEdit: IdentitiesEditComponent;

  private mode: string = 'list';
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private identitiesService: IdentitiesService, private translate: TranslateService) {
    super(globalState, route);
  }

  protected onRefreshSameUrl(): void {
    this.onCancelClick();
  }

  ngOnInit() {
    let me = this;

    super.ngOnInit();

    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['common.textConfirmDelete'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  loadData(resetPage: boolean = true) {
    let me = this;
    me.mode = 'list';
    if (me.identitiesTable)
      me.identitiesTable.loadData();
  }

  mask() {
    let me = this;
    if (me.alert) {
      me.alert.show('', me.processingRequestMsg, AlertType.MASK);
    }
  }

  unmask() {
    let me = this;
    if (me.alert)
      me.alert.hide();
  }

  confirm(item: IdentityModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmDelete, item.name),
        AlertType.CONFIRMATION, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onAddClick() {
    this.mode = 'edit';
  }

  onCancelClick() {
    this.mode = 'list';
  }

  onEditClick(item: IdentityModel) {
    let me = this;
    me.mode = 'edit';
    if (me.identitiesEdit)
      me.identitiesEdit.startEdit(item);
  }

  onDeleteClick(item: IdentityModel) {
    let me = this;

    me.confirm(item, function () {
      me.mask();
      me.identitiesService.delete(item)
        .subscribe(
          () => {
            me.unmask();
            me.loadData();
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
    });
  }

  onIdentitiesLoad(canCreate: boolean): void {
    this.canCreate = canCreate;
  }
}
