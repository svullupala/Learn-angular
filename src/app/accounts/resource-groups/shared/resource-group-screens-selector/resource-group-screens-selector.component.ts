import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResourceGroupModel } from '../resource-group.model';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { SorterModel } from 'shared/models/sorter.model';
import { Observable } from 'rxjs/Observable';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { TranslateService } from '@ngx-translate/core';
import { ScreensModel } from './screens.model';
import { BaseModel } from 'shared/models/base.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';

@Component({
  selector: 'resource-group-screens-selector',
  templateUrl: './resource-group-screens-selector.component.html',
  styleUrls: ['../../resource-groups.scss']
})

export class ResourceGroupScreensSelectorComponent implements OnInit, OnDestroy {
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private dataset: DatasetModel<any>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<any> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private resourceType: string = ResourceGroupsService.SCREENS_TYPE;
  private textScreens: string;
  private addAllItem: ResourceGroupSelectionModel;
  private textAll: string;
  private allRbacPath: string = ResourceGroupsService.ALL_SCREEN_RBAC_PATH;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-screens-table-pagination-${(new Date()).valueOf()}`;
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
      'resourceGroups.textScreens',
      'resourceGroups.textAll',
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textScreens = resource['resourceGroups.textScreens'];
        me.textAll = resource['resourceGroups.textAll'];
        me.addAllItem = me.resourceGroupsService.createAllItem(me.allRbacPath, me.textAll, [me.textScreens]);
      });
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
    me.resourceGroupsService.loadDataSub.takeUntil(me.subs).subscribe(
      (resourceType: string) => {
        if (resourceType === me.resourceType) {
          me.loadScreens();
        }
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private loadScreens(): void {
    let me = this,
      observable: Observable<ScreensModel>;
    observable = ScreensModel.retrieve<BaseModel, ScreensModel>(ScreensModel, me.rest,
        undefined, me.sorters, 0, RestService.pageSize);
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

  private onRefresh(): void {
    this.loadScreens();
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.records = [];
    this.dataset = undefined;
  }
}

