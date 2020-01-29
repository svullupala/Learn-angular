import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ResourceGroupSelectionModel } from './shared/resource-group-selection.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { BaseModel } from 'shared/models/base.model';
import { ResourceGroupModel } from './resource-group.model';
import {RestService} from 'core';

@Injectable()
export class ResourceGroupsService {
  public static HYPERVISOR_TYPE: string = 'hypervisor';
  public static DATABASE_TYPE: string = 'database';
  public static CONTAINER_TYPE: string = 'container';
  public static STORAGE_TYPE: string = 'storage';
  public static SLAPOLICY_TYPE: string = 'slapolicy';
  public static REPORTS_TYPE: string = 'reports';
  public static ACCOUNT_TYPE: string = 'account';
  public static ROLES_TYPE: string = 'roles';
  public static USERS_TYPE: string = 'users';
  public static SCREENS_TYPE: string = 'screens';
  public static SYSTEM_TYPE: string = 'system';
  public static APP_SERVER_TYPE: string = 'appserver';
  public static SCRIPT_SERVER_TYPE: string = 'script';
  public static IDENTITY_TYPE: string = 'identity';
  public static LDAP_TYPE: string = 'ldap';
  public static SMTP_TYPE: string = 'smtp';
  public static LOG_TYPE: string = 'log';
  public static SCRIPTS_SERVER_APP_TYPE: string = 'scriptserver';
  public static SITE_TYPE: string = 'site';
  public static VADP_TYPE: string = 'vadp';
  public static JOB_TYPE: string = 'job';
  public static ALL_TYPE: string = 'all';
  // static rbac paths
  public static ALL_APP_SERVER_RBAC_PATH: string = 'root:0/appserver.all:0';
  public static ALL_APPLICATION_RBAC_PATH: string = 'root:0/app:0';
  public static ALL_SLA_RBAC_PATH: string = 'root:0/storageprofile:0';
  public static ALL_CERTIFICATE_RBAC_PATH: string = 'root:0/certificate:0';
  public static ALL_KEYS_RBAC_PATH: string = 'root:0/identity:0/identitytype:key';
  public static ALL_SCRIPTS_RBAC_PATH: string = 'root:0/script:0';
  public static ALL_REPORTS_RBAC_PATH: string = 'root:0/report:0';
  public static ALL_IDENTITIES_RBAC_PATH: string = 'root:0/identity:0'; // credentials
  public static ALL_SCREEN_RBAC_PATH: string = 'root:0/screen:0';
  public static ALL_SCRIPT_SERVERS_RBAC_PATH: string = 'root:0/scriptserver.all:0';
  public static ALL_ACCOUNT_RBAC_PATH: string = 'root:0/user:0';
  public static ALL_ROLE_RBAC_PATH: string = 'root:0/role:0';
  public static ALL_BACKUP_STORAGE_RBAC_PATH: string = 'root:0/site:0/site.all.storage:0'; // lets test this out
  public static ALL_HYPERVISOR_RBAC_PATH: string = 'root:0/hypervisor.all:0';
  public static ALL_VADPS_RBAC_PATH: string = 'root:0/proxy:0/proxy.type:vmdkbackup.vadpproxy';
  public static ALL_LDAP_RRAC_PATH: string = 'root:0/ldap:0';
  public static ALL_SMTP_RRAC_PATH: string = 'root:0/smtp:0';
  public static ALL_SITE_RRAC_PATH: string = 'root:0/site:0';
  public static ALL_CLOUD_RBAC_PATH: string = 'root:0/cloud:0';
  public static ALL_LOGS_RRAC_PATH: string = 'root:0/log.all:0';
  public static allJobRbacPath: string = 'root:0/policy:0';

  public updateResourcesSub: Subject<any> = new Subject<any>();
  public addAllResourceSub: Subject<ResourceGroupSelectionModel> = new Subject<ResourceGroupSelectionModel>();
  public loadDataSub: Subject<string> = new Subject<string>();
  public handleErrorSub: Subject<any> = new Subject<any>();
  public handleNodeErrorSub: Subject<any> = new Subject<any>();
  public setResourcesSub: Subject<ResourceGroupModel | any> = new Subject<ResourceGroupModel | any>();
  public resetSub: Subject<any> = new Subject<any>();
  public deleteItemSub: Subject<ResourceGroupModel > = new Subject<ResourceGroupModel>();
  public addResourceValidateSignalSub: Subject<boolean> = new Subject<boolean>();
  public updateResourceGroupClickedSub: Subject<any> = new Subject<any>();
  public addResourceCompletedSignalSub: Subject<any> = new Subject<any>();

  constructor(private rest: RestService) {}

  public updateResources(resourcesModel: ResourceGroupSelectionModel): void {
    this.updateResourcesSub.next(resourcesModel);
  }

  public addAllResource(resourcesModel: ResourceGroupSelectionModel): void {
    this.addAllResourceSub.next(resourcesModel);
  }

  public loadData(resourceType: string): void {
    this.loadDataSub.next(resourceType);
  }

  public handleError(err: any): void {
    this.handleErrorSub.next(err);
  }

  public handleNodeError(err: any): void {
    this.handleNodeErrorSub.next(err);
  }

  public reset(): void {
    this.resetSub.next();
  }

  public setResources(resourceGroup: ResourceGroupModel): void {
    this.setResourcesSub.next(resourceGroup);
  }

  public deleteResource(resourceGroup: ResourceGroupModel): void {
    this.deleteItemSub.next(resourceGroup);
  }

  // Check Add Resources validation
  public addResourceValidateSignal(signal: boolean): void {
    this.addResourceValidateSignalSub.next(signal);
  }

  // Add Resource completed
  public addResourceCompletedSignal(): void {
    this.addResourceCompletedSignalSub.next();
  }

  // When 'update Resource Group' button was clicked
  public updateResourceGroupClicked(): void {
    this.updateResourceGroupClickedSub.next();
  }

  /**
   * Resets breadcrumbs.
   *
   * @param root {BreadcrumbModel} optional root breadcrumb.
   */
  public resetBreadcrumbs(breadcrumbs: Array<BreadcrumbModel>,  root?: BreadcrumbModel): Array<BreadcrumbModel> {
    let me = this,
    crumbs: Array<BreadcrumbModel> = breadcrumbs || [];
    if (crumbs.length > 0)
      crumbs.splice(0);
    if (root)
      crumbs.push(root);
    return crumbs;
  }

  /**
   * Gets current breadcrumb.
   *
   * @returns {BreadcrumbModel | null}
   */
  public currentBreadcrumb(breadcrumbs: Array<BreadcrumbModel>): BreadcrumbModel | null {
    let me = this,
      crumbs: Array<BreadcrumbModel> = breadcrumbs || [];
    if (crumbs.length > 0)
      return crumbs[crumbs.length - 1];
    return null;
  }

  /**
   * Gets the first breadcrumb.
   *
   * @returns {BreadcrumbModel | null}
   */
  public firstBreadcrumb(breadcrumbs: Array<BreadcrumbModel>): BreadcrumbModel | null {
    let me = this,
        crumbs: Array<BreadcrumbModel> = breadcrumbs || [];
    if (crumbs.length > 0)
      return crumbs[0];
    return null;
  }

  public addBreadcrumb(breadcrumbs: Array<BreadcrumbModel>, item: BaseModel): Array<BreadcrumbModel> {
    let crumbs: Array<BreadcrumbModel> = breadcrumbs || [],
      index = crumbs.findIndex(function (crumb) {
      return crumb.url === item.url;
    });
    if (index === -1) {
      let crumb = new BreadcrumbModel(item.name, item.url, item);
      crumbs.push(crumb);
    } else {
      if (index < breadcrumbs.length - 1)
        crumbs.splice(index + 1);
    }
    return crumbs;
  }

  public createAllItem(rbacPath: string, name: string, stringArr: Array<string>): ResourceGroupSelectionModel {
    let model: ResourceGroupModel = new ResourceGroupModel(),
      breadCrumbs: Array<BreadcrumbModel> = [],
      item: ResourceGroupSelectionModel;

    model.name = name;
    model.rbacPath = rbacPath || '';
    model.id = ResourceGroupsService.ALL_TYPE;
    model.links = {self: {href: 'rbac/all', rel: 'related'}};

    if (stringArr && stringArr.length > 0) {
      for (let i = 0; i < stringArr.length; i++) {
        breadCrumbs.push(new BreadcrumbModel(stringArr[i], undefined));
      }
    }
    item = new ResourceGroupSelectionModel(name, model, (breadCrumbs || []));
    return item;
  }
}
