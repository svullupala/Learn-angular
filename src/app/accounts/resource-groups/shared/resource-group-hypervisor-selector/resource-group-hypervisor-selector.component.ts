import { Component, ElementRef, EventEmitter, OnInit, Input, Output, ViewChild, OnDestroy } from '@angular/core';
import { ResourceGroupModel } from '../resource-group.model';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { HypervisorBrowseService } from 'hypervisor/shared/hypervisor-browse.service';
import { VmRecoveryPointsService } from 'hypervisor/shared/vmrecoverypoints.service';
import { DatasetModel } from 'shared/models/dataset.model';
import { HypervisorsModel } from 'hypervisor/shared/hypervisors.model';
import { JsonConvert } from 'json2typescript/index';
import { SorterModel } from 'shared/models/sorter.model';
import { HypervisorManageService }
from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';
import { Observable } from 'rxjs/Observable';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { TranslateService } from '@ngx-translate/core';
import { HypervisorModel } from 'hypervisor/shared/hypervisor.model';
import { FilterModel } from 'shared/models/filter.model';
import { ResourceSelectorComponent } from '../resource-selector/resource-selector.component';
import { SharedService } from 'shared/shared.service';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import {CloudsModel} from 'cloud/clouds.model';
import {CloudService} from 'cloud/cloud.service';

@Component({
  selector: 'resource-group-hypervisor-selector',
  templateUrl: './resource-group-hypervisor-selector.component.html',
  styleUrls: ['../../resource-groups.scss'],
  providers: [HypervisorBrowseService, HypervisorManageService, VmRecoveryPointsService, CloudService]
})

export class ResourceGroupHypervisorSelectorComponent implements OnInit, OnDestroy {
  @ViewChild(ResourceSelectorComponent) selector: ResourceSelectorComponent;
  private subs: Subject<void> = new Subject<void>();
  private hypervisorType: string;
  private viewValue: string = 'vms';
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private dataset: DatasetModel<BaseHypervisorModel>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<BaseHypervisorModel> = [];
  private breadcrumbs: Array<BreadcrumbModel>;
  private searchResultView: boolean = false;
  private resourceType: string = ResourceGroupsService.HYPERVISOR_TYPE;
  private textVmware: string;
  private textHyperv: string;
  private textAwsEC2: string;
  private textAll: string;
  private textHypervisor: string;
  private addAllItem: ResourceGroupSelectionModel;
  private allRbacPath: string = ResourceGroupsService.ALL_HYPERVISOR_RBAC_PATH;
  private applicationTypeText: string;
  private textHypervName: string;
  private textAwsEC2Name: string;
  private textVMWareName: string;
  private RBAC_HYPERVISOR_PATTERN: string = '{0}/hypervisor.type:{1}';

  private masked: boolean = false;

  constructor(private rest: RestService,
              private resourceGroupsService: ResourceGroupsService,
              private hypervisorBrowseService: HypervisorBrowseService,
              private cloudService: CloudService,
              private translate: TranslateService,
              private hypervisorService: HypervisorManageService) {
    let me = this;
    me.breadcrumbs = [];
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-hypervisor-table-pagination-${(new Date()).valueOf()}`;
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
      'hyperv.textTitle',
      'hyperv.textServers',
      'hypervisor.textVMs',
      'hypervisor.textVmAndTemplates',
      'hypervisor.textVMs',
      'awsec2.textAccounts',
      'awsec2.textTitle',
      'hypervisor.textDatastore',
      'resourceGroups.textAll',
      'resourceGroups.textHypervisor',
      'vmware.textVCenters',
      'vmware.textVMware']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textHyperv = resource['hyperv.textServers'];
        me.textVmware = resource['vmware.textVCenters'];
        me.textAwsEC2 = resource['awsec2.textAccounts'];
        me.textAll = resource['resourceGroups.textAll'];
        me.textHypervisor = resource['resourceGroups.textHypervisor'];
        me.textHypervName = resource['hyperv.textTitle'];
        me.textAwsEC2Name = resource['awsec2.textTitle'];
        me.textVMWareName = resource['vmware.textVMware'];
        me.resetApplicationType(this.hypervisorType);
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

  private isFirstLevel(): boolean {
    return this.breadcrumbs.length === 1;
  }

  private loadDefaultData(): void {
    this.viewValue = this.isAWSEC2() ? 'vmview' : 'vms';
    this.loadData();
  }

  private resetApplicationType(selApplicationType: string) {
    let me = this;
    switch (selApplicationType) {
      case 'vmware':
        me.applicationTypeText = me.textVMWareName;
        return;
      case 'hyperv':
        me.applicationTypeText = me.textHypervName;
        return;
      case 'awsec2':
        me.applicationTypeText = me.textAwsEC2Name;
        return;
      default:
        return;
    }
  }

  private getApplicationTypeString(selApplicationType: string): string {
    let me = this;
    switch (selApplicationType) {
      case 'vmware':
        return me.textVMWareName;
      case 'hyperv':
        return me.textHypervName;
      case 'awsec2':
        return me.textAwsEC2Name;
      default:
        return '';
    }
  }

  private loadData(): void {
    let me = this,
        selApplicationType = me.hypervisorType,
        title: string = me.isHyperV() ? me.textHyperv : me.isAWSEC2() ? me.textAwsEC2 : me.textVmware;
    me.mask();
    me.breadcrumbs = [];
    if (!this.isAWSEC2()) {
      me.hypervisorService.getAll(me.mergeTypeFilter(me.filters, true), me.sorters, 'hlo',
        me.paginateConfig.pageStartIndex())
        .subscribe(
          data => {
            me.unmask();
            // Cast the JSON object to HypervisorsModel instance.
            let dataset = JsonConvert.deserializeObject(data, HypervisorsModel);
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
          },
          err => me.handleError(err),
          () => {
            me.unmask();
            me.searchResultView = false;
          }
        );
    } else {
      this.cloudService.getAll(me.getCloudFilters(), me.sorters, 'hlo',
        me.paginateConfig.pageStartIndex()).
      subscribe(
        (data: CloudsModel) => {
          me.unmask();
          let dataset = JsonConvert.deserializeObject(data, CloudsModel);
          me.records = dataset.records;
          me.paginateConfig.refresh(dataset.total);
        },
        (err) => {
          me.unmask();
          me.searchResultView = false;
          this.handleError(err);
        }
      );
    }
    me.updateAllItem(selApplicationType);
  }

  private updateAllItem(applicationType: string) {
    let me = this;
    me.addAllItem = me.resourceGroupsService.createAllItem(
      SharedService.formatString(me.RBAC_HYPERVISOR_PATTERN,
        ResourceGroupsService.ALL_HYPERVISOR_RBAC_PATH, applicationType),
      me.textAll + ' ' + me.getApplicationTypeString(applicationType),[me.textHypervisor]);
  }

  private navigate(item: BaseHypervisorModel): void {
    let me = this, view;
    if (item.hasLink(me.viewValue)) {
      me.mask();
      view = me.hypervisorBrowseService.navigate(item, me.viewValue,
        me.mergeTypeFilter(me.filters, false), me.sorters, me.paginateConfig.pageStartIndex());
      if (view) {
        (<Observable<DatasetModel<BaseHypervisorModel>>>view).takeUntil(me.subs)
          .subscribe(
            dataset => {
              me.records = dataset.records;
              me.dataset = dataset;
              me.paginateConfig.refresh(me.dataset.total);
              me.breadcrumbs = me.resourceGroupsService.addBreadcrumb(me.breadcrumbs, item);
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
  }

  private onBreadcrumbClick(item: any) {
    let me = this;
      if (item.resource) {
        this.navigate(item.resource);
      } else {
        this.loadData();
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
      view: string = me.viewValue === 'storageview' ? 'volume' : 'vm',
      title: string = me.isHyperV() ? me.textHyperv : me.isAWSEC2() ? me.textAwsEC2 : me.textVmware,
      crumb = new BreadcrumbModel(title, me.hypervisorService.getEcxApiEndpoint());
      me.hypervisorBrowseService.resetBreadcrumbs(crumb);
    me.mask();
    me.hypervisorBrowseService.search(namePattern, me.hypervisorType, 'hlo', me.paginateConfig.pageStartIndex(),
      me.mergeTypeFilter(me.filters, true), RestService.pageSize, view).takeUntil(me.subs).subscribe(
      dataset => {
        me.records = dataset.records;
        me.dataset = dataset;
        me.paginateConfig.refresh(me.dataset.total);
      },
      err => {
        me.handleError(err);
      },
      () => {
        me.unmask();
        me.searchResultView = true;
      }
    );
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private isAWSEC2(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_AWSEC2;
  }

  private mergeTypeFilter(filters: Array<FilterModel>, isRoot: boolean): Array<FilterModel> {
    return (filters || []).concat(isRoot ? [new FilterModel('type', this.hypervisorType)] : []);
  }

  private getCloudFilters() {
    let filters = [];
    filters.push(new FilterModel('provider', 'sp', 'NOT IN'));
    if (!this.isAWSEC2()) {
      filters.push(new FilterModel('type', 'compute', 'NOT IN'));
    } else {
      filters.push(new FilterModel('type', 'compute', '='));
    }
    return filters;
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.hypervisorType = undefined;
    this.viewValue = undefined;
  }
}
