import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResourceGroupModel } from '../resource-group.model';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { SorterModel } from 'shared/models/sorter.model';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import {JsonConvert} from 'json2typescript/index';
import { TranslateService } from '@ngx-translate/core';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import {SlapolicyService} from 'slapolicy/shared/slapolicy.service';
import {SlapoliciesModel} from 'slapolicy/shared/slapolicies.model';

@Component({
  selector: 'resource-group-slapolicy-selector',
  templateUrl: './resource-group-slapolicy-selector.component.html',
  styleUrls: ['../../resource-groups.scss'],
  providers: [SlapolicyService]
})

export class ResourceGroupSlapolicySelectorComponent implements OnInit, OnDestroy {
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private dataset: DatasetModel<any>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<any> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private addAllItem: ResourceGroupSelectionModel;
  private textAll: string;
  private textSlaPolicy: string;
  private resourceType: string = ResourceGroupsService.SLAPOLICY_TYPE;
  private allRbacPath: string = ResourceGroupsService.ALL_SLA_RBAC_PATH;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService,
              private slaPolicyService: SlapolicyService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-slapolicy-table-pagination-${(new Date()).valueOf()}`;
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
      'resourceGroups.textSlaPolicy']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textSlaPolicy = resource['resourceGroups.textSlaPolicy'];
        me.textAll = resource['resourceGroups.textAll'];
        me.addAllItem = me.resourceGroupsService.createAllItem(me.allRbacPath, me.textAll, [me.textSlaPolicy]);
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

  private onRefresh(): void {
    this.loadData();
  }

  private loadData(): void {
    let me = this;

    me.mask();
    me.slaPolicyService.getSLAPolicies(undefined, me.sorters,
      me.paginateConfig.pageStartIndex()).takeUntil(me.subs)
      .subscribe(
        data => {
          let dataset = JsonConvert.deserializeObject(data, SlapoliciesModel);
          me.records = dataset.records;
          me.dataset = dataset;
          me.paginateConfig.refresh(dataset.total);
          me.unmask();
        },
        err => me.handleError(err)
      );
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

