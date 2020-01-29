import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { FilterModel } from 'shared/models/filter.model';
import { TranslateService } from '@ngx-translate/core';
import { AppServerService } from 'appserver/appserver.service';
import { AppServersModel } from 'appserver/appservers.model';
import { AppServerModel } from 'appserver/appserver.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';

@Component({
  selector: 'resource-group-appserver-selector',
  templateUrl: './resource-group-appserver-selector.component.html',
  styleUrls: ['../../resource-groups.scss'],
  providers: [AppServerService]
})

export class ResourceGroupAppserverSelectorComponent implements OnInit, OnDestroy {
  private applicationType: string;
  private textSql: string;
  private textOracle: string;
  private textDb2: string;
  private textMongo: string;
  private textExchange: string;
  private textExchangeOnline: string;
  private textNotAvailable: string;
  private subs: Subject<void> = new Subject<void>();
  private dataset: DatasetModel<AppServersModel>;
  private paginateConfig: PaginateConfigModel;
  private filters: Array<FilterModel> = [];
  private records: Array<AppServerModel> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private resourceType: string = ResourceGroupsService.APP_SERVER_TYPE;
  private allRbacPath: string = ResourceGroupsService.ALL_APP_SERVER_RBAC_PATH;
  private allAddItem: ResourceGroupSelectionModel;
  private textAll: string;
  private textApplicationServer: string;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private translate: TranslateService,
              private resourceGroupsService: ResourceGroupsService,
              private appserverService: AppServerService) {
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
    me.translate.get([
      'application.textSql',
      'application.textOracle',
      'application.textDb2',
      'application.textMongoDb',
      'application.textExchange',
      'application.textExchangeOnline',
      'resourceGroups.textApplicationServers',
      'resourceGroups.textAll',
      'common.textNotAvailable'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.textSql = resource['application.textSql'];
      me.textOracle = resource['application.textOracle'];
      me.textDb2 = resource['application.textDb2'];
      me.textMongo = resource['application.textMongoDb'];
      me.textExchange = resource['application.textExchange'];
      me.textExchangeOnline = resource['application.textExchangeOnline'];
      me.textNotAvailable = resource['common.textNotAvailable'];
      me.textApplicationServer = resource['resourceGroups.textApplicationServers'];
      me.textAll = resource['resourceGroups.textAll'];
      me.allAddItem = me.resourceGroupsService.createAllItem(me.allRbacPath, me.textAll, [me.textApplicationServer]);
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

  private loadData(): void {
    let me = this,
        crumb,
        title;
    me.filters = [new FilterModel('applicationType', me.applicationType)];
    me.mask();
    me.appserverService.getAppservers(me.filters).takeUntil(me.subs)
      .subscribe(
        dataset => {
          me.records = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.dataset = dataset;
          if (me.resourceType === ResourceGroupsService.APP_SERVER_TYPE) {
            title = me.applicationType === 'oracle'
              ? me.textOracle
              : me.applicationType === 'sql' ? me.textSql
                : me.applicationType === 'db2' ? me.textDb2
                  : me.applicationType === 'mongo' ? me.textMongo
                    : me.applicationType === 'exch' ? me.textExchange
                      : me.applicationType === 'office365' ? me.textExchangeOnline
                        : me.textNotAvailable;
            crumb = new BreadcrumbModel(title, me.dataset.url);
            me.breadcrumbs = me.resourceGroupsService.resetBreadcrumbs(me.breadcrumbs, crumb);
          }
          me.unmask();
        },
        err => me.handleError(err)
      );
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
    this.applicationType = undefined;
  }
}

