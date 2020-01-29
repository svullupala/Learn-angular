import { Component, OnInit, ViewChild } from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript/index';
import {Observable} from 'rxjs/Observable';
import {StorageBrowseService} from 'diskstorage/shared/storage-browse.service';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {StorageManageService} from 'diskstorage/shared/storage-manage.service';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {StorageModel} from 'diskstorage/shared/storage.model';
import {BaseModel} from 'shared/models/base.model';
import {StoragesModel} from 'diskstorage/shared/storages.model';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {DatasetModel} from 'shared/models/dataset.model';
import {StorageSnapshotModel} from 'diskstorage/shared/storage-snapshot.model';
import {SessionService} from 'core';
import {CatalogRestoreService} from './catalog-restore.service';
import {AlertType} from 'shared/components/msgbox/alert.component';
import {Sortable, SortUtil} from 'shared/util/sortable';
import { BaseModalComponent } from 'shared/components/base-modal/base-modal.component';
import {SiteService} from 'site/site.service';
import {SitesModel} from 'site/sites.model';
import {SiteModel} from 'site/site.model';

@Component({
  selector: 'catalog-restore',
  templateUrl: './catalog-restore.component.html',
  styleUrls: [],
  providers: [
    StorageBrowseService, StorageManageService, CatalogRestoreService, SiteService
  ]
})
export class CatalogRestoreComponent implements OnInit, Sortable {
  @ViewChild(BaseModalComponent) modal: BaseModalComponent;
  paginateConfig: PaginateConfigModel;
  filters: Array<FilterModel> = [new FilterModel('type', 'vsnap')];
  sorters: Array<SorterModel>;
  nameSort: SorterModel;
  selectedSnapshotForRestore: StorageSnapshotModel;
  creationTimeSort: SorterModel;
  slaPolicySort: SorterModel;
  snapshotTypeSort: SorterModel;
  records: Array<BaseModel>;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  breadcrumbs: Array<any>;

  private warningTitle: string;
  private confirmRestore: string;
  private textBackupStorage: string;
  private mask: boolean = false;
  private restoreType: string = 'test';
  private view: string = 'catalogBackup'; // change link name to include view
  private siteMap = [];

  constructor(private storageBrowseService: StorageBrowseService, private storageManageService: StorageManageService,
              private translate: TranslateService, private catalogRestoreService: CatalogRestoreService,
              private router: Router, private siteService: SiteService) {
    let paginationId: string = `catalog-restore-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId, pageSize: 50});
    this.breadcrumbs = this.storageBrowseService.breadcrumbs;
  }

  ngOnInit() {
    let me = this;

    // Initialize sorters.
    me.nameSort = new SorterModel('name', 'ASC');
    me.creationTimeSort = new SorterModel('creationTime', 'ASC');
    me.slaPolicySort = new SorterModel('slaPolicyName', 'DESC');
    me.snapshotTypeSort = new SorterModel('snapshotType', 'ASC');
    me.sorters = [me.creationTimeSort];

    me.translate.get([
      'common.warningTitle',
      'catalog.textConfirmRestore',
      'catalog.textRestoreWarning',
      'catalog.textBackupStorage',
    ])
      .subscribe((resource: Object) => {
        me.warningTitle = resource['common.warningTitle'];
        me.confirmRestore = resource['catalog.textRestoreWarning'];
        me.textBackupStorage = resource['catalog.textBackupStorage'];
        me.loadSites();
        me.loadData();
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  loadSites() {
    let me = this, newSite = new SiteModel();
    me.siteService.getAll()
      .subscribe(
        data => {
          let dataset = JsonConvert.deserializeObject(data, SitesModel);
          for (let item of <Array<SiteModel>> dataset.records){
            me.siteMap[item.id] = item.name;
          }
        },
        err => me.handleError(err)
      );
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  confirm(handler: Function) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.warningTitle, me.confirmRestore, AlertType.WARNING,
        handler, undefined, 3000, false, true);
    }
  }

  isAsc(name: string): boolean {
    return SortUtil.has(this.sorters, name, false);
  }

  isDesc(name: string): boolean {
    return SortUtil.has(this.sorters, name, true);
  }

  onSort(name: string): void {
    this.changeSorter(name);
    SortUtil.toggle(this.sorters, name);
    this.onRefresh();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    } else if (name === 'creationTime') {
      this.sorters = [this.creationTimeSort];
    } else if (name === 'slaPolicyName'){
      this.sorters = [this.slaPolicySort];
    } else if (name === 'snapshotType'){
      this.sorters = [this.snapshotTypeSort];
    }
  }

  loadData(resetPage: boolean = true): void {
    let me = this, crumb = new BreadcrumbModel(me.textBackupStorage, me.storageManageService.getEcxApiEndpoint());
    me.storageBrowseService.resetBreadcrumbs(crumb);

    if (resetPage)
      me.paginateConfig.reset();
    me.mask = true;
    me.storageManageService.getAll(me.filters, [me.nameSort], undefined,
      me.paginateConfig.pageStartIndex())
      .subscribe(
        data => {
          me.mask = false;
          let dataset = JsonConvert.deserializeObject(data, StoragesModel);
          me.records = dataset.records;
          // me.storageBrowseService.records = me.records;
          me.paginateConfig.refresh(dataset.total);
        },
        err => {
          me.mask = false;
          me.handleError(err);
        },
        () => {
          me.mask = false;
        }
      );
  }

  navigate(item: StorageModel, event?: any, resetPage: boolean = true) {
    let me = this, view;
    if (me.canNavigate(item)) {

      if (resetPage)
        me.paginateConfig.reset();

      me.mask = true;
      view = me.storageBrowseService.navigate(item, me.view,
       me.filters, me.sorters, me.paginateConfig.pageStartIndex());
      if (view) {
        (<Observable<DatasetModel<StorageSnapshotModel>>>view).subscribe(
          dataset => {
            me.mask = false;
            me.records = dataset.records;
            me.paginateConfig.refresh(dataset.total);
          },
          err => {
            me.mask = false;
            me.handleError(err);
          },
          () => {
            me.mask = false;
          }
        );
      } else {
        me.mask = false;
      }
    }
  }

  canNavigate(item: BaseModel): boolean {
    return item.hasLink(this.view);
  }

  initiateRestore(item: StorageSnapshotModel): void {
    let me = this;
    me.selectedSnapshotForRestore = item;
    me.modal.show();
  }

  onOptionRestoreClick(): void {
    this.modal.hide();
    this.confirm(() => {
      setTimeout(() => {
        this.mask = true;
        this.catalogRestoreService.initiateRestore(this.selectedSnapshotForRestore, this.restoreType)
          .subscribe(
            (next) => {
              this.router.navigate(['/pages/logout']);
            },
            (err) => {
              this.mask = false;
              this.handleError(err);
            }
          );
      }, 1000);
    });
  }

  onBreadcrumbClick(item: any, event?: any) {
    let me = this;
    if (item.resource) {
        me.navigate(item.resource, event);
      } else
        me.loadData();
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    let me = this, crumb = me.storageBrowseService.currentBreadcrumb();
    if (crumb) {
      if (crumb.resource)
        me.navigate(<StorageModel>crumb.resource, undefined, false);
      else
        me.loadData(false);
    }
  }

  private isSnapshot(item: BaseModel): boolean {
    return item && item.resourceType === 'snapshot';
  }

  private resetRestoreType(): void {
    this.restoreType = 'test';
  }
}
