import {Component, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SessionService} from 'core';
import {SharedService} from 'shared/shared.service';
import {ErrorHandlerComponent, AlertComponent, AlertType} from 'shared/components/index';
import {KeyModel} from './key.model';
import {KeysEditComponent} from './keysEdit/keysEdit.component';
import {KeysTableComponent} from './keysTable/keysTable.component';
import {AccessKeysService} from './access-keys.service';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'access-keys',
  templateUrl: './access-keys.component.html',
})
export class AccessKeysComponent extends RefreshSameUrl {

  mode: string = 'list';
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  @ViewChild(KeysTableComponent) keysTable: KeysTableComponent;
  @ViewChild(KeysEditComponent) keysEdit: KeysEditComponent;

  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private accessKeysService: AccessKeysService, private translate: TranslateService) {
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
    if (me.keysTable)
      me.keysTable.loadData();
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

  confirm(item: KeyModel, handler: Function) {
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

  onEditClick(item: KeyModel) {
    let me = this;
    if (me.keysEdit)
      me.mode = 'edit';
      me.keysEdit.startEdit(item);
  }

  onDeleteClick(item: KeyModel) {
    let me = this;

    this.keysEdit.collapseRegistrationForm(true);

    me.confirm(item, function () {
      me.mask();
      me.accessKeysService.delete(item)
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

  onAddClick() {
    this.mode = 'edit';
  }

  onCancelClick() {
    this.mode = 'list';
  }
}
