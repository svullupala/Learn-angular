import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { ApplicationService } from '../../shared/application.service';
import { InstancesModel } from '../../shared/instances.model';
import { Subject } from 'rxjs/Subject';
import { SelectorService } from 'shared/selector/selector.service';
import { selectorFactory, SelectorType } from 'shared/selector/selector.factory';
import { NvPairModel } from 'shared/models/nvpair.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { ErrorHandlerComponent } from 'shared/components/error-handler';
import { AlertComponent } from 'shared/components/msgbox';
import { FilterModel } from 'shared/models/filter.model';
import { SorterModel } from 'shared/models/sorter.model';
import { BaseModel } from 'shared/models/base.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { RestService, SessionService } from 'core';
import { DatasetModel } from 'shared/models/dataset.model';
import { BaseApplicationModel } from '../../shared/base-application-model.model';
import { VersionModel } from '../../shared/version.model';
import { ApplicationRestoreItem } from '../application-list-table/application-list-table.component';
import { ApplicationRestoreService } from 'applications/restore/application-restore.service';
import { DatabaseModel } from 'applications/shared/database.model';

@Component({
  selector: 'application-restore-source-table',
  templateUrl: './application-restore-source-table.component.html',
  styleUrls: ['./application-restore-source-table.component.scss'],
  providers: [
    { provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType] },
    { provide: SelectorType, useValue: SelectorType.SIMPLE },
  ]
})
export class ApplicationRestoreSourceTableComponent implements OnInit, OnDestroy {
  @Input() applicationType: string = 'none';
  @Input() view: NvPairModel;
  @Input() filters: Array<FilterModel>;
  @Output('addClick') addClickEvent = new EventEmitter<ApplicationRestoreItem>();
  @Output() refreshSearchEvent = new EventEmitter<void>();

  records: Array<any>;
  paginateConfig: PaginateConfigModel;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  private instance: BaseApplicationModel;
  private subs: Subject<void> = new Subject<void>();
  private namePattern: string = '';
  private processingRequestMsg: string;
  private textInstances: string;
  private textAgg: string;
  private sorters: Array<SorterModel>;
  private masked: boolean = false;
  private isDbGroup: boolean = false;

  constructor(private applicationService: ApplicationService,
    private applicationRestoreService: ApplicationRestoreService,
    private translate: TranslateService,
    private selector: SelectorService<BaseModel>) {
    let paginationId: string = `application-restore-source-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({ id: paginationId });
  }

  private get isDbLevel(): boolean {
    return this.applicationService && this.applicationService.isDbLevel;
  }

  private get isDbSearch(): boolean {
    return this.applicationService && this.applicationService.isDbSearch;
  }

  private get isDb2(): boolean {
    return this.applicationType === 'db2';
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  loadData(isDbGroup: boolean = false): void {
    let me = this,
      title: string = isDbGroup ? me.textAgg : me.textInstances,
      crumb = new BreadcrumbModel(title,
        me.applicationService.getEcxApiEndpoint(me.applicationType, isDbGroup, 'recovery'));
    me.applicationService.resetBreadcrumbs(crumb, this.applicationType);
    me.paginateConfig.reset();
    me.isDbGroup = isDbGroup;
    me.mask();
    me.applicationService.getApplications(me.applicationType,
      isDbGroup, undefined, 'recovery',
      me.paginateConfig.pageStartIndex()).takeUntil(me.subs)
      .subscribe(
        data => {
          let dataset = data;
          me.records = dataset.records;
          me.applicationService.records = me.records;
          me.paginateConfig.refresh(dataset.total);
          me.unmask();
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    let me = this, crumb = me.applicationService.currentBreadcrumb();
    if (crumb) {
      if (me.applicationService.isDbSearch) {
        me.refreshSearchEvent.emit();
      } else if (crumb.resource) {
        me.navigate(<any>crumb.resource, undefined, false);
      } else {
        me.loadData(me.isDbGroup);
      }
    }
  }

  initMetadata(resource: any): void {
    let me = this,
      versions;
    if (me.selector.isSelected(resource)) {

      let selection = me.selector.selection() as Array<any>,
        targetResource = selection.find(function (item) {
          return item.getId() === resource.getId();
        }), targetSnapshot;

      if (targetResource) {
        targetSnapshot = targetResource.versions.find(function (item) {
          return item.metadata['selected'] === true;
        });
      }
      versions = resource.versions as Array<BaseModel> || [];
      versions.forEach(function (version) {
        let selected = targetSnapshot && targetSnapshot.getId() === version.getId();
        version.metadata['selected'] = selected;
        if (selected) {
          resource.metadata['version'] = version;
        }
      });
    }
    resource.metadata['snapshotLoaded'] = true;
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
      'application.agGroupText',
      'application.instancesText'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.processingRequestMsg = resource['common.processingRequestMsg'];
      me.textInstances = resource['application.instancesText'];
      me.textAgg = resource['application.agGroupText'];

      me.loadData(me.isDbGroupView());
    });
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  setView(view: NvPairModel): void {
    this.view = view;
    this.namePattern = '';
  }

  canNavigate(item: any): boolean {
    let me = this, view = (this.view && this.view.value) || InstancesModel.APPLICATION_VIEW;
    return item.hasLink(view);
  }

  extractNamePattern(): string {
    return this.namePattern;
  }

  navigate(item: any, event?: any, resetPage: boolean = true, isDbGroup = false) {
    let me = this,
      linkView = (me.view && me.view.value) || InstancesModel.APPLICATION_VIEW,
      view;
    if (this.applicationType === 'sql' || this.applicationType === 'exch') {
      if (!me.filters || me.filters.length === 0) {
        me.filters = [new FilterModel('databaseGroupPk', undefined, 'NOT EXISTS')];
      }
    }
    if (me.canNavigate(item)) {
      me.instance = item;
      me.mask();
      if (resetPage)
        me.paginateConfig.reset();
      view = me.applicationService.navigate(item, linkView, me.filters, me.sorters);
      if (view) {
        (<Observable<DatasetModel<BaseApplicationModel>>>view).takeUntil(me.subs)
          .subscribe(
            dataset => {
              me.records = dataset.records;
              // Add partitions/osType info if the record is Database and its partitions/osType is empty.
              (me.records || []).forEach(function (record) {
                if (record instanceof DatabaseModel) {
                  if (!record.partitions || record.partitions.length < 1)
                    record.partitions = me.instance.partitions;
                  if (!record.osType)
                    record.osType = me.instance.osType;
                }
              });
              me.paginateConfig.refresh(dataset.total);
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

  onAddClick(resource: BaseApplicationModel): void {
    let me = this,
      restoreItem: ApplicationRestoreItem =
        new ApplicationRestoreItem(resource, resource.metadata['version']);
    if (me.instance) {
      restoreItem.instanceVersion = me.instance.version;
      restoreItem.instanceId = me.instance.id;
    }
    me.addClickEvent.emit(restoreItem);
  }

  onSelectChange(resource: BaseApplicationModel, version: VersionModel): void {
    let me = this;
    resource.versions.forEach(function (item) {
      item.metadata['selected'] = false;
    });
    version.metadata['selected'] = true;
    // Reselect the resource to update the associated snapshot.
    resource.metadata['version'] = version;
    me.selector.deselect(resource);
    me.selector.select(resource);
    me.onAddClick(resource);
  }

  dbSearch(applicationType: string, mode: string, payload, filters: Array<FilterModel>, isDbGroup: boolean): void {
    let title: string = isDbGroup ? this.textAgg : this.textInstances, resourceTypes,
      crumb = new BreadcrumbModel(title,
        this.applicationService.getEcxApiEndpoint(applicationType, isDbGroup, 'recovery'));
    this.applicationService.resetBreadcrumbs(crumb);
    this.masked = true;
    this.selector.deselectAll();

    if (applicationType === 'office365') {
      resourceTypes = ['folder'];
    }
    else {
      resourceTypes = ['database'];
    }

    this.applicationService.dbSearch(applicationType, mode, payload, filters, this.paginateConfig.pageStartIndex(),
      RestService.pageSize, resourceTypes)
      .takeUntil(this.subs).subscribe(
        db => {
          this.instance = undefined;
          this.masked = false;
          this.records = db.getRecords();
          this.paginateConfig.refresh(db.total);
          this.emptySelection();
        },
        err => {
          this.masked = false;
          this.handleError(err);
        }
      );
  }

  hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  emptySelection(): void {
    this.selector.deselectAll();
  }

  getValue(): Array<BaseApplicationModel> {
    return <Array<BaseApplicationModel>>this.selector.selection();
  }

  private isInstance(item: BaseApplicationModel): boolean {
    return (item.resourceType || '').toLowerCase() === 'applicationinstance';
  }

  private isDatabase(item: BaseApplicationModel): boolean {
    return (item.resourceType || '').toLowerCase() === 'database';
  }

  private isFolder(item: BaseApplicationModel): boolean {
    return (item.resourceType || '').toLowerCase() === 'folder';
  }

  private getResourceIcon(item: BaseApplicationModel) {
    if (this.applicationType === 'office365') {
      if (this.isInstance(item)) {
        return 'fa fa-building';
      }
      if (item.subType === 'mailbox') {
        return 'ion-android-mail';
      }
      if (item.subType === 'contacts') {
        return 'ion-android-contacts';
      }
      if (item.subType === 'calendar') {
        return 'ion-android-calendar';
      }
      if (item.subType === 'onedrive') {
        return 'ion-upload';
      }
      if (item.subType === 'user') {
        return 'ion-android-person';
      }
      return 'ion-android-mail';
    } else {
      if (this.isDatabase(item)) {
        return 'fa fa-database';
      }
      if (this.isInstance(item)) {
        return 'fa fa-database';
      }
      if (this.isFolder(item)) {
        return 'ion-android-folder';
      }
      return 'fa fa-database';
    }
  }

  private onUseLatestClick(item: BaseApplicationModel): void {
    if (item && item.metadata && item.metadata['version']) {
      item.metadata['version'] = undefined;
      this.selector.deselect(item);
      this.selector.select(item);
    }
    this.onAddClick(item);
  }

  private isDbGroupView(): boolean {
    let me = this, view = me.view;
    return (view && view.value === InstancesModel.DATABASE_GROUP_VIEW);
  }
}
