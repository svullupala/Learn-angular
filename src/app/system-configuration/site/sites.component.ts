import {Component, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SessionService } from 'core';
import { SharedService } from 'shared/shared.service';

import { ErrorHandlerComponent, AlertComponent, AlertType } from 'shared/components/index';
import { SiteModel } from './site.model';
import { SitesTableComponent } from './sitesTable/sitesTable.component';
import { SiteService } from './site.service';
import { SiteEditComponent } from './siteEdit/siteEdit.component';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';

@Component({
  selector: 'sites',
  templateUrl: './sites.component.html',
})
export class SitesComponent extends RefreshSameUrl {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  @ViewChild(SitesTableComponent) sitesTable: SitesTableComponent;
  @ViewChild(SiteEditComponent) siteEdit: SiteEditComponent;

  private mode: string = 'list';
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private siteService: SiteService, private translate: TranslateService) {
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
    if (me.sitesTable)
      me.sitesTable.loadData();
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

  confirm(item: SiteModel, handler: Function) {
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

  onEditClick(item: SiteModel) {
    let me = this;
    if (me.siteEdit)
      me.mode = 'edit';
    me.siteEdit.startEdit(item);
  }

  onAddClick() {
    this.mode = 'edit';
  }

  onCancelClick() {
    this.mode = 'list';
  }

  onDeleteClick(item: SiteModel) {
    let me = this;

    me.confirm(item, function () {
      me.mask();
      me.siteService.delete(item)
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
}
