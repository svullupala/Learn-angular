import {AfterViewInit, Component, ViewChild } from '@angular/core';
import 'rxjs/add/operator/delay';
import {TranslateService} from '@ngx-translate/core';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {RoleTableComponent} from './role-table/role-table.component';
import {FilterModel} from 'shared/models/filter.model';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {AccessRoleModel} from './role.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {LinkModel} from 'shared/models/link.model';
import {SharedService} from 'shared/shared.service';
import {RoleDetailsComponent} from './role-details/role-details.component';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'access-roles',
  styleUrls: ['./roles.scss'],
  templateUrl: './roles.component.html'
})
export class RolesComponent extends RefreshSameUrl implements AfterViewInit {

  mode: string = 'list';
  role: AccessRoleModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  createLink: LinkModel;
  canCreate: boolean = false;

  @ViewChild(RoleTableComponent) selectTable: RoleTableComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(RoleDetailsComponent) details: RoleDetailsComponent;
  private namePattern: string = '';
  private hideSearchOutput: boolean = false;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textSearchFor: string;

  get selectedRoles(): Array<AccessRoleModel> {
    let me = this, roles = me.selectTable ? me.selectTable.selectedItems : [];
    return roles.sort(function (a, b) {
        return a.name > b.name ? 1 : (a.name === b.name ? 0 : -1);
    });
  }

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService) {
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
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete',
      'roles.textSearchFor'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textSearchFor = resource['roles.textSearchFor'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.startSearch();
  }

  ngAfterViewInit() {
    this.searchBarComponent.focusSearchField();
  }

  info(message: string, title?: string, type?: AlertType) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message, type);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private onCreateClick() {
    this.mode = 'edit';
    this.role = null;
  }

  private onCancelClick() {
    this.mode = 'list';
    this.refresh();
  }

  private onSaveSuccess() {
    this.mode = 'list';
    this.refresh();
  }

  private getSearchFilters(): FilterModel[] {
    let me = this, result: FilterModel[] = [];

    if (me.namePattern && me.namePattern.trim().length > 0)
      result.push(new FilterModel('name', me.namePattern.trim()));

    return result;
  }

  private onEditClick(item: AccessRoleModel) {
    let me = this, observable = item.getRecord<AccessRoleModel>(AccessRoleModel, 'self');
    if (observable)
      observable.subscribe(
        record => {
          me.onRoleLoad(record);
        },
        err => {
          me.handleError(err, false);
        }
      );
  }

  private onTableRefresh() {
    this.selectTable.onRefresh();
  }

  private onRoleLoad(item: AccessRoleModel): void {
    this.mode = 'edit';
    this.role = item;
  }

  private onRolesLoad(roles: DatasetModel<AccessRoleModel>): void {
    this.createLink = roles.getLink('create');
    this.canCreate = this.createLink !== undefined;
  }

  private onSelectionChange(): void {
    if (this.selectTable && this.details)
      this.details.remapPermissionRole(this.selectTable.selectedItems);
  }

  private refresh(): void {
    this.startSearch();
  }

  private startSearch(namePattern?: string): void {
    let me = this;
    if (!me.selectTable)
      return;
    me.namePattern = namePattern;
    me.selectTable.loadData(false, me.getSearchFilters());
    me.hideSearchOutput = false;
  }
}

