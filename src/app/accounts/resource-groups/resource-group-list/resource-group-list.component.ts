import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {ResourceGroupModel} from '../resource-group.model';
import {RestService} from 'core';
import { ResourceGroupsService } from '../resource-groups.service';
import { ResourceGroupSelectionModel } from '../shared/resource-group-selection.model';
import { Subject } from 'rxjs/Subject';
import * as _ from 'lodash';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'resource-group-list',
  templateUrl: './resource-group-list.component.html',
  styleUrls: ['./resource-group-list.component.scss']
})

export class ResourceGroupListComponent implements OnInit, OnDestroy {
  @Input() hideBorder: boolean = false;
  @Input() hideDelete: boolean = false;
  @Input() enableUpdateSubcriptions: boolean = true;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();
  private subs: Subject<void> = new Subject<void>();
  private borderClass: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private models: Array<ResourceGroupSelectionModel> = [];

  private masked: boolean = false;

  constructor(private rest: RestService,
              private resourceGroupsService: ResourceGroupsService,
              private translate: TranslateService) {
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

    me.models = me.models || [];
    if (me.hideBorder) {
      me.borderClass = 'no-border';
    }
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'resourceGroups.textCreationSuccessful',
      'resourceGroups.textEditSuccessful',
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['resourceGroups.textCreationSuccessful'];
        me.textEditSucceed = resource['resourceGroups.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    if (me.enableUpdateSubcriptions) {
      me.resourceGroupsService.addAllResourceSub.takeUntil(me.subs).subscribe(
        (model: ResourceGroupSelectionModel) => {
          this.models = this.getArrayWithAllResourceContainer(model, this.models);
          if (!this.hasResource(model)) {
            this.models.push(model);
          }
        }
      );
      me.resourceGroupsService.updateResourcesSub.takeUntil(me.subs).subscribe(
        (model: ResourceGroupSelectionModel) => {
          this.models = this.getArrayWithSelectedResources(model, this.models);
          if (!this.hasResource(model)) {
            this.models.push(model);
          }
        }
      );
    }
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.resetModel()
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public getList(): Array<ResourceGroupSelectionModel> {
    return this.models;
  }

  public resetModel(): void {
    this.models = [];
  }

  public setMultiResources(resourceGroups: Array<ResourceGroupModel>): void {
    this.models = this.setMultiResourcesArr(resourceGroups);
  }

  public setResources(resourceGroups: ResourceGroupModel): void {
    this.models = this.setResourcesArr(resourceGroups);
  }

  private deleteAllClick(): void {
    this.resetModel();
  }

  private getArrayWithSelectedResources(model: ResourceGroupSelectionModel,
                                 resources?: Array<ResourceGroupSelectionModel>): Array<ResourceGroupSelectionModel> {
    let hasModelResourcePath = !!(model && model.resource && model.resource.rbacPath),
      type: string = hasModelResourcePath ? (model.resource.rbacPath.split('/')[1].split(':')[0] || '') : '',
      rootPath: string = SharedService.formatString('root:0/{0}:0', type),
      rootPathAll: string = SharedService.formatString('root:0/{0}.all:0/', type),
      oldArr: Array<ResourceGroupSelectionModel> = resources || Array.from(this.models) || [],
      containerArr: Array<ResourceGroupSelectionModel> = [],
      newArr: Array<ResourceGroupSelectionModel> = [];
    if (oldArr.length > 0) {
      for (let i = 0; i < this.models.length; i++) {
        if ((oldArr[i].resource.rbacPath === rootPath)
          || (oldArr[i].resource.rbacPath === rootPathAll)
          || (oldArr[i].resource.rbacPath === ResourceGroupsService.ALL_VADPS_RBAC_PATH)) {
          containerArr.push(oldArr[i]);
        } else if (!hasModelResourcePath || !(
          oldArr[i].resource.rbacPath.indexOf(model.resource.rbacPath + '/') === 0 ||
          model.resource.rbacPath.indexOf(oldArr[i].resource.rbacPath + '/') === 0)) {
          newArr.push(oldArr[i]);
        }
      }
    }
    return newArr;
  }

  private getAppTypeNSubType(model: ResourceGroupSelectionModel): { appType: string, subType: string } {
    let result: { appType: string, subType: string },
      paths: string[] = model && model.resource.rbacPath ? model.resource.rbacPath.split('/') : [],
      appType = paths && paths.length > 2 ? paths[2].split(':')[1] || '' : '',
      subType = appType === 'sql' && paths.length > 3 ? paths[3].split(':')[0] || '' : '';
    return {appType: appType, subType: subType};
  }

  private getSqlSubtypeRbacPath(subType: string): string {
    return 'root:0/app:0/app.type:sql/' + subType;
  }

  private getArrayWithAllResourceContainer(model: ResourceGroupSelectionModel,
                                 resources?: Array<ResourceGroupSelectionModel>): Array<ResourceGroupSelectionModel> {
    // guaranteed to get type of resource
    let type: string = model && model.resource.rbacPath && model.resource.rbacPath.split('/')[1].split(':')[0] || '',
      appTypeNSubType: { appType: string, subType: string },
        oldArr: Array<ResourceGroupSelectionModel> = resources || Array.from(this.models) || [],
        newArr: Array<ResourceGroupSelectionModel> = [];

    appTypeNSubType = this.getAppTypeNSubType(model);
    if (appTypeNSubType.appType === 'sql') {
      type = this.getSqlSubtypeRbacPath(appTypeNSubType.subType);
    }

    if (oldArr.length > 0) {
      for (let i = 0; i < this.models.length; i++) {
        if (oldArr[i].resource.rbacPath.indexOf(type) === -1 ||
          model && model.resource.rbacPath && !(
            oldArr[i].resource.rbacPath.indexOf(model.resource.rbacPath) === 0 ||
            model.resource.rbacPath.indexOf(oldArr[i].resource.rbacPath) === 0)) {
          newArr.push(oldArr[i]);
        }
      }
    }
    return newArr;
  }

  private setMultiResourcesArr(resourceGroups: Array<ResourceGroupModel>): Array<ResourceGroupSelectionModel> {
    let me = this, resources: Array<ResourceGroupSelectionModel> = [],
        returnValue: Array<ResourceGroupSelectionModel> = [];
    if (resourceGroups && resourceGroups.length > 0) {
      resources = _.flatMap(resourceGroups,
          (item: ResourceGroupModel) => {
                  return me.setResourcesArr(item);
                });
      resources.forEach((item: ResourceGroupSelectionModel, idx: number) => {
          if (!me.hasResource(item, returnValue)) {
            returnValue.push(item);
          }
        });
      returnValue = _.sortBy(returnValue,
        (item: ResourceGroupSelectionModel) => {
                  if (item.path) {
                    return item.path;
                  }
                  return item.title;
                });
    }
    return returnValue;
  }

  private onDeleteResource(item: any, idx: number): void {
    this.models.splice(idx, 1);
  }

  private hasResource(item: ResourceGroupSelectionModel, resources?: Array<ResourceGroupSelectionModel>): boolean {
    return (resources || this.models || []).findIndex(function (record: ResourceGroupSelectionModel) {
      return ((record.resource.rbacPath === item.resource.rbacPath));
    }) !== -1;
  }

  private setResourcesArr(resourceGroup: ResourceGroupModel): Array<ResourceGroupSelectionModel> {
    let resourceArr: Array<any> = (resourceGroup && resourceGroup.resources) || [],
        items: Array<ResourceGroupSelectionModel> = [];
    if (resourceArr.length > 0) {
      resourceArr.forEach((resource) => {
        let selection: ResourceGroupSelectionModel,
            metadata: object = resource['metadata'],
            newResource: ResourceGroupModel,
            crumbs: Array<BreadcrumbModel>,
            rbacPath: string = resource && resource['path'];
        if (!_.isEmpty(metadata)) {
          newResource = new ResourceGroupModel();
          newResource.id = metadata['id'] || '';
          newResource.rbacPath = rbacPath;
          crumbs = this.setBreadCrumbs(metadata['path']);
          selection = new ResourceGroupSelectionModel(metadata['typeTitle'] || newResource.name, newResource, crumbs);
          selection.path = metadata['path'];
        } else {
          newResource = new ResourceGroupModel();
          newResource.rbacPath = rbacPath;
          crumbs = [new BreadcrumbModel((resourceGroup.name || ''), '')];
          selection = new ResourceGroupSelectionModel(resourceGroup.name, newResource, crumbs);
        }
        items.push(selection);
      });
    }
    return items;
  }

  private setBreadCrumbs(path: string): Array<BreadcrumbModel> {
      // For special case, SQL - Standalone/Failover Cluster, hard coded
    if (path && path.indexOf('Standalone/Failover') || path.indexOf('standalone/failover')) {
      path = path.replace('Standalone/Failover', 'Standalone or Failover');
      path = path.replace('standalone/failover', 'standalone or failover');
    }

    let pathArr: Array<string> = (path && path.split('/')) || [],
        crumbs: Array<BreadcrumbModel> = [];

    if (pathArr.length > 0) {
      pathArr.forEach((pathName: string) => {
        if (pathName.indexOf('Standalone or Failover') || pathName.indexOf('standalone or failover')) {
          pathName = pathName.replace('Standalone or Failover', 'Standalone/Failover');
          pathName = pathName.replace('standalone or failover', 'standalone/failover');
        }
        let splitArr: Array<string> = (pathName && pathName.split(':')) || [];
        crumbs.push(new BreadcrumbModel((splitArr[0] || ''), ''));
      });
    }
    return crumbs;
  }

  private ellipsisPath(name: string): string {
    return SharedService.ellipsisPath(name, 50);
  }
}
