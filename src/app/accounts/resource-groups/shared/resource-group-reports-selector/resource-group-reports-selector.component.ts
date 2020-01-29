import { Component, OnInit, OnDestroy } from '@angular/core';
import { JsonConvert } from 'json2typescript/index';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ResourceGroupModel } from '../resource-group.model';
import { NodeService, RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { DatasetModel } from 'shared/models/dataset.model';
import { SorterModel } from 'shared/models/sorter.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { FilterModel } from 'shared/models/filter.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import {ReportCategoryModel} from 'reports/shared/report-category.model';
import {ReportCategoriesModel} from 'reports/shared/report-categories.model';
import {ReportsModel} from 'reports/shared/reports.model';
import {ReportModel} from 'reports/shared/report.model';

@Component({
  selector: 'resource-group-reports-selector',
  templateUrl: './resource-group-reports-selector.component.html',
  styleUrls: ['../../resource-groups.scss']
})

export class ResourceGroupReportsSelectorComponent implements OnInit, OnDestroy {
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private view: string = 'customReports';
  private dataset: DatasetModel<any>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<any> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private categories: Array<ReportCategoryModel> = [];
  private filters: Array<FilterModel> = [];
  private searchResultView: boolean = false;
  private selectedReport: ReportCategoryModel;
  private addAllItem: ResourceGroupSelectionModel;
  private resourceType: string = ResourceGroupsService.REPORTS_TYPE;
  private allRbacPath: string = ResourceGroupsService.ALL_REPORTS_RBAC_PATH;
  private textReports: string;
  private textAll: string;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private node: NodeService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-reports-table-pagination-${(new Date()).valueOf()}`;
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
      'resourceGroups.textReport']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textReports = resource['resourceGroups.textReport'];
        me.textAll = resource['resourceGroups.textAll'];
        me.addAllItem = me.resourceGroupsService.createAllItem(me.allRbacPath, me.textAll, [me.textReports]);
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
          me.loadCategories();
        }
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private loadCategories(): void {
    let me = this,
      observable = ReportCategoriesModel.retrieve<ReportCategoryModel, ReportCategoriesModel>(ReportCategoriesModel,
        me.rest, undefined, me.sorters, 0, 0);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.categories = dataset.records;
        },
        err => {
          me.handleError(err);
        }
      );
    }
  }

  private loadCannedReports(): void {
    let observable: Observable<ReportsModel>,
        crumb: BreadcrumbModel;
    if (this.selectedReport) {
      observable = this.selectedReport.getCannedReports(this.node);
      if (observable) {
        crumb = new BreadcrumbModel(this.selectedReport.name, this.selectedReport.url);
        this.breadcrumbs = this.resourceGroupsService.resetBreadcrumbs(this.breadcrumbs, crumb);
        this.mask();
        observable.takeUntil(this.subs).subscribe(
          dataset => {
            this.dataset = dataset;
            this.records = dataset.records;
            this.paginateConfig.refresh(dataset.total);
            this.unmask();
          },
          err => {
            this.handleNodeError(err);
          }
        );
      }
    }
  }

  private loadCustomReports(item: ReportModel): void {
    let me = this, observable: Observable<ReportsModel>;
      observable = item.getCustomReports(me.node);
      if (observable) {
        me.mask();
        observable.takeUntil(me.subs).subscribe(
          (data: any) => {
            me.unmask();
            let dataset: ReportsModel;
            try {
              if (data.statusCode) {
                dataset = JsonConvert.deserializeObject(data.response[0], ReportsModel);
              } else {
                dataset = JsonConvert.deserializeObject(data, ReportsModel);
              }
              me.breadcrumbs = me.resourceGroupsService.addBreadcrumb(me.breadcrumbs, item);
              me.dataset = dataset;
              me.records = dataset.records;
              me.paginateConfig.refresh(dataset.total);
            } catch (e) {
            }
          },
          err => {
            me.handleNodeError(err);
          }
        );
      } else {
        me.unmask();
      }
  }

  private onBreadcrumbClick(item: any) {
    let me = this;
    if (item.resource) {
      this.loadCustomReports(item.resource);
    } else {
      this.loadCannedReports();
    }
  }

  private onRefresh(): void {
    let me = this, crumb = me.resourceGroupsService.currentBreadcrumb(this.breadcrumbs);
    if (crumb) {
      this.onBreadcrumbClick(crumb);
    }
  }

  private onSearch(namePattern: string): void {
    // TODO: Backend does not support search for reports
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private handleNodeError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleNodeError(err);
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.categories = [];
    this.records = [];
    this.dataset = undefined;
    this.selectedReport = undefined;
    this.searchResultView = false;
  }
}

