import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'core';
import { SelectorService } from 'shared/selector/selector.service';
import { selectorFactory, SelectorType } from 'shared/selector/selector.factory';
import { AlertType, AlertComponent, ErrorHandlerComponent } from 'shared/components';
import { SdlSearchBarComponent } from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import { FilterModel } from 'shared/models/filter.model';
import { SorterModel } from 'shared/models/sorter.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { Subject } from 'rxjs/Subject';
import { ApplicationService } from '../../shared/application.service';
import { InstanceModel } from '../../shared/instance.model';
import { BaseModel } from 'shared/models/base.model';
import { InstancesModel } from '../../shared/instances.model';
import { NvPairModel } from 'shared/models/nvpair.model';
import { BaseApplicationModel } from '../../shared/base-application-model.model';
import { Observable } from 'rxjs/Observable';
import { RestService } from 'core';
import { DatasetModel } from 'shared/models/dataset.model';
import { DatabaseGroupModel } from '../../shared/databasegroup.model';
import { ApplicationRestoreService } from '../application-restore.service';
import { ApplicationRestoreItem } from '../application-list-table/application-list-table.component';

type PendingSetTarget = {
  instanceHref: string,
  groupHref?: string
};

@Component({
  selector: 'application-destination-table',
  templateUrl: './application-destination-table.component.html',
  styleUrls: ['./application-destination-table.component.scss'],
  providers: [
    ApplicationService,
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})

export class ApplicationDestinationTableComponent implements OnInit, OnDestroy {
  @Input() applicationType: string;
  @Input() filters: Array<FilterModel>;
  @Input() view: NvPairModel = new NvPairModel('', InstancesModel.APPLICATION_VIEW);
  @ViewChild(SdlSearchBarComponent) sdlSearchBar: SdlSearchBarComponent;
  public osType: string;
  public breadcrumbs: Array<any>;
  private records: Array<InstanceModel>;
  private selections: Array<ApplicationRestoreItem> = [];
  private selectedDbGroup: BaseApplicationModel;
  private paginateConfig: PaginateConfigModel;
  private errorHandler: ErrorHandlerComponent;
  private errorTitle: string;
  private textConfirm: string;
  private textInstances: string;
  private textAgg: string;
  private alert: AlertComponent;
  private processingRequestMsg: string;
  private sorters: Array<SorterModel>;
  private selectedInstance: InstanceModel;
  private subs: Subject<void> = new Subject<void>();
  private masked: boolean = false;
  private pendingSetTarget: PendingSetTarget;
  private searchPattern: string = undefined;

  constructor(private applicationService: ApplicationService,
              private applicationRestoreService: ApplicationRestoreService,
              private translate: TranslateService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `application-destination-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId, pageSize: RestService.pageSize});
    this.breadcrumbs = this.applicationService.breadcrumbs;
  }

  private get isDbLevel(): boolean {
   return this.applicationService && this.applicationService.isDbLevel;
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.typeText',
      'common.typeText',
      'common.errorTitle',
      'common.textConfirm',
      'application.instancesText',
      'application.agGroupText'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.errorTitle = resource['common.errorTitle'];
        me.textInstances = resource['application.instancesText'];
        me.textAgg = resource['application.agGroupText'];

        me.loadData();
      });
    me.applicationRestoreService.filterInstancesSub.takeUntil(me.subs)
      .subscribe(
        (selections: Array<ApplicationRestoreItem>) => {
          me.selections = selections;
          me.osType = me.extractOsType(me.selections);
          me.records = me.disableInstance(me.records, me.selections);
        }
      );
  }

  public mask() {
    this.masked = true;
  }

  public unmask() {
    this.masked = false;
  }

  public alertErr(errMsg?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.errorTitle, errMsg, AlertType.ERROR);
    }
  }

  public handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  public confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler, discardHandler);
  }

  public setView(item: NvPairModel): void {
    this.view = item;
  }

  public isDBGroup(): boolean {
    let me = this;
    return (me.view && me.view.value) === InstancesModel.DATABASE_GROUP_VIEW;
  }

  public loadData(instanceHref?: string, groupHref?: string, mode?: string, callback?: Function): void {
    let me = this,
      isDbGroup: boolean = me.isDBGroup(),
      title: string = isDbGroup ?  me.textAgg : me.textInstances,
      crumb = new BreadcrumbModel(title,
      me.applicationService.getEcxApiEndpoint(me.applicationType, isDbGroup, 'hlo')),
      filters = (!isDbGroup && !!me.osType) ? [new FilterModel('osType', me.osType)] : undefined;
    me.applicationService.resetBreadcrumbs(crumb);
    me.paginateConfig.reset();
    me.mask();
    me.applicationService.getApplications(me.applicationType || 'oracle',
      isDbGroup, undefined, 'hlo',
      me.paginateConfig.pageStartIndex())
      .subscribe(
        data => {
          let dataset = data,
              total: number;
          me.records = dataset.records;
          me.applicationService.records = me.records;
          me.records = me.disableInstance(me.records, me.selections);
          total = me.records.length || dataset.total;
          me.paginateConfig.refresh(total);
          me.unmask();
          instanceHref = instanceHref || (me.pendingSetTarget && me.pendingSetTarget.instanceHref);
          groupHref = groupHref || (me.pendingSetTarget && me.pendingSetTarget.groupHref);
          if (instanceHref) {
            if (me.view && (me.view.value === InstancesModel.APPLICATION_VIEW || InstancesModel.LABEL_VIEW)) {
              me.setDestination(instanceHref);
            } else {
              me.setGroupDestination(groupHref, instanceHref);
            }
          } else {
            me.emptySelection();
          }
          if (callback)
            callback.call(me);
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
  }

  public hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  public emptySelection(): void {
    this.selector.deselectAll();
    this.selectedInstance = undefined;
  }

  public getValue(): object {
    let item: InstanceModel = this.selectedInstance,
        returnVal: object;
    if (item) {
      returnVal = {
        href: item.url,
        resourceType: item.resourceType
      };
    }
    return returnVal;
  }

  public getSelectedInstance(): InstanceModel {
    return this.selectedInstance;
  }

  public getDbGroupValue(): object {
    let returnVal: object;
    if (this.selectedDbGroup) {
      returnVal = {
        href: this.selectedDbGroup.url,
        resourceType: this.selectedDbGroup.resourceType
      };
    }
    return returnVal;
  }

  public setDestination(href: string): void {
    let instance: InstanceModel;
    if (href && this.records && this.records.length > 0) {
      instance = this.records.find((item: InstanceModel) => {
        return this.matchIdFromUrl(href, item.id);
      });
      this.onSelect(instance);
      this.selectedInstance = instance;
    }
  }

  public matchIdFromUrl(href: string, id: string): boolean {
    return RegExp(id, 'i').test(href);
  }

  public setGroupDestination(href: string, instanceHref?: string): void {
    let group: any;
    if (href && this.records && this.records.length > 0) {
      group = this.records.find((item: DatabaseGroupModel) => {
        return this.matchIdFromUrl(href, item.id);
      });
      this.selectedDbGroup = group;
      this.navigate(this.selectedDbGroup, instanceHref);
    }
  }

  navigate(item: BaseApplicationModel, instanceHref?: string) {
    let me = this,
      view;
    me.selectedDbGroup = item;
    if (me.canNavigate(item)) {
      me.mask();
      me.paginateConfig.reset();
      me.mergeOsTypeFilter();
      view = me.applicationService.navigate(item, 'instances', me.filters, me.sorters);
      if (view) {
        (<Observable<DatasetModel<BaseApplicationModel>>>view).subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
            if (instanceHref) {
              me.setDestination(instanceHref);
            }
          },
          err => {
            me.unmask();
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
  }

  public setTarget(instanceHref: string, groupHref?: string): void {
    let me = this;
    if (me.records === undefined) {
      me.pendingSetTarget = {
        instanceHref: instanceHref,
        groupHref: groupHref
      };
    } else {
      me.pendingSetTarget = undefined;
      if (instanceHref) {
        if (me.view && (me.view.value === InstancesModel.APPLICATION_VIEW || InstancesModel.LABEL_VIEW)) {
          me.setDestination(instanceHref);
        } else {
          me.setGroupDestination(groupHref, instanceHref);
        }
      }
    }
  }

  private getAppServerNames(item: BaseApplicationModel): string {
    let me = this, retVal: Array<String> = [];
    if (item && item.appServerVmInfos && Array.isArray(item.appServerVmInfos) && item.appServerVmInfos.length > 0) {
      for (let i of item.appServerVmInfos) {
        retVal.push(i.appServerName);
      }
    } 
    return retVal.join(' ');
  }
  
  private isSearch(): boolean {
    return this.searchPattern !== undefined;
  }

  private clearSearch(): void {
    this.searchPattern = undefined;
    this.sdlSearchBar.reset();
  }
 
  private onClearSearch(): void {
    let me = this, 
      isDbGroup: boolean = me.isDBGroup(),
      title: string = isDbGroup ?  me.textAgg : me.textInstances,
      crumb = new BreadcrumbModel(title, me.applicationService.getEcxApiEndpoint(me.applicationType, isDbGroup, 'hlo'));
    me.clearSearch();
    me.applicationService.resetBreadcrumbs(crumb);
    me.loadData();
  }

  private resetSearch(namePattern: string): void {
    let me = this, 
      isDbGroup: boolean = me.isDBGroup(),
      title: string = isDbGroup ?  me.textAgg : me.textInstances,
      crumb = new BreadcrumbModel(title, me.applicationService.getEcxApiEndpoint(me.applicationType, isDbGroup, 'hlo'));
    me.paginateConfig.reset ();
    me.searchPattern = namePattern;
    me.applicationService.resetBreadcrumbs(crumb);
    me.search();
  }

  private startSearch(namePattern?: string): void {
    let me = this;
    
    if (namePattern == null || namePattern === '') {
      me.onClearSearch();
    } else {
      me.resetSearch(namePattern);
    }
  }

  private search(): void {
    let me = this; 
    
    me.mask();

    me.applicationService.instanceSearch(me.applicationType, 'hlo', {name: me.searchPattern}, me.filters, 
      me.paginateConfig.pageStartIndex(), me.paginateConfig.pageSize()).subscribe(
        data => {
          let dataset = data, total: number;
          me.records = me.disableInstance(dataset.records, me.selections);
          me.applicationService.records = me.records;
          total = me.records.length || dataset.total;
          me.paginateConfig.refresh(total);
          me.unmask();
        },
        err => {
          me.unmask();
          me.handleError(err);
        },
        () => {
          me.emptySelection();
        }
      );
  }

  private extractOsType(list: Array<ApplicationRestoreItem>): string {
    let target = (list || []).find(function(item) {
      let resource = item.resource;
      return resource && !!resource.osType;
    });
    return target && target.resource ? target.resource.osType : undefined;
  }

  private mergeOsTypeFilter(): void {
    let me = this, target: FilterModel, filters = me.filters, hasOsType = !!me.osType;
    if (filters) {
      target = filters.find(function (item) {
        return item.property === 'osType';
      });
      if (target) {
        if (hasOsType)
          target.value = me.osType;
        else
          filters.splice(filters.indexOf(target), 1);
      } else if (hasOsType) {
        filters.push(new FilterModel('osType', me.osType));
      }
    } else if (hasOsType) {
      me.filters = [new FilterModel('osType', me.osType)];
    }
  }

  private incompatibleTargetInstance(source: BaseApplicationModel, target: BaseApplicationModel): boolean {
    let result = false, sourcePartitions = source.partitions || [], targetPartitions = target.partitions || [],
      nonDpfInstance = sourcePartitions.length === 0,
      sourcePartitionNums = [], targetPartitionNums = [], targetHosts = [];

    // Prevent cross-platform restore. SPP-7292.
    if (!!source.osType && source.osType !== target.osType)
      return true;

    if (this.applicationType !== 'db2' || nonDpfInstance)
      return result;

    // For DB2 DPF instance, add restriction
    sourcePartitions.forEach(function (item) {
      if (sourcePartitionNums.indexOf(item.id) === -1)
        sourcePartitionNums.push(item.id);
    });
    targetPartitions.forEach(function (item) {
      if (targetPartitionNums.indexOf(item.id) === -1)
        targetPartitionNums.push(item.id);

      // Collect the host.
      if (item.host && targetHosts.indexOf(item.host) === -1) {
        targetHosts.push(item.host);
      }
    });

    // Restrict selectable targets to single host environments. SPP-6697.
    // So a compatible targets are considered to be:
    //   1. single-host DPF
    //   2. partition #'s exactly match the original ones
    if (targetHosts.length !== 1 || sourcePartitionNums.length !== targetPartitionNums.length)
      result = true;
    else {
      result = sourcePartitionNums.findIndex(function (partitionNum) {
        return targetPartitionNums.indexOf(partitionNum) === -1;
      }) !== -1;
    }
    return result;
  }

  private disableInstance(records: Array<BaseApplicationModel>,
                                  selections: Array<ApplicationRestoreItem>): Array<BaseApplicationModel> {
    let returnVal: Array<BaseApplicationModel> = records || [],
        selectionList: Array<ApplicationRestoreItem> = selections || [];

    if (records === undefined)
      return undefined;

    if (returnVal.length > 0 && selectionList.length > 0) {
      for (let i = 0; i < returnVal.length; i++) {
        returnVal[i].disable = false;
        for (let j = 0; j < selectionList.length; j++) {
          if ((this.cannotSameInstanceId() && returnVal[i].id === selectionList[j].instanceId) ||
            (this.cannotHaveSameHost() && returnVal[i].host === selectionList[j].resource.host) ||
            (this.cannotHaveMultipleVersions() && selectionList[j].instanceVersion !== returnVal[i].version) ||
            this.incompatibleTargetInstance(selectionList[j].resource, returnVal[i])) {
            returnVal[i].disable = true;
            if (this.isSelected(returnVal[i])) {
              this.emptySelection();
            }
          }
        }
      }
    }
    return returnVal;
  }

  private isSelected(item: BaseApplicationModel): boolean {
    return ( (this.selectedInstance && this.selectedInstance.id) === (item && item.id) )
      || ( (this.selectedDbGroup && this.selectedDbGroup.id) === (item && item.id) );
  }

  private onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.loadData();
  }

  private onSelect(item: InstanceModel): void {
    let me = this;
    if (me.selector) {
      me.emptySelection();
      me.selector.select(item);
      me.selectedInstance = item;
    }
  }

  private canNavigate(item: BaseApplicationModel): boolean {
    if (item && item.resourceType === 'databasegroup' && !item.disable) {
      return item.hasLink('instances');
    }
    return false;
  }

  private onBreadcrumbClick(item: BreadcrumbModel): void {
    this.clearSearch();

    if (item && item.resource) {
      this.navigate(item.resource as BaseApplicationModel);
    } else {
      this.loadData();
    }
  }

  private refresh(): void {
    let crumb: BreadcrumbModel = this.applicationService.currentBreadcrumb();
    if (crumb && crumb.resource) {
      this.navigate(crumb.resource as BaseApplicationModel);
    } else {
      this.loadData();
    }
  }

  private cannotHaveSameHost(): boolean {
    return this.applicationType === 'db2';
  }

  private cannotSameInstanceId(): boolean {
    return this.applicationType !== 'sql';
  }

  private cannotHaveMultipleVersions(): boolean {
    return ['oracle', 'db2'].indexOf(this.applicationType) !== -1;
  }

  private trackByAppFn(index: number, item: BaseApplicationModel): string {
    return item && item.id;
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }
}
