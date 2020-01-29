import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResourceGroupModel } from '../resource-group.model';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { FilterModel } from 'shared/models/filter.model';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { ScreensModel } from '../resource-group-screens-selector/screens.model';
import { BaseModel } from 'shared/models/base.model';
import { PolicyModel } from 'job/shared/policy.model';
import { PoliciesModel } from 'job/shared/policies.model';
import { SorterModel } from 'shared/models/sorter.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';

@Component({
  selector: 'resource-group-job-selector',
  template: `<div class="space-top-10">
    <resource-selector-component
      [records]="records"
      [dataset]="dataset"
      [masked]="masked"
      [breadcrumbs]="breadcrumbs"
      [resourceType]="'resourceGroups.textJob' | translate"
      [hideSearchBar]="true"
      [hideBreadcrumbs]="true"
      [addAllItem]="addAllItem"
      [paginateConfig]="paginateConfig"
      (onPageChangeEvent)="onRefresh()"
      (onRefreshEvent)="onRefresh()"
    ></resource-selector-component>
</div>
`,
  styleUrls: ['../../resource-groups.scss']
})

export class ResourceGroupJobSelectorComponent implements OnInit, OnDestroy {
  private subs: Subject<void> = new Subject<void>();
  private dataset: DatasetModel<any>;
  private paginateConfig: PaginateConfigModel;
  private filters: Array<FilterModel> = [];
  private sorters: Array<SorterModel>;
  private records: Array<any> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private resourceType: string = ResourceGroupsService.JOB_TYPE;
  private addAllItem: ResourceGroupSelectionModel;
  private allRbacPath: string = ResourceGroupsService.allJobRbacPath;
  private textJob: string;
  private textAll: string;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-job-table-pagination-${(new Date()).valueOf()}`;
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
    me.translate.get([
      'resourceGroups.textAll',
      'resourceGroups.textJob']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textJob = resource['resourceGroups.textJob'];
        me.textAll = resource['resourceGroups.textAll'];
        me.addAllItem = me.resourceGroupsService.createAllItem(me.allRbacPath, me.textAll, [me.textJob]);
      });
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
    me.resourceGroupsService.loadDataSub.takeUntil(me.subs).subscribe(
      (resourceType: string) => {
        if (resourceType === me.resourceType) {
          me.loadData();
        }
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private loadData(): void {
    let me = this,
      observable: Observable<any>;

    observable = PoliciesModel.retrieve<PolicyModel, PoliciesModel>(PoliciesModel, me.rest,
      undefined, me.sorters, 0, RestService.pageSize);
    me.mask();
    if (observable) {
      observable.takeUntil(me.subs)
        .subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
            me.dataset = dataset;
            me.unmask();
          },
          err => me.handleError(err)
        );
    }
  }

  private onRefresh(): void {
    this.loadData();
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private reset(): void {
    this.breadcrumbs = [];
  }
}

