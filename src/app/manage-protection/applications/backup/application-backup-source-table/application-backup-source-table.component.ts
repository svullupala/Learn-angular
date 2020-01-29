import { Component, OnInit, Input, OnDestroy, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';
import { ErrorHandlerComponent } from 'shared/components';
import {RestService, SessionService} from 'core';
import { NvPairModel } from 'shared/models/nvpair.model';
import { FilterModel } from 'shared/models/filter.model';
import { BaseModel } from 'shared/models/base.model';
import { SelectorService } from 'shared/selector/selector.service';
import { selectorFactory, SelectorType } from 'shared/selector/selector.factory';
import { SorterModel } from 'shared/models/sorter.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { ApplicationService } from '../../shared/application.service';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { DatabaseGroupsModel } from '../../shared/databasegroups.model';
import { InstancesModel } from '../../shared/instances.model';
import { BaseApplicationModel } from '../../shared/base-application-model.model';
import { PartitionDisplayPipe } from './partition-display.pipe';

@Component({
  selector: 'application-backup-source-table',
  templateUrl: 'application-backup-source-table.component.html',
  providers: [
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.MULTIHIER}
  ]
})
export class ApplicationBackupSourceTableComponent implements OnInit, OnDestroy {

  @Input() applicationType: string;
  @Output() onSelectChangeEvent: EventEmitter<Array<BaseApplicationModel>>
    = new EventEmitter<Array<BaseApplicationModel>>();
  @Output() refreshSearchEvent = new EventEmitter<void>();
  @Output() sourceAdded: EventEmitter<BaseApplicationModel> = new EventEmitter<BaseApplicationModel>();
  public errorHandler: ErrorHandlerComponent;
  public view: NvPairModel;
  public filters: Array<FilterModel>;
  public paginateConfig: PaginateConfigModel;
  records: Array<BaseApplicationModel> = [];
  selectedAll: boolean = false;

  private processingRequestMsg: string;
  private standaloneText: string;
  private instanceText: string;
  private agText: string;
  private nameText: string;
  private textSelect: string;
  private slaPolicyText: string;
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private mask: boolean = false;
  private namePattern: string = '';

  constructor(private translate: TranslateService,
              private applicationService: ApplicationService,
              private selector: SelectorService<BaseModel>) {
    this.paginateConfig = new PaginateConfigModel({id: 'applicationbackup-table-pagination'});
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

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  loadData(isAlwaysOn: boolean = false, clearSelections: boolean = true): void {
    let me = this,
      crumb,
      crumbTitle;

    crumbTitle = isAlwaysOn ? me.agText : me.instanceText;
    // crumb = new BreadcrumbModel(crumbTitle, this.applicationService.getEcxApiEndpoint());
    // me.applicationService.resetBreadcrumbs(crumb);
    me.mask = true;

    me.applicationService.getApplications(this.applicationType, isAlwaysOn, undefined, 'hlo',
      me.paginateConfig.pageStartIndex(), me.paginateConfig.pageSize()).takeUntil(me.subs)
      .subscribe(
        (dataset: InstancesModel | DatabaseGroupsModel) => {
          me.mask = false;
          me.records = dataset.getRecords();
          me.paginateConfig.refresh(dataset.total);
          for (let i = 0; i < me.records.length; i++) {
            if (me.selector.isSelected(me.records[i])) {
              me.selector.deselect(me.records[i]);
              me.records[i].metadata['selected'] = true;
              me.onSelectChange(me.records[i]);
            }
          }
          clearSelections ? me.emptySelection() : me.retrieveSelection();
        },
        err => {
          me.mask = false;
          me.handleError(err);
        }
      );
  }

  dbSearch(applicationType: string, mode: string, payload, filters: Array<FilterModel>, isDbGroup: boolean): void {
    let title: string = isDbGroup ?  this.agText : this.instanceText, resourceTypes: [string] = [''];
      // crumb = new BreadcrumbModel(title,
      //   this.applicationService.getEcxApiEndpoint(applicationType, isDbGroup, 'recovery'));
    // this.applicationService.resetBreadcrumbs(crumb);
    this.mask = true;

    if (applicationType === 'office365'){
      this.namePattern = payload['location'].value;
      resourceTypes = ['folder'];
    }
    else {
      this.namePattern = payload['name'].value;
      resourceTypes = ['database'];
    }
    this.applicationService.dbSearch(applicationType, mode, payload, filters,
      this.paginateConfig.pageStartIndex(), RestService.pageSize, resourceTypes)
      .takeUntil(this.subs).subscribe(
      db => {
        this.mask = false;
        this.records = db.getRecords();
        this.paginateConfig.refresh(db.total);
        this.retrieveSelection();
      },
      err => {
        this.mask = false;
        this.handleError(err);
      }
    );
  }

  initMetadata(retrieveSelection?: boolean): void {
    let me = this,
      records = me.records as Array<BaseApplicationModel> || [];
    records.forEach(function (item) {
      item.metadata['selected'] = retrieveSelection ? me.selector.isSelected(item) : false;
    });
  }

  selectAll() {
    for (let i = 0; i < this.records.length; i++) {
      if (this.records[i].isBackupEligible()) {
        this.records[i].metadata['selected'] = this.selectedAll;
        this.onSelectChange(this.records[i]);
      }
    }
  }

  onRefresh() {
    let me = this,
      dbGroupView: boolean = me.view && me.view.value === 'databasegroupview';
      // crumb = me.applicationService.currentBreadcrumb();

    // if (me.applicationService.isDbSearch) {
    //   me.refreshSearchEvent.emit();
    // } else if (crumb.resource) {
    //   me.navigate(<any>crumb.resource,  undefined, false);
    // } else {
    //   me.loadData(dbGroupView, false);
    // }
    me.dbSearch(me.applicationType, 'hlo',
      {name: me.namePattern || ''}, me.filters,
      me.view.value === InstancesModel.DATABASE_GROUP_VIEW);
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];

    me.sorters = [
      new SorterModel('name', 'ASC')
    ];

    me.translate.get([
      'application.standaloneText',
      'application.textSelect',
      'application.textName',
      'application.textSlaPolicy',
      'application.instancesText',
      'application.agGroupText',
      'common.processingRequestMsg'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.nameText = resource['application.textName'];
      me.textSelect = resource['application.textSelect'];
      me.slaPolicyText = resource['application.textSlaPolicy'];
      me.standaloneText = resource['application.standaloneText'];
      me.processingRequestMsg = resource['common.processingRequestMsg'];
      me.instanceText = resource['application.instancesText'];
      me.agText = resource['application.agGroupText'];

      // me.loadData();
    });
  }

  onSelectChange(item: BaseApplicationModel): void {
    let me = this;
    if (item.metadata['selected'] === true) {
      me.selector.select(item);
      if (me.allSelected())
        me.selectedAll = true;
    } else {
      me.selector.deselect(item);
      me.selectedAll = false;
    }
    this.onSelectChangeEvent.emit(this.getValue());
  }

  setView(view: NvPairModel): void {
    this.view = view;
  }

  setFilters(filters: Array<FilterModel>): void {
    this.filters = filters;
  }

  canNavigate(item: BaseApplicationModel): boolean {
    if (item && (item.resourceType === 'applicationinstance' && item.type !== 'saphana' ||
      item.resourceType === 'databasegroup')) {
      return true;
    }
    return false;
  }

  onAddClick(source: BaseApplicationModel) {
    this.sourceAdded.emit(source);
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  extractNamePattern(): string {
    let namePattern = '',
      flts = this.filters || [],
      target = flts.find(function (item) {
        return item.property === 'name';
      });
    if (target)
      namePattern = target.value;
    return namePattern;
  }

  extractUnprotectedFlag(): boolean {
    let unprotectedFlag = false,
      flts = this.filters || [],
      target = flts.find(function (item) {
        return item.property === 'protectionInfo';
      });
    if (target)
      unprotectedFlag = target.op === 'NOT EXISTS';
    return unprotectedFlag;
  }

  navigate(item: any, event?: any, clearSelections: boolean = true) {
    let me = this, view;
    if (this.applicationType === 'sql' || this.applicationType === 'exch') {
      if (!me.filters) {
        me.filters = [new FilterModel('databaseGroupPk', undefined, 'NOT EXISTS')];
      }
    }
    if (me.canNavigate(item)) {
      if (me.view === undefined) {
        me.view = new NvPairModel(me.standaloneText, 'applicationview');
      }
      view = me.applicationService.navigate(item, me.view.value,
        me.filters, me.sorters);
      if (view) {

        me.mask = true;
        (view).takeUntil(me.subs).subscribe(
          (dataset: any) => {
            me.mask = false;
            me.records = dataset.getRecords();
            me.paginateConfig.refresh(dataset.total);

            clearSelections ? me.emptySelection() : me.retrieveSelection();
          },
          err => {
            me.mask = false;
            me.handleError(err);
          }
        );
      }
    }
  }

  hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  selectionCount(): number {
    return this.selector.count();
  }

  emptySelection(): void {
    this.selector.deselectAll();
    this.initMetadata();
    this.selectedAll = false;
    this.onSelectChangeEvent.emit(this.getValue());
  }

  retrieveSelection(): void {
    this.initMetadata(true);
    this.selectedAll = this.allSelected();
  }

  allSelected(): boolean {
    let me = this, idx = -1,
      records = me.records as Array<BaseModel> || [];
    idx = records.findIndex(function (item) {
      return !me.selector.isSelected(item);
    });
    return idx === -1;
  }

  getValue(): Array<BaseApplicationModel> {
    return <Array<BaseApplicationModel>>this.selector.selection();
  }

  private isInstance(item: BaseApplicationModel): boolean {
    return(item.resourceType || '').toLowerCase() === 'applicationinstance';
  }

  private isDatabase(item: BaseApplicationModel): boolean {
    return(item.resourceType || '').toLowerCase() === 'database';
  }

  private isFolder(item: BaseApplicationModel): boolean {
    return(item.resourceType || '').toLowerCase() === 'folder';
  }

  private dbTrackByFn(index: number, item: BaseApplicationModel) {
    return item && item.id;
  }

  private hideLogBackupCol(): boolean {
    return this.applicationType !== 'office365' || this.applicationService.isDbSearch || this.applicationService.isDbLevel;
  }

  private getResourceIcon(item: BaseApplicationModel): string {
    if (this.applicationType === 'office365') {
      if (this.isInstance(item))
        return 'fa fa-building';
      if (item.subType === 'mailbox')
        return 'ion-android-mail';
      if (item.subType === 'contacts')
        return 'ion-android-contacts';
      if (item.subType === 'calendar')
        return 'ion-android-calendar';
      if (item.subType === 'onedrive')
        return 'ion-upload';
      if (item.subType === 'user')
        return 'ion-android-person';
      return 'ion-android-mail';
    } else {
      if (this.isDatabase(item))
        return 'fa fa-database';
      if (this.isInstance(item))
        return 'fa fa-database';
      if (this.isFolder(item))
        return 'ion-android-folder';
      return 'fa fa-database';
    }
  }
}
