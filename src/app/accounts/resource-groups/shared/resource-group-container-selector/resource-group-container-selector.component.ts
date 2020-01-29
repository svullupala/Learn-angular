import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { SorterModel } from 'shared/models/sorter.model';
import { Observable } from 'rxjs/Observable';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { ApplicationService } from 'applications/shared/application.service';
import { BaseApplicationModel } from 'applications/shared/base-application-model.model';
import { FilterModel } from 'shared/models/filter.model';
import { InstancesModel } from 'applications/shared/instances.model';
import { TranslateService } from '@ngx-translate/core';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import { ResourceGroupModel } from '../../resource-group.model';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'resource-group-container-selector',
  templateUrl: './resource-group-container-selector.component.html',
  styleUrls: ['../../resource-groups.scss'],
  providers: [ApplicationService]
})

export class ResourceGroupContainerSelectorComponent implements OnInit, OnDestroy {
  private applicationType: string;
  private applicationTypeText: string;
  private agText: string;
  private instanceText: string;
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private view: string = InstancesModel.APPLICATION_VIEW;
  private typeView: string = 'applicationview';
  private dataset: DatasetModel<BaseApplicationModel>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<BaseApplicationModel> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private filters: Array<FilterModel> = [];
  private searchResultView: boolean = false;
  private textAll: string;
  private textApplication: string;
  private resourceType: string = ResourceGroupsService.CONTAINER_TYPE;
  private allRbacPath: string = ResourceGroupsService.ALL_APPLICATION_RBAC_PATH;
  private addAllItem: ResourceGroupSelectionModel;
  private RBAC_APPLICATION_PATTERN: string = '{0}/app.type:{1}';
  private RBAC_APPLICATION_SQL_PATTERN: string = '{0}/app.type:{1}/{2}';

  private textAppMap = { all: '', alwayson: '', k8s: ''};

  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService,
              private applicationService: ApplicationService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-container-table-pagination-${(new Date()).valueOf()}`;
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
      'application.instancesText',
      'resourceGroups.textAll',
      'resourceGroups.textApplication',
      'application.agGroupText',
      'application.textKubernetes'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.instanceText = resource['application.instancesText'];
      me.agText = resource['application.agGroupText'];
      me.textAll = resource['resourceGroups.textAll'];
      me.textApplication = resource['resourceGroups.textApplication'];
      me.textAppMap = {
         all: resource['resourceGroups.textAll'],
         k8s: resource['application.textKubernetes'],
         alwayson: resource['application.textSql'],
      };
      me.resetApplicationType(this.applicationType);
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

  private isK8s(): boolean {
    return this.applicationType === 'k8s';
  }

  private isViewSupported(): boolean {
    return this.isK8s();
  }

  private resetApplicationType(selApplicationType: string) {
    let me = this;
    switch (selApplicationType) {
      case 'k8s':
        me.applicationTypeText = me.textAppMap.k8s;
        return;
      case 'alwayson':
        me.applicationTypeText = me.textAppMap.alwayson;
        return;
      default:
        return;
    }
  }

  private loadDataResetView() {
    this.typeView = 'applicationview';
    this.loadData();
  }

  private loadData(isAlwaysOn: boolean = false): void {
    let me = this,
        title: string,
        crumb,
        selApplicationType = me.applicationType,
        alwaysOn: boolean = isAlwaysOn;
    if ((me.isViewSupported() && me.typeView === 'labelview') || alwaysOn) {
      me.view = InstancesModel.LABEL_VIEW;
      alwaysOn = false;
    } else {
      me.view = InstancesModel.APPLICATION_VIEW;
      alwaysOn = false;
    }
    // if (me.isViewSupported()) {
    //   me.filters.push(new FilterModel('databaseGroupPk', undefined, 'NOT EXISTS'));
    //   me.setSqlFilters();
    // } else {
    //   me.filters = [];
    // }
    title = alwaysOn ? me.agText : me.instanceText;
    me.mask();
    me.applicationService.getApplications(me.applicationType, alwaysOn, undefined, 'hlo',
      me.paginateConfig.pageStartIndex()).takeUntil(me.subs)
      .subscribe(
        dataset => {
          me.records = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          crumb = new BreadcrumbModel(title, me.applicationService.getEcxApiEndpoint(me.applicationType,
            alwaysOn, 'hlo'));
          me.resetApplicationType(selApplicationType);
          me.breadcrumbs = me.resourceGroupsService.resetBreadcrumbs(me.breadcrumbs, crumb);
          me.unmask();
          },
          err => me.handleError(err)
        );
    me.updateAllItem(selApplicationType);
  }

  /**
   * This function reset addAllItem as Application -> Oracle instead of Application -> All
   */

  private updateAllItem(applicationType: string) {
    let me = this;
    me.addAllItem = me.resourceGroupsService.createAllItem(
      SharedService.formatString(me.RBAC_APPLICATION_PATTERN,
        ResourceGroupsService.ALL_APPLICATION_RBAC_PATH, me.applicationType),
      me.textAll + ' ' + me.textAppMap[applicationType], [me.textApplication]);
  }

  private navigate(item: BaseApplicationModel): void {
    let me = this, view;

    if (me.isViewSupported() && me.typeView === 'labelview') {
      me.view = InstancesModel.LABEL_VIEW;
    } else {
      me.view = InstancesModel.APPLICATION_VIEW;
    }

    if (item.hasLink(me.view)) {
      me.mask();
      me.breadcrumbs = me.resourceGroupsService.addBreadcrumb(me.breadcrumbs, item);
      view = me.applicationService.navigate(item, me.view,
        me.filters, me.sorters);
      if (view) {
        (<Observable<DatasetModel<BaseApplicationModel>>>view).takeUntil(me.subs)
          .subscribe(
            dataset => {
              me.records = dataset.records;
              me.dataset = dataset;
              me.unmask();
              me.paginateConfig.refresh(me.dataset.total);
            },
            err => {
              me.unmask();
              me.handleError(err);
            }
          );
      } else {
        me.unmask();
      }
    }
  }
  private isFirstLevel(): boolean {
    return this.breadcrumbs.length === 1;
  }

  private onBreadcrumbClick(item: any) {
    let me = this;
    if (item.resource) {
      this.navigate(item.resource);
    } else {
      this.loadData(me.view === InstancesModel.DATABASE_GROUP_VIEW);
    }
  }

  private onRefresh(): void {
    let me = this, crumb = me.resourceGroupsService.currentBreadcrumb(me.breadcrumbs);
    if (crumb) {
      this.onBreadcrumbClick(crumb);
    }
  }

  private onSearch(namePattern: string): void {
    let me = this,
      alwaysOn = me.view === InstancesModel.DATABASE_GROUP_VIEW,
      title = alwaysOn ? me.agText : me.instanceText,
      crumb = new BreadcrumbModel(title, me.applicationService.getEcxApiEndpoint(me.applicationType, alwaysOn, 'hlo'));
    me.mask();
    me.applicationService.dbSearch(me.applicationType, 'hlo', {name: namePattern}, me.filters)
      .takeUntil(this.subs).subscribe(
      db => {
        me.mask();
        me.records = db.getRecords();
        me.dataset = db;
        me.paginateConfig.refresh(db.total);
        me.unmask();
        me.searchResultView = true;
      },
      err => {
        me.handleError(err);
      }
    );
  }

  private setSqlFilters(): void {
    let me = this,
      dbGroupFilterIdx = me.filters.findIndex((item) => {
        return item.property === 'databaseGroupPk';
      });
    if (dbGroupFilterIdx !== -1 && me.view) {
      me.filters[dbGroupFilterIdx].op = me.view === InstancesModel.DATABASE_GROUP_VIEW ? 'EXISTS' : 'NOT EXISTS';
    }
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.applicationType = undefined;
  }
}

