import {Component, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SlapolicyModel} from './shared/slapolicy.model';
import {SessionService} from 'core';
import {PolicyTableComponent} from './shared/policyTable/policyTable.component';
import {SharedService} from 'shared/shared.service';
import {SlapolicyService} from './shared/slapolicy.service';
import {PolicyEditComponent} from './policyEdit/policyedit.component';
import {Observable} from 'rxjs/Observable';
import {RbacSingleSelectionView} from '../../shared/rbac/rbac-single-selection.view';
import {RbacModel} from '../shared/rbac/rbac.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler';
import {AlertComponent, AlertType} from 'shared/components/msgbox';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'slapolicy',
  styleUrls: ['./slapolicy.scss'],
  templateUrl: './slapolicy.component.html'
})
export class SlapolicyComponent extends RefreshSameUrl {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  canCreate: boolean = false;

  @ViewChild(PolicyTableComponent) policyTable: PolicyTableComponent;
  @ViewChild(PolicyEditComponent) policyEdit: PolicyEditComponent;

  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private infoTitle: string;
  private mode: string = 'list';

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private policyService: SlapolicyService, private translate: TranslateService) {
    super(globalState, route);
  }

  protected onRefreshSameUrl(): void {
    this.onCancelClick();
  }

  ngOnInit() {
    let me = this;

    super.ngOnInit();

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'slapolicy.textConfirmDelete'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['slapolicy.textConfirmDelete'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  info(message: string, title?: string, type?: AlertType) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message, type);
  }

  confirm(item: SlapolicyModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmDelete, item.name),
        AlertType.DANGEROK, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onEditClick(item: SlapolicyModel) {
    let me = this;

    if (me.policyEdit) {
      me.policyEdit.startEdit(item);
      me.mode = 'operate';
    }
  }

  loadData(resetPage: boolean = true) {
    let me = this;
    if (me.policyTable)
      me.policyTable.loadData();
  }

  onDeleteClick(item: SlapolicyModel) {
    let me = this;

    me.confirm(item, function () {
      me.policyService.delete(item)
        .subscribe(
          () => {
            me.loadData();
          },
          err => {
            me.handleError(err, true);
          }
        );
    });
  }

  onCreateClick() {
    this.mode = 'operate';
  }

  onSaveSuccess() {
    this.mode = 'list';
  }

  onCancelClick() {
    this.mode = 'list';
  }

  onPoliciesLoad(canCreate: boolean): void {
    this.canCreate = canCreate;
  }

  private delay(callback: any, interval: number) {
    let sub: any = Observable.interval(interval).take(1).subscribe(
      () => {
        callback();
        sub.unsubscribe();
      }
    );
  }
}
