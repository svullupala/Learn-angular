import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { SorterModel } from 'shared/models/sorter.model';
import { Observable } from 'rxjs/Observable';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { FilterModel } from 'shared/models/filter.model';
import { TranslateService } from '@ngx-translate/core';
import { AccessRolesModel } from '../../../roles/roles.model';
import { AccessRoleModel } from '../../../roles/role.model';
import { AccessUserModel } from '../../../users/user.model';
import { AccessUsersModel } from '../../../users/users.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import { IdentityUsersModel } from 'identity/shared/identity-users.model';
import { IdentityUserModel } from 'identity/shared/identity-user.model';

@Component({
  selector: 'resource-group-account-selector',
  templateUrl: './resource-group-account-selector.component.html',
  styleUrls: ['../../resource-groups.scss']
})

export class ResourceGroupAccountSelectorComponent implements OnInit, OnDestroy {
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private view: string = '';
  private dataset: DatasetModel<any>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<any> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private searchResultView: boolean = false;
  private resourceType: string = ResourceGroupsService.ACCOUNT_TYPE;
  private searchPlaceholderText: string;
  private accountType: string;
  private textRolesSearchFor: string;
  private textUsersSearchFor: string;
  private textUsers: string;
  private textRoles: string;
  private textIdentities: string;
  private textAll: string;
  private textAccounts: string;
  private addAllIdentityItem: ResourceGroupSelectionModel;
  private allRoles: ResourceGroupSelectionModel;
  private allUsers: ResourceGroupSelectionModel;
  private allAddItem: ResourceGroupSelectionModel;
  private ROLE_TYPE: string = ResourceGroupsService.ROLES_TYPE;
  private USER_TYPE: string = ResourceGroupsService.USERS_TYPE;
  private IDENTITY_TYPE: string = ResourceGroupsService.IDENTITY_TYPE;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-access-table-pagination-${(new Date()).valueOf()}`;
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  ngOnInit(): void {
    let me = this;
    me.breadcrumbs = [];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.translate.get([
      'roles.textSearchFor',
      'resourceGroups.textAccounts',
      'resourceGroups.textAll',
      'resourceGroups.textUsers',
      'resourceGroups.textRoles',
      'identities.identitiesTitle',
      'users.textSearchFor']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textRolesSearchFor = resource['roles.textSearchFor'];
        me.textUsersSearchFor = resource['users.textSearchFor'];
        me.textRoles = resource['resourceGroups.textRoles'];
        me.textUsers = resource['resourceGroups.textUsers'];
        me.textAll = resource['resourceGroups.textAll'];
        me.textAccounts = resource['resourceGroups.textAccounts'];
        me.textIdentities = resource['identities.identitiesTitle'];
        me.allRoles = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_ROLE_RBAC_PATH, me.textAll,
          [me.textAccounts, me.textRoles]);
        me.allUsers = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_ACCOUNT_RBAC_PATH, me.textAll,
          [me.textAccounts, me.textUsers]);
        me.addAllIdentityItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_IDENTITIES_RBAC_PATH,
          me.textAll, [resource['resourceGroups.textAccounts'], me.textIdentities]);
      });
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private loadData(filters?: Array<FilterModel>, pageStartIndex?: number): void {
    let me = this,
        crumb: BreadcrumbModel,
        title: string,
        observable: Observable<AccessRolesModel | AccessUsersModel | IdentityUsersModel>;

    if (me.accountType === me.ROLE_TYPE) {
      observable = AccessRolesModel.retrieve<AccessRoleModel, AccessRolesModel>(AccessRolesModel, me.rest,
        filters, me.sorters, pageStartIndex || 0, RestService.pageSize);
      me.searchPlaceholderText = me.textRolesSearchFor;
      title = me.textRoles;
      me.allAddItem = me.allRoles;
    } else if (me.accountType === me.USER_TYPE) {
      observable = AccessUsersModel.retrieve<AccessUserModel, AccessUsersModel>(AccessUsersModel, me.rest,
          filters, me.sorters, pageStartIndex || 0, RestService.pageSize);
      me.searchPlaceholderText = me.textUsersSearchFor;
      title = me.textUsers;
      me.allAddItem = me.allUsers;
    } else if (me.accountType === me.IDENTITY_TYPE) {
      observable = IdentityUsersModel.retrieve<IdentityUserModel, IdentityUsersModel>(IdentityUsersModel, me.rest,
        undefined, me.sorters, pageStartIndex || 0, RestService.pageSize);
      // this.crumbTitle = this.stringsArr['identities.identitiesTitle'];
      title = me.textIdentities;
      me.allAddItem = me.addAllIdentityItem;
    }

    if (observable) {
      me.mask();
      observable.takeUntil(me.subs).subscribe(
        dataset => {
            let total: number = 0;
            me.dataset = dataset;
            me.records = me.dataset.records;
            total = (me.dataset.total < 1 && me.records.length > 0)
              ? me.records.length
              : me.dataset.total;
            me.paginateConfig.refresh(total);
            crumb = new BreadcrumbModel(title, me.dataset.url);
            me.breadcrumbs = me.resourceGroupsService.resetBreadcrumbs(me.breadcrumbs, crumb);
          },
        err => {
          me.handleError(err);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private onSearch(namePattern: string): void {
    let me = this, observable: Observable<AccessRolesModel | AccessUsersModel>,
        filters: Array<FilterModel> = me.getSearchFilters(namePattern);
    me.loadData(filters);
    me.searchResultView = true;
  }

  private getSearchFilters(namePattern: string): FilterModel[] {
    let me = this, result: FilterModel[] = [];

    if (namePattern && namePattern.trim().length > 0)
      result.push(new FilterModel('name', namePattern.trim()));

    return result;
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.records = [];
    this.accountType = undefined;
    this.dataset = undefined;
    this.searchResultView = false;
  }
}
