import {AfterViewInit, Component, ViewChild } from '@angular/core';
import 'rxjs/add/operator/delay';
import {TranslateService} from '@ngx-translate/core';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {UserTableComponent} from './user-table/user-table.component';
import {FilterModel} from 'shared/models/filter.model';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {AccessUserModel} from './user.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {LinkModel} from 'shared/models/link.model';
import {SharedService} from 'shared/shared.service';
import {Observable} from 'rxjs/Observable';
import {UserDetailsComponent} from './user-details/user-details.component';
import {ErrorModel} from 'shared/models/error.model';
import {BaseModel} from 'shared/models/base.model';
import {Mode} from './user-edit-setting/user-edit-setting.component';
import {PreferenceService} from 'shared/preference.service';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

type ErrorItem = {name: string, error: ErrorModel};

@Component({
  selector: 'access-users',
  styleUrls: ['./users.scss'],
  templateUrl: './users.component.html'
})
export class UsersComponent extends RefreshSameUrl implements AfterViewInit {

  mode: string = 'list';
  changePasswordMode: boolean = false;
  settingsMode: Mode = Mode.settings;
  users: AccessUserModel[];

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  createLink: LinkModel;
  canCreate: boolean = false;

  @ViewChild(UserTableComponent) selectTable: UserTableComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(UserDetailsComponent) details: UserDetailsComponent;
  private namePattern: string = '';
  private hideSearchOutput: boolean = false;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirmDeleteTitle: string;
  private textSearchFor: string;
  private textConfirmDeleteMsgTpl: string;
  private textConfirmDeleteMultiMsgTpl: string;
  private textDeleteMultiUsersErrorTpl: string;
  private textUnknownError: string;
  private masked: boolean = false;
  private minPasswordLength: number;

  get selectedUsers(): Array<AccessUserModel> {
    let me = this, users = me.selectTable ? me.selectTable.selectedItems : [];
    return users.sort(function (a, b) {
      let hasRoleA = (a.roleNames && a.roleNames.length > 0),
        hasRoleB = (b.roleNames && b.roleNames.length > 0),
        firstRoleA = hasRoleA ? a.roleNames[0] : '',
        firstRoleB = hasRoleB ? b.roleNames[0] : '';

      if (hasRoleA && hasRoleB) {
        if (firstRoleA === firstRoleB)
          return a.name > b.name ? 1 : (a.name === b.name ? 0 : -1);
        else
          return firstRoleA > firstRoleB ? 1 : -1;
      } else if (hasRoleA) {
        return 1;
      } else if (hasRoleB) {
        return -1;
      } else {
        return a.name > b.name ? 1 : (a.name === b.name ? 0 : -1);
      }
    });
  }

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService, private preference: PreferenceService) {
    super(globalState, route);
  }

  protected onRefreshSameUrl(): void {
    this.onCancelClick();
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  confirm(items: AccessUserModel[], handler: Function) {
    let me = this, names = '', multi = items && items.length > 1,
      tpl = multi ? me.textConfirmDeleteMultiMsgTpl : me.textConfirmDeleteMsgTpl;
    if (me.alert) {
      (items || []).forEach(function (user, idx) {
        if (idx > 0)
          names += ', ';
        names += user.name;
      });
      me.alert.show(me.textConfirmDeleteTitle, SharedService.formatString(tpl, names),
        AlertType.CONFIRMATION, handler);
    }
  }

  ngOnInit() {
    let me = this;

    super.ngOnInit();

    me.translate.get([
      'common.infoTitle',
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textUnknownError',
      'users.textConfirmDeleteTitle',
      'users.textConfirmDeleteMsgTpl',
      'users.textConfirmDeleteMultiMsgTpl',
      'users.textDeleteMultiUsersErrorTpl',
      'users.textSearchFor'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textUnknownError = resource['common.textUnknownError'];
        me.textConfirmDeleteTitle = resource['users.textConfirmDeleteTitle'];
        me.textConfirmDeleteMsgTpl = resource['users.textConfirmDeleteMsgTpl'];
        me.textConfirmDeleteMultiMsgTpl = resource['users.textConfirmDeleteMultiMsgTpl'];
        me.textDeleteMultiUsersErrorTpl = resource['users.textDeleteMultiUsersErrorTpl'];
        me.textSearchFor = resource['users.textSearchFor'];
      });

    me.preference.getMinPasswordLength().subscribe((data) => {
      this.minPasswordLength = data;
    },
    (err) => {
      console.warn('Unable to get minimum password length preference');
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

  handleError(err: any, node?: boolean, silence?: boolean): ErrorModel {
    let me = this, error: ErrorModel;
    if (me.errorHandler)
      error = me.errorHandler.handle(err, node, silence);
    return error;
  }

  private onCreateClick() {
    this.users = undefined;
    this.mode = 'editSettings';
    this.settingsMode = Mode.settings;
  }

  private onCancelClick() {
    this.mode = 'list';
  }

  private onSaveSuccess() {
    this.mode = 'list';
    this.refresh();
  }

  private onSaveDone() {
    this.mode = 'list';
    this.refresh();
  }

  private getSearchFilters(): FilterModel[] {
    let me = this, result: FilterModel[] = [];

    if (me.namePattern && me.namePattern.trim().length > 0)
      result.push(new FilterModel('name', me.namePattern.trim()));

    return result;
  }

  private onChangePasswordClick(item: AccessUserModel) {
    let me = this, observable = item.getRecord<AccessUserModel>(AccessUserModel, 'self');
    if (observable)
      observable.subscribe(
        record => {
          this.mode = 'editSettings';
          this.settingsMode = Mode.password;
          this.users = [item];
        },
        err => {
          me.handleError(err, false);
        }
      );
  }

  private onModifySettingsClick(items: AccessUserModel[]) {
    this.mode = 'editSettings';
    this.settingsMode = Mode.settings;
    this.users = items;
  }

  private onModifyRolesClick(items: AccessUserModel[]) {
    this.mode = 'editSettings';
    this.settingsMode = Mode.role;
    this.users = items;
  }

  private onModifyResourcesClick(items: AccessUserModel[]) {
    this.mode = 'editResources';
    this.users = items;
  }

  private onDeleteClick(items: AccessUserModel[]) {
    let me = this, total = items ? items.length : 0;
    if (total > 0) {
      me.confirm(items, function () {
        setTimeout(() => {
          me.bulkDelete(items);
        }, 100);
      });
    }
  }

  private onUsersLoad(users: DatasetModel<AccessUserModel>): void {
    this.createLink = users.getLink('create');
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

  private bulkDelete(items: AccessUserModel[]): void {
    let me = this, observable: Observable<boolean>, count = 0, total = items.length,
      errors: ErrorItem[] = [];
    me.mask();
    items.forEach(function (item, idx) {
      observable = item.remove();
      if (observable) {
        observable.subscribe(
          record => {
            count++;
            if (count === total) {
              me.unmask();
              me.refresh();
              me.showDeleteResult(errors);
            }
          },
          err => {
            let error;
            count++;
            errors = me.handleDeleteError(item, err, errors);
            if (count === total) {
              me.unmask();
              me.showDeleteResult(errors);
            }
          }
        );
      } else {
        count++;
        // Push unknown error just in case.
        errors.push({name: item.name, error: new ErrorModel('', me.textUnknownError)});
        if (count === total) {
          me.unmask();
          me.showDeleteResult(errors);
        }
      }
    });
  }

  private handleDeleteError(model: BaseModel, err: any, items: ErrorItem[]): ErrorItem[] {
    let me = this, error: ErrorModel;
    error = me.handleError(err, false, true);
    if (error)
      items.push({name: model.name, error: error});
    return items;
  }

  private showDeleteResult(items: ErrorItem[]): void {
    let me = this, msg, names = '', details = '', hasError = items && items.length > 0;
    if (hasError) {
      items.forEach(function (item, idx) {
        if (idx > 0) {
          names += ', ';
          details += '\n';
        }
        names += item.name;
        details += SharedService.formatString('{0}. {1} - {2}', idx + 1, item.name, item.error.message);
      });
      msg = SharedService.formatString(me.textDeleteMultiUsersErrorTpl, names, details);
      me.handleError(new ErrorModel(me.textConfirmDeleteTitle, msg), false, false);
    }
  }
}

