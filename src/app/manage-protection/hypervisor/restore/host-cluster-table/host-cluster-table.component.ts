import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {HasPersistentJson, SessionService} from 'core';
import {HypervisorModel} from '../../shared/hypervisor.model';
import {HypervisorManageService} from '../../shared/hypervisor-manage/hypervisor-manage.service';
import {SelectorService} from 'shared/selector/selector.service';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {selectorFactory, SelectorType} from 'shared/selector/selector.factory';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {BaseHypervisorModel} from '../../shared/base-hypervisor.model';
import {HypervisorsModel} from '../../shared/hypervisors.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {HostClusterBrowseService} from './host-cluster-browse.service';
import {HostModel} from '../../shared/host.model';
import {HostsModel} from '../../shared/hosts.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {HypervisorRestoreService} from '../hypervisor-restore.service';
import {Subscription} from 'rxjs/Subscription';
import {VmRecoveryPointsService} from '../../shared/vmrecoverypoints.service';
import {NvPairModel} from 'shared/models/nvpair.model';
import {ClusterModel} from '../../shared/cluster.model';
import {ClustersModel} from '../../shared/clusters.model';
import {BaseModalComponent} from 'shared/components/base-modal/base-modal.component';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {IdentityUserModel} from 'identity/shared/identity-user.model';
import {IdentityUserEnterSelectComponent} from 'identity/shared/identity-user-enter-select';
import {CloudService} from 'cloud/cloud.service';
import {CloudsModel} from 'cloud/clouds.model';
import {HypervisorBrowseService} from 'hypervisor/shared/hypervisor-browse.service';
import {DatacentersModel} from 'hypervisor/shared/datacenters.model';

export class HostUserModel {
  public user: IdentityUserModel;
  public host: HostModel;
}

export class TargetModel implements HasPersistentJson {
  public name: string;
  public resourceType: string;
  public href: string;
  public userHref: string;

  constructor(name: string, resourceType: string, href: string) {
    this.name = name || '';
    this.resourceType = resourceType || '';
    this.href = href || '';
  }

  public getPersistentJson() {
    return {
      target: {
        name: this.name,
        resourceType: this.resourceType,
        href: this.href,
        user: this.userHref
      }
    };
  }
}

@Component({
  selector: 'host-cluster-table',
  templateUrl: './host-cluster-table.component.html',
  styleUrls: ['./host-cluster-table.component.scss'],
  providers: [
    HostClusterBrowseService,
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})

export class HostClusterTableComponent implements OnInit, OnDestroy {
  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Input() isEdit: boolean = false;
  @Input() target: TargetModel;
  @Input() enableEsxUser: boolean = false;
  @Output() hostSelected = new EventEmitter<any>();
  @ViewChild('hostclusterradionbtn') hostClusterRadionBtn: ElementRef;
  @ViewChild(BaseModalComponent) modal: BaseModalComponent;
  @ViewChild(IdentityUserEnterSelectComponent) identityComponent: IdentityUserEnterSelectComponent;
  @ViewChild(SdlSearchBarComponent) sdlSearchBar: SdlSearchBarComponent;

  public breadcrumbs: Array<any>;
  private identityModel: IdentityUserEnterSelectModel;
  private views: Array<NvPairModel> = [];
  private view: NvPairModel;
  private records: Array<any>;
  private paginateConfig: PaginateConfigModel;
  private errorHandler: ErrorHandlerComponent;
  private errorTitle: string;
  private textHost: string;
  private textClusters: string;
  private textConfirm: string;
  private textSwitchView: string;
  private textSearchFor: string;
  private errorSelectOneHostOrClusterMsg: string;
  private alert: AlertComponent;
  private filters: Array<FilterModel>;
  private translateSub: Subscription;
  private getPreviousSelectionSub: Subscription;
  private processingRequestMsg: string;
  private textServers: string;
  private textEsxHosts: string;
  private sorters: Array<SorterModel>;
  private masked: boolean = false;
  private searchPattern: string = undefined;

  constructor(private vcmService: HypervisorManageService,
              private translate: TranslateService,
              private vmService: VmRecoveryPointsService,
              private cloudService: CloudService,
              private restoreService: HypervisorRestoreService,
              private hostClusterService: HypervisorBrowseService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `hostcluster-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
    this.breadcrumbs = this.hostClusterService.breadcrumbs;
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
    if (this.getPreviousSelectionSub) {
      this.getPreviousSelectionSub.unsubscribe();
    }
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  alertErr(errMsg?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.errorTitle, errMsg || me.errorSelectOneHostOrClusterMsg, AlertType.ERROR);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler, discardHandler);
  }

  loadData(resetPage: boolean = true): void {
    let me = this, crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());

    if (resetPage) {
      me.hostClusterService.resetBreadcrumbs(crumb);
      me.paginateConfig.reset();
    }

    me.mask();
    if (!this.isAwsec2()){
      me.vcmService.getAll(me.mergeTypeFilter(me.filters, true), me.sorters, 'hlo',
        me.paginateConfig.pageStartIndex())
        .subscribe(
          data => {
            // Cast the JSON object to HypervisorsModel instance.
            let dataset = JsonConvert.deserializeObject(data, HypervisorsModel);
            let items = dataset.records;
            me.records = items;
            me.hostClusterService.records = me.records;
            me.paginateConfig.refresh(dataset.total);
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
    else {
      this.cloudService.getAll(me.getCloudFilters(), me.sorters, 'hlo',
        me.paginateConfig.pageStartIndex()).
      subscribe(
        (data: CloudsModel) => {
          let dataset = JsonConvert.deserializeObject(data, CloudsModel);
          me.records = dataset.records;
          me.hostClusterService.records = me.records;
          me.paginateConfig.refresh(dataset.total);
          me.unmask();
        },
        (err) => {
          this.handleError(err);
          me.unmask();
        },
        () => {
          me.emptySelection();
        }
      );
    }
  }

  public ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];

    me.translateSub = me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.typeText',
      'common.typeText',
      'common.errorTitle',
      'common.textConfirm',
      'hypervisor.textSelectOneHostOrCluster',
      'hypervisor.textEsxHosts',
      'hypervisor.textSwitchView',
      'hypervisor.textHost',
      'hypervisor.textClusters',
      'hypervisor.textSearchFor',
      'awsec2.textAccounts',
      'hyperv.textServers',
      'vmware.textVCenters'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textServers = me.isAwsec2() ? resource['awsec2.textAccounts'] : me.isHyperV() ?
          resource['hyperv.textServers'] : resource['vmware.textVCenters'];
        me.errorTitle = resource['common.errorTitle'];
        me.errorSelectOneHostOrClusterMsg = resource['hypervisor.textSelectOneHostOrCluster'];
        me.textHost = resource['hypervisor.textHost'];
        me.textClusters = resource['hypervisor.textClusters'];
        me.textConfirm = resource[ 'common.textConfirm'];
        me.textSwitchView = resource['hypervisor.textSwitchView'];
        me.textEsxHosts = resource['hypervisor.textEsxHosts'];
        me.textSearchFor = resource['hypervisor.textSearchFor'];

        me.views.push(new NvPairModel(me.textHost, 'hosts'),
          new NvPairModel(me.textClusters, 'clusters'));
        me.view = me.views[0];
        if (this.isAwsec2()) {
          me.view = new NvPairModel('', 'datacenters');
        }
        me.identityModel = new IdentityUserEnterSelectModel();
        if (me.target) {
          me.playbackHostClusterSelection(me.target);
        } else {
          me.loadData();
        }
      });
  }


  public hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  public emptySelection(): void {
    this.selector.deselectAll();
  }

  public getValue(): object {
    let item = this.selector.selection()[0],
      target: TargetModel,
      payload: any;
    if (item !== undefined) {
      target = new TargetModel(item.name, item.resourceType, item.url);
      if (this.enableEsxUser) {
        target.userHref = this.identityModel.user ? this.identityModel.user.url : this.identityModel.userHref;
      }
      payload = target.getPersistentJson();
    // } else if (this.target !== undefined) {
    //   payload = this.target.getPersistentJson();
    } else {
      payload = false;
      // this.alertErr();
    }
    return payload;
  }

  public playbackHostClusterSelection(target: TargetModel) {
    let me = this,
        crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.hostClusterService.resetBreadcrumbs(crumb);
    if (target) {
      me.mask();
      me.getPreviousSelectionSub = me.vmService.getByUrl(target.href)
        .subscribe (
          data => {
            let item: HostModel | ClusterModel;
            if (data['resourceType'] === 'host') {
              item = JsonConvert.deserializeObject(data, HostModel);
              // only two items in this array host or cluster
              me.view = me.views[0];
            } else if (data['resourceType'] === 'cluster') {
              item = JsonConvert.deserializeObject(data, ClusterModel);
              me.view = me.views[1];
            }
            if (target.userHref) {
              me.identityModel = new IdentityUserEnterSelectModel();
              me.identityModel.userHref = target.userHref;
              if (me.identityComponent) {
                if (me.identityComponent.isLoading) {
                  let subscriber = me.identityComponent.loadedUserEvent.subscribe(() => {
                      me.identityModel.user = me.identityComponent.getUser(me.identityModel.userHref);
                      subscriber.unsubscribe();
                    });
                } else {
                  me.identityModel.user = me.identityComponent.getUser(me.identityModel.userHref);
                }
              }
              me.identityModel.useExisting = true;
            }
            if (item) {
              me.pushBreadcrumbBasedOnLocation(item);
              if (!me.loadUpLink(item)) {
                // Fall back once loading up link failed.
                me.records = [item];
                me.paginateConfig.refresh(1); // only going to be one item
                me.onSelect(item);
              }
            }
            me.unmask();
          },
          err => {
            me.unmask();
            me.handleError(err);
          }
        );
    }
  }

  public setFilters(filters: Array<FilterModel>): void {
    this.filters = filters;
  }

  private isSearch(): boolean {
    return this.searchPattern !== undefined;
  }

  private onClearSearch(): void {
    let me = this, crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.searchPattern = undefined;
    me.hostClusterService.resetBreadcrumbs(crumb);
    this.loadData();
  }

  private resetSearch(namePattern: string): void {
    let me = this, crumb = new BreadcrumbModel(me.textServers, me.vcmService.getEcxApiEndpoint());
    me.paginateConfig.reset ();
    me.searchPattern = namePattern;
    me.hostClusterService.resetBreadcrumbs(crumb);
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
    me.mask ();
    me.hostClusterService.search(me.searchPattern, me.hypervisorType, 'hlo', me.paginateConfig.pageStartIndex(),
      me.filters, me.paginateConfig.pageSize(), me.getResourceType()).subscribe(
        data => {
          let dataset = JsonConvert.deserializeObject(data, me.getResourceTypeDatasetClass());
          me.records = dataset.records;
          me.hostClusterService.records = me.records;
          me.paginateConfig.refresh(dataset.total);
          me.unmask();
        },
        err => {
          me.unmask();
          me.handleError (err);
        },
        () => {
          me.emptySelection ();
        }
      );
  }


  private getResourceType(): string {
    return this.view.value.substring(0, this.view.value.length - 1);
  }

  private getResourceTypeDatasetClass(): any {
    return this.getResourceType() === 'datacenter' ? DatacentersModel : this.getResourceType() === 'cluster' ? ClustersModel : HostsModel;
  }

  private pushBreadcrumbBasedOnLocation(item: HostModel | ClusterModel): void {
    let me = this, strArray: string[], title: string, location: string = item.location,
      model: HypervisorModel,
      link = item.getLink('up');
    if (location) {
      strArray = location.split('/');
      if (strArray && strArray.length > 1)
        title = strArray[1];
      if (title) {
        model = new HypervisorModel(me.hypervisorType);
        model.links = model.links || {};
        if (link) {
          model.links['hosts'] = {
            href: link.href,
            rel: 'related'
          };
        }
        me.breadcrumbs.push(new BreadcrumbModel(title, link ? link.href : '', model));
      }
    }
  }

  private loadUpLink(item: HostModel | ClusterModel): boolean {
    let me = this, observable: Observable<HostsModel | ClustersModel>;

    item.proxy = item.proxy || me.vcmService.proxy;
    if (item instanceof HostModel)
      observable = item.getDataset<HostModel, HostsModel>(HostsModel, 'up', undefined, undefined, 0);
    else
      observable = item.getDataset<ClusterModel, ClustersModel>(ClustersModel, 'up', undefined, undefined, 0);
    if (observable)
      observable.subscribe(
        dataset => {
          let records = dataset ? dataset.records || [] : [],
            target = records.find(function (record) {
              return item.equals(record);
            });
          if (!target) {
            if (records.length > 0)
              records[0] = item;
            else
              records.push(item);
            target = item;
          }
          me.records = records;
          me.paginateConfig.refresh(dataset ? dataset.total || records.length : records.length);
          me.onSelect(target);
        },
        err => me.handleError(err)
      );
    return !!observable;
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  private onRefresh(): void {
    let me = this, crumb = me.hostClusterService.currentBreadcrumb();
    if (me.searchPattern) {
      me.search();
    } else {
      if (crumb) {
        if (crumb.resource)
          me.navigate(<HypervisorModel>crumb.resource, undefined, false);
        else
          me.loadData(false);
      }
    }
  }

  private isSelected(item): boolean {
    return this.selector.isSelected(item);
  }

  private canSelect(item): boolean {
    if (item && (item.resourceType === 'host' || item.resourceType === 'cluster' || item.resourceType === 'datacenter')) {
      return !(this.enableEsxUser && item.cloudType);
    }
    return false;
  }

  private canNavigate(item: BaseHypervisorModel, link: string): boolean {
    if (item && typeof item.hasLink === 'function') {
      return item && item.hasLink(link);
    }
  }

  private onBreadcrumbClick(item: any, event?: any): void {
    let me = this;

    me.sdlSearchBar.reset();

    if (item && item.resource) {
      return;
    }
      // me.setFilters(me.filters);
    me.loadData();
  }

  private canNavigateBreadCrumb(item: BreadcrumbModel) {
    return !(item && item.resource);
  }

  private onViewClick(item: NvPairModel) {
    let me = this, oldView: NvPairModel = this.view;
    if (me.hasSelection()) {
      me.confirm(this.textSwitchView, () => {
        me.view = item;
        (me.searchPattern) ? me.resetSearch(this.searchPattern) : me.loadData();
      }, () => {
        me.view = oldView;
      });
    } else {
      if (me.view.value !== item.value) {
        me.view = item;
        (me.searchPattern) ? me.resetSearch(this.searchPattern) : this.loadData();
      }
    }
  }

  private navigate(item: BaseHypervisorModel, event?: any,
                   resetPage: boolean = true, type?: string) {
    let me = this,
        link = type ? type.concat('s') : me.view && me.view.value,
        view;
    if (me.canNavigate(item, link)) {
      me.mask();

      if (resetPage)
        me.paginateConfig.reset();

      view = me.hostClusterService.navigate(item, link,
        me.mergeTypeFilter(me.filters, false), me.sorters, me.paginateConfig.pageStartIndex());
      if (view) {
        (<Observable<DatasetModel<BaseHypervisorModel>>>view).subscribe(
          dataset => {
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
            me.emptySelection();
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

  private onUserSave(): void {
    let model: HostUserModel = new HostUserModel();
    if (this.modal) {
      if (this.identityModel.useExisting) {
        model.host = this.selector.selection()[0] as HostModel;
        model.user = this.identityModel.user;
        this.restoreService.updateDestinationEsxSelection(model);
        this.modal.hide();
      } else {
        if (this.identityComponent) {
          this.identityComponent.createUser();
        }
      }
    }
  }

  private onCreatedUserCallback(user: IdentityUserModel): void {
    let model: HostUserModel = new HostUserModel();
    this.identityModel.user = user;
    model.host = this.selector.selection()[0] as HostModel;
    model.user = this.identityModel.user;
    this.restoreService.updateDestinationEsxSelection(model);
    this.modal.hide();
  }

  private isUserValid(): boolean {
    if (this.identityComponent) {
      return this.identityComponent.isValid();
    }
    return false;
  }

  private onSelect(item: BaseHypervisorModel): void {
    let me = this;

    if (me.selector) {
      me.emptySelection();
      me.selector.select(item);
    }
    if (me.enableEsxUser) {
      if (me.isEdit) {
        me.onUserSave();
      } else {
        me.modal.show();
      }
    } else {
      me.hostSelected.emit(item);
      me.restoreService.updateDestinationHostClusterSelection(item);
    }
  }

  private mergeTypeFilter(filters: Array<FilterModel>, isRoot: boolean): Array<FilterModel> {
    return (filters || []).concat(isRoot ? [new FilterModel('type', this.hypervisorType)] : []);
  }

  private getCloudFilters() {
    let filters = [];
    filters.push(new FilterModel('provider', 'sp', 'NOT IN'));
    if (!this.isAwsec2()) {
      filters.push(new FilterModel('type', 'compute', 'NOT IN'));
    } else {
      filters.push(new FilterModel('type', 'compute', '='));
    }
    return filters;
  }

  private isHypervisor(item: BaseHypervisorModel): boolean {
    return (item.resourceType || '').toLowerCase() === 'hypervisor';
  }

  private isAwsec2(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_AWSEC2;
  }

  private isCluster(item: any): boolean {
    return (item.resourceType || '').toLowerCase() === 'cluster';
  }

  private isHost(item: HostModel): boolean {
    return (item.resourceType || '').toLowerCase() === 'host';
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }
}
