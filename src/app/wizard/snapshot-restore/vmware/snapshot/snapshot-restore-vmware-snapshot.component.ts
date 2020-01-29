import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreVmwareModel} from '../snapshot-restore-vmware.model';
import {RestoreItem} from 'app/manage-protection/hypervisor/restore';
import {NvPairModel} from 'shared/models/nvpair.model';
import {SitesModel} from 'app/system-configuration/site/sites.model';
import {SiteModel} from 'app/system-configuration/site/site.model';
import {CloudsModel} from 'app/system-configuration/backup-storage/cloud/clouds.model';
import {CloudModel} from 'app/system-configuration/backup-storage/cloud/cloud.model';
import {StoragesModel} from 'app/system-configuration/backup-storage/disk-storage/shared/storages.model';
import {StorageModel} from 'app/system-configuration/backup-storage/disk-storage/shared/storage.model';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {BaseModel} from 'shared/models/base.model';
import {BaseHypervisorModel} from 'app/manage-protection/hypervisor/shared/base-hypervisor.model';
import {
  CopyOffloadInfo,
  CopyOffloadInfoEx,
  SnapshotModel
} from 'app/manage-protection/hypervisor/shared/snapshot.model';
import {VmRecoveryPointsService} from 'app/manage-protection/hypervisor/shared/vmrecoverypoints.service';
import {SessionService} from 'core';
import {HypervisorRestoreSelectionTableComponent}
  from 'app/manage-protection/hypervisor/restore/hypervisor-restore-selection-table';
import {BsDaterangepickerDirective} from 'ngx-bootstrap/datepicker';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {LocaleService} from 'shared/locale.service';
import {BsDatepickerState} from 'ngx-bootstrap/datepicker/reducer/bs-datepicker.state';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {HypervisorSingleSourceSnapshotSelectionComponent} from 'hypervisor/restore/hypervisor-single-source-snapshot-selection/hypervisor-single-source-snapshot-selection.component';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'snapshot-restore-vmware-snapshot',
  templateUrl: './snapshot-restore-vmware-snapshot.component.html',
  styleUrls: ['../snapshot-restore-vmware.scss']
})
export class SnapshotRestoreVmwareSnapshotComponent extends WizardPage<SnapshotRestoreVmwareModel> implements OnInit {
  @ViewChild(HypervisorRestoreSelectionTableComponent) restoreSelectionTable: HypervisorRestoreSelectionTableComponent;
  @ViewChild(HypervisorSingleSourceSnapshotSelectionComponent)
  singleSourceSelector: HypervisorSingleSourceSnapshotSelectionComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  private restoreTypes: Array<NvPairModel> = [];
  private unselectedRestoreTypeValue: NvPairModel;
  private selectedRestoreType: NvPairModel = new NvPairModel('', '');
  private restoreSourceTypes: Array<NvPairModel> = [];
  private unselectedRestoreSourceTypeValue: NvPairModel;
  private selectedRestoreSourceType: NvPairModel = new NvPairModel('', '');
  private availableRestoreSourceItems: Array<NvPairModel> = [];
  private unselectedAvailableRestoreSourceItemValue: NvPairModel;
  private selectedRestoreSourceItem: NvPairModel = new NvPairModel('', '');
  private snapshotFilters: Array<FilterModel> = [];

  private clouds: Array<NvPairModel> = [];
  private repos: Array<NvPairModel> = [];
  private archiveClouds: Array<NvPairModel> = [];
  private archiveRepos: Array<NvPairModel> = [];
  private sites: Array<NvPairModel> = [];
  private storageList: Array<StorageModel> = [];
  private subs: Subject<void> = new Subject<void>();
  private dateRangeWeek;
  private dateRangeMonth;
  private bsConfig: Partial<BsDatepickerState> = Object.assign({}, {
    containerClass: 'theme-dark-blue',
    showWeekNumbers: false,
    rangeInputFormat: 'L',
    locale: this.localeService.bsLocaleID
  });
  private deletedPages: string[];
  private mask: boolean = false;
  private updateRestoreSourcePending: boolean = false;
  private dateRangeFilters: FilterModel[];
  private preventSingleSourceSelector: boolean = false;
  private textSingleSourceSnapshotDescTpl: string = '';

  get hasSelection(): boolean {
    let source = this.getRestoreList();
    return source && source.length > 0;
  }

  get summarySource(): Array<RestoreItem> {
    return this.getRestoreList() || [];
  }

  get snapshotSelectionDisabled(): boolean {
    return !this.editMode && this.selectedRestoreSourceItem.value === '';
  }

  get showAlternateVsnap(): boolean {
    return this.model.showAlternateVsnap;
  }

  get singleSourceOnDemand(): boolean {
    return this.isSingleSource && this.isOnDemand;
  }

  get isSingleSource(): boolean {
    let list = this.model.source;
    return list && list.length === 1;
  }

  get isOnDemand(): boolean {
    return this.selectedRestoreType && this.selectedRestoreType.value === 'ondemand';
  }

  get singleSource(): RestoreItem {
    return this.isSingleSource ? this.model.source[0] : null;
  }

  set singleSource(item: RestoreItem) {
    if (this.isSingleSource)
      this.model.source[0] = item;
  }

  get textSingleSourceSnapshotDesc(): string {
    let resource = this.isSingleSource ?  this.singleSource.resource : null;
    return resource ? SharedService.formatString(this.textSingleSourceSnapshotDescTpl, resource.name) : '';
  }

  constructor(private translate: TranslateService,
              private localeService: LocaleService,
              private hypervisorRestoreService: HypervisorRestoreService,
              private recoveryPointsService: VmRecoveryPointsService){
    super();
  }

  ngOnInit(): void {
    let me = this;

    me.restoreSourceTypes = [
      new NvPairModel('', 'site'),
      new NvPairModel('', 'cloud'),
      new NvPairModel('', 'repository'),
      new NvPairModel('', 'archive'),
      new NvPairModel('', 'tape')
    ];
    me.restoreTypes = [
      new NvPairModel('', 'ondemand'),
      new NvPairModel('', 'recurring')
    ];
    me.unselectedRestoreTypeValue = new NvPairModel('', '');
    me.unselectedRestoreSourceTypeValue = new NvPairModel('', '');
    me.unselectedAvailableRestoreSourceItemValue = new NvPairModel('', '');

    me.selectedRestoreType = me.unselectedRestoreTypeValue;
    me.selectedRestoreSourceType = me.unselectedRestoreSourceTypeValue;
    me.selectedRestoreSourceItem = me.unselectedAvailableRestoreSourceItemValue;

    me.dateRangeWeek = new Date();
    me.dateRangeMonth = new Date();
    me.dateRangeWeek.setDate(me.dateRangeWeek.getDate() - 7);
    me.dateRangeMonth.setDate(me.dateRangeMonth.getDate() - 30);
    me.model.dateRange = [me.dateRangeWeek, new Date()];
    me.dateRangeFilters = me.getDateRangeFilters();

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translate.get([
      'common.textSite',
      'wizard.job.textRestoreType',
      'wizard.job.textRestoreSourceType',
      'wizard.job.textRestoreSourceItem',
      'wizard.job.textCloudOffload',
      'wizard.job.textRepoOffload',
      'wizard.job.textCloudArchive',
      'wizard.job.textRepoArchive',
      'wizard.job.textSingleSourceSnapshotDescTpl',
      'wizard.job.textOnDemand',
      'wizard.job.textRecurring'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.unselectedRestoreTypeValue.name = resource['wizard.job.textRestoreType'];
        me.unselectedRestoreSourceTypeValue.name = resource['wizard.job.textRestoreSourceType'];
        me.unselectedAvailableRestoreSourceItemValue.name = resource['wizard.job.textRestoreSourceItem'];
        me.textSingleSourceSnapshotDescTpl = resource['wizard.job.textSingleSourceSnapshotDescTpl'];

        NvPairModel.setName(me.restoreSourceTypes, 'site', resource['common.textSite']);
        NvPairModel.setName(me.restoreSourceTypes, 'cloud', resource['wizard.job.textCloudOffload']);
        NvPairModel.setName(me.restoreSourceTypes, 'repository', resource['wizard.job.textRepoOffload']);
        NvPairModel.setName(me.restoreSourceTypes, 'archive', resource['wizard.job.textCloudArchive']);
        NvPairModel.setName(me.restoreSourceTypes, 'tape', resource['wizard.job.textRepoArchive']);

        if (!me.editMode) {
          me.loadSites();
          me.loadClouds();
          me.loadStorages();
        }
        NvPairModel.setName(me.restoreTypes, 'ondemand', resource['wizard.job.textOnDemand']);
        NvPairModel.setName(me.restoreTypes, 'recurring', resource['wizard.job.textRecurring']);
      });
  }

  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (!param.back) {
      me.updateRestoreTable();
      if (this.selectedRestoreSourceItem.value !== '' && !me.singleSourceOnDemand) {
        this.fillLatestSnapshots();
      }
    }
    if (me.editMode && firstTime)
      me.populateOptions();
  }

  public onDeactive(param: WizardPageEventParam): void {
    let me = this;

    if (!param.back && me.showExcludeSelectionsNoSnapshot)
      me.excludeNoSnapshotSelections();

    if (me.validate(true))
      me.saveOptions();

    me.checkAWSSources();
  }

  get showExcludeSelectionsNoSnapshot(): boolean {
    return !this.singleSourceOnDemand && !this.model.useLatest && this.hasSelectionNoSnapshot;
  }

  get hasSelectionNoSnapshot(): boolean {
    let me = this, listCmp = me.restoreSelectionTable;
    return listCmp && listCmp.hasGreyedOutItem();
  }

  validate(silent: boolean): boolean {
    let valid = true;
    if (this.selectedRestoreType.value === '' || this.updateRestoreSourcePending) {
      return false;
    }
    if (this.singleSourceOnDemand) {
      valid = this.singleSourceSelector && this.singleSourceSelector.hasSelection();
    } else {
      if (this.model.useLatest) {
        valid = this.selectedRestoreSourceItem.value !== '';
      } else {
        valid = this.restoreSelectionTable.checkSnapshotSelections();
      }
    }
    if (this.model.useAlternateVsnap) {
      valid = valid && this.model.selectedStorage !== undefined;
    }
    return valid;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  public getSiteValue(): object {
    if (this.model.useLatest) {
      if (this.model.isOffload) {
        return {
          copy: {
            offload: {
              href: this.model.copyLocation.url,
              type: this.selectedRestoreSourceType.value.toString().toUpperCase()
            }
          }
        };
      } else {
        return {
          copy: {
            site: {
              href: this.model.copyLocation.url
            }
          }
        };
      }
    } else {
      return null;
    }
  }

  private getSelectionsWithSnapshot(): Array<RestoreItem> {
    let me = this, listCmp = me.restoreSelectionTable;
    return listCmp && listCmp.getNonGreyedOutItems();
  }

  private excludeNoSnapshotSelections(): void {
    let me = this, model = me.model,
      target = me.getSelectionsWithSnapshot();
    model.source = [...target];
    me.updateRestoreTable();
    me.notify<RestoreItem[]>('sourceEligibility', model.source);
  }

  private checkAWSSources(){
    let me = this,
      singleSourceSnapshot = me.getSingleSourceSnapshot(),
      records = me.singleSourceOnDemand ? (singleSourceSnapshot ? [singleSourceSnapshot] : []) :
        me.getRestoreList() || [];
    me.model.isAWSSource = false;
    records.forEach(function (restoreItem: RestoreItem) {
      if (restoreItem.resource && restoreItem.snapshot && restoreItem.resource.cloudType){
        me.model.isAWSSource = true;
        me.model.options.streaming = true;
      }
    });
  }

  private loadStorages(callback?: Function): void {
    let me = this, observable: Observable<StoragesModel>;

    me.storageList = me.storageList || [];
    me.storageList.splice(0, me.storageList.length);

    observable = StoragesModel.retrieve<StorageModel, StoragesModel>(StoragesModel,
      me.hypervisorRestoreService.proxy, [new FilterModel('type', 'vsnap')], [new SorterModel('name', 'ASC')],
      0, 0);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            (dataset.records || []).forEach(function (item) {
              me.storageList.push(item);
            });
          }
          if (callback)
            callback.call(me);
        },
        err => me.handleError(err)
      );
  }

  private loadSites(callback?: Function): void {
    let me = this, observable: Observable<SitesModel>;

    me.sites = me.sites || [];
    me.sites.splice(0, me.sites.length);

    observable = SitesModel.retrieve<SiteModel, SitesModel>(SitesModel,
      me.hypervisorRestoreService.proxy, undefined, [new SorterModel('name', 'ASC')],
      0, 0);
    if (observable)
      observable.subscribe(
        dataset => {
          if (dataset) {
            me.hypervisorRestoreService.sendSites(dataset.records);
            (dataset.records || []).forEach(function (item) {
              me.sites.push(new NvPairModel(item.name, item));
            });
          }
          if (callback)
            callback.call(me);
        },
        // err => me.handleError(err)
      );
  }

  private loadClouds(callback?: Function): void {
    let me = this, observable: Observable<CloudsModel>;

    me.clouds = me.clouds || [];
    me.clouds.splice(0, me.clouds.length);

    me.repos = me.repos || [];
    me.repos.splice(0, me.repos.length);

    me.archiveRepos = me.archiveRepos || [];
    me.archiveRepos.splice(0, me.archiveRepos.length);

    me.archiveClouds = me.archiveClouds || [];
    me.archiveClouds.splice(0, me.archiveClouds.length);

    observable = CloudsModel.retrieve<CloudModel, CloudsModel>(CloudsModel,
      me.hypervisorRestoreService.proxy, undefined, [new SorterModel('name', 'ASC')],
      0, 0);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            (dataset.records || []).forEach(function (item) {
              if (item.provider === 'sp') {
                me.repos.push(new NvPairModel(item.name, item));
                if (item.archiveEnabled) {
                  me.archiveRepos.push(new NvPairModel(item.name, item));
                }
              } else {
                me.clouds.push(new NvPairModel(item.name, item));
                if (item.archiveEnabled) {
                  me.archiveClouds.push(new NvPairModel(item.name, item));
                }
              }
            });
          }
          if (callback)
            callback.call(me);
        },
        err => me.handleError(err)
      );
  }

  private getDateRangeFilters(range?: Date[], filterCopies?: boolean): FilterModel[] {
    let me = this, filters = [];
    range = range || me.model.dateRange;
    if (range && range.length === 2) {
      let from = range[0].setHours(0, 0, 0, 0),
        to = range[1].setHours(23, 59, 59, 999);
      if (filterCopies) {
        filters.push(new FilterModel('protectionTimeStart', from));
        filters.push(new FilterModel('protectionTimeEnd', to));
      } else {
        filters.push(new FilterModel('protectionInfo.protectionTime', from, '>='));
        filters.push(new FilterModel('protectionInfo.protectionTime', to, '<='));
      }
    }
    return filters;
  }

  private setSnapshotFilters(preventFillSnapshots?: boolean): void {
    let me = this, resourceId = me.selectedRestoreSourceItem.value.id;
    me.snapshotFilters = [];
    me.hypervisorRestoreService.filterRestore(me.selectedRestoreSourceType.value.id);
    me.snapshotFilters.push(...me.getDateRangeFilters(undefined, true));

    switch (me.selectedRestoreSourceType.value) {
      case 'site':
        me.snapshotFilters.push(new FilterModel('siteId', resourceId));
        me.snapshotFilters.push(new FilterModel('subPolicyType', 'SPPOFFLOAD', '<>'));
        break;
      case 'cloud':
      case 'repository':
        me.snapshotFilters.push(new FilterModel('offloadProviderId', resourceId));
        me.snapshotFilters.push(new FilterModel('subPolicyType', 'SPPOFFLOAD'));
        break;
      case 'archive':
      case 'tape':
        me.snapshotFilters.push(new FilterModel('offloadProviderId', resourceId));
        me.snapshotFilters.push(new FilterModel('subPolicyType', 'SPPARCHIVE'));
        break;
      default:
        break;
    }
    if (!this.model.useLatest && !preventFillSnapshots && !me.singleSourceOnDemand) {
      me.fillLatestSnapshots();
    }
  }

  private onDateRangeChange(range: Date[], playback?: boolean): void {
    let me = this;
    if (!me.singleSourceOnDemand || me.preventSingleSourceSelector)
      return;

    me.dateRangeFilters = me.getDateRangeFilters(range);
    if (me.singleSourceSelector) {
      if (!playback)
        me.singleSourceSelector.emptySelection();
      else
        me.singleSourceSelector.retrieveSelection();
      me.singleSourceSelector.filters = me.dateRangeFilters;
      me.singleSourceSelector.loadVersions();
    }
  }

  private loadVersions(item: BaseHypervisorModel, force?: boolean, selectSnapshotOnLoaded?: RestoreItem,
                        oldResource?: BaseHypervisorModel): void {
    let me = this, observable: Observable<Array<SnapshotModel>>,
      filters = me.snapshotFilters ? me.snapshotFilters : undefined;
    if (force || !item.snapshots || item.snapshots.length < 1) {
      observable = me.recoveryPointsService.getSnapshots(item, filters, [new SorterModel('copyTime', 'DESC')]);
      if (observable) {
        me.mask = true;
        observable.takeUntil(me.subs).subscribe(
          records => {
            let target: SnapshotModel;
            me.mask = false;
            item.snapshots = records;

            if (selectSnapshotOnLoaded) {
              target = selectSnapshotOnLoaded.snapshot ? records.find(function (record: SnapshotModel) {
                return record.identity(selectSnapshotOnLoaded.snapshot.getId());
              }) : null;
              if (target)
                selectSnapshotOnLoaded.snapshot = target;
              me.onSnapshotSelect(selectSnapshotOnLoaded);
              me.updateRestoreTableItem(oldResource, selectSnapshotOnLoaded);
            }
          },
          err => me.handleError(err),
          () => {
            me.mask = false;
            if (!selectSnapshotOnLoaded)
              me.initMetadata(item);
            me.initSite(item);
          }
        );
      }
    }
  }

  private loadResourceVersions(item: RestoreItem, preventLoadVersions?: boolean,
                               callback?: Function): boolean {
    let me = this, resource = item.resource,
      observable = resource.getRecord<HypervisorModel>(HypervisorModel, 'self', me.hypervisorRestoreService.proxy);
    if (observable) {
      me.mask = true;
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.mask = false;
          item.resource = record;
          if (!preventLoadVersions)
            me.loadVersions(item.resource as BaseHypervisorModel, false, item, resource);
          else {
            me.updateRestoreTableItem(resource, item);
          }
          if (callback)
            callback.call(me);
        },
        err => {
          me.mask = false;
          me.handleError(err, false);
        }
      );
      return true;
    }
    return false;
  }

  private onFilteredItemClick(item: NvPairModel): void {
    let me = this;

    if (me.selectedRestoreSourceItem.value !== item.value){
      me.selectedRestoreSourceItem = item;
      me.model.copyLocation = item.value;
      me.resetSnapshotSelections(true);
      me.setSnapshotFilters();
    }
  }

  private updateRestoreTable(): void {
    let me = this, list = [...me.model.source];
    me.restoreSelectionTable.removeAll();
    list.forEach(function (source) {
      me.restoreSelectionTable.add(source);
    });
  }

  private onSnapshotDropDown(item: RestoreItem): void {
    let resource = item.resource;
    this.loadVersions(resource as BaseHypervisorModel, false);
  }

  private onSnapshotSelect(item: RestoreItem): void {
    let resource = item.resource, version = item.snapshot;
    if (version) {
      version.metadata['selected'] = true;
    }
    this.initMetadata(resource);

    // if (me.checkForSppSnapshot()) {
    //   me.model.isSpp = true;
    //   me.restoreType = 'clone'
    //   me.disableTestRestoreType = true
    // } else{
    //   me.model.isSpp = false;
    // }
  }

  private onSelectRestoreType(item: NvPairModel): void {
    let me = this, isRecurring: boolean = false;

    if (me.selectedRestoreType.value !== item.value) {
      me.selectedRestoreType = item;
      me.selectedRestoreSourceType = me.unselectedRestoreSourceTypeValue;
      me.selectedRestoreSourceItem = me.unselectedAvailableRestoreSourceItemValue;
      me.resetSnapshotSelections(true);
      switch (me.selectedRestoreType.value) {
        case 'ondemand':
          me.model.useLatest = false;
          break;
        case 'recurring':
          me.model.useLatest = true;
          isRecurring = true;
          break;
        default:
          break;
      }

      if (me.singleSourceOnDemand) {
        me.dateRangeFilters = me.getDateRangeFilters();
        me.onSelectedRestoreSourceTypeChange(me.selectedRestoreSourceType.value);
      }
      me.spliceSteps(isRecurring);
    }
  }

  /**
   * Splice steps.
   * The schedule step should only be available for recurring jobs.
   *
   * @param {boolean} isRecurring
   * @param {boolean} preventClearSchedule
   */
  private spliceSteps(isRecurring: boolean, preventClearSchedule?: boolean): void {
    let me = this, deletedPages: string[];
    if (!isRecurring) {
      deletedPages = me.splicePages('schedule', 1);
      if (deletedPages && deletedPages.length > 0) {
        me.deletedPages = deletedPages;
        if (!preventClearSchedule)
          me.model.clearSchedule();
      }
    } else if (me.deletedPages && me.deletedPages.length > 0) {
      me.splicePages('review', 0, ...me.deletedPages);
      me.deletedPages = undefined;
    }
  }

  private onSelectTypeClick(item: NvPairModel): void {
    let me = this;

    if (me.selectedRestoreSourceType.value !== item.value) {
      me.selectedRestoreSourceType = item;
      me.selectedRestoreSourceItem = me.unselectedAvailableRestoreSourceItemValue;
      if (me.selectedRestoreSourceType.value === 'site'){
        me.availableRestoreSourceItems = me.sites;
        me.model.isOffload = false;
        me.model.showAlternateVsnap = false;
        me.model.dateRange = [me.dateRangeWeek, new Date()];
        me.model.useAlternateVsnap = false;
      } else if (me.selectedRestoreSourceType.value === 'cloud'){
        me.availableRestoreSourceItems = me.clouds;
        me.model.isOffload = true;
        me.model.showAlternateVsnap = true;
        me.model.dateRange = [me.dateRangeWeek, new Date()];
      } else if (me.selectedRestoreSourceType.value === 'repository'){
        me.availableRestoreSourceItems = me.repos;
        me.model.isOffload = true;
        me.model.showAlternateVsnap = true;
        me.model.dateRange = [me.dateRangeWeek, new Date()];
      } else if (me.selectedRestoreSourceType.value === 'archive'){
        me.availableRestoreSourceItems = me.archiveClouds;
        me.model.isOffload = true;
        me.model.showAlternateVsnap = true;
        me.model.dateRange = [me.dateRangeMonth, new Date()];
      } else if (me.selectedRestoreSourceType.value === 'tape'){
        me.availableRestoreSourceItems = me.archiveRepos;
        me.model.isOffload = true;
        me.model.showAlternateVsnap = true;
        me.model.dateRange = [me.dateRangeMonth, new Date()];
      }
      me.resetSnapshotSelections(true);
    }
  }

  private fillLatestSnapshots(): void {
    let me = this, observable: Observable<Object>,
      list = me.getRestoreList() || [],
      payload, results: Array<NvPairModel> = [], resources: string[] = [];

    me.resetSnapshotSelections();
    list.forEach( function(resourceItem){
      resources.push(resourceItem.resource.id);
    });

    payload = {
      resourceIds: resources,
      protectionTimeStart: me.model.dateRange[0].setHours(0, 0, 0, 0),
      protectionTimeEnd: me.model.dateRange[1].setHours(23, 59, 59, 999),
      location: {
        type: me.selectedRestoreSourceType.value,
        id: me.selectedRestoreSourceItem.value.id
      }
    };

    observable = me.recoveryPointsService.getLatestSnapshots(list[0].resource.resourceType, payload);
    if (observable) {
      me.mask = true;
      observable.takeUntil(me.subs).subscribe(
        records => {
          me.mask = false;
          records['resourceCopies'].forEach(function (record) {
            let copy = record['copy'];
            copy ? results.push(new NvPairModel(record['id'], JsonConvert.deserializeObject(copy, SnapshotModel))) :
              results.push(new NvPairModel(record['id'], undefined));
          });
        },
        err => me.handleError(err),
        () => {
          me.mask = false;
          me.initSnapshots(results);
        }
      );
    }
  }

  private initSnapshots(snapshotMapping: Array<NvPairModel>) {
    let me = this, selections = me.getRestoreList() || [];

    snapshotMapping.forEach( function(mapping) {
      selections.forEach( function (sourceSelection) {
        if (sourceSelection.resource.id === mapping.name)
          if (!sourceSelection.snapshot && mapping.value) {
            sourceSelection.snapshot = mapping.value;
          }
        return true;
      });
    });
  }

  private resetSnapshotSelections(force?: boolean): void {
    let me = this,
      list = me.getRestoreList() || [],
      isOnDemandEditing = me.isOnDemandEditing();
    list.forEach(function (sourceSelection) {
      let skip = !force && isOnDemandEditing && !!sourceSelection.snapshot;
      if (!skip) {
        sourceSelection.snapshot = undefined;
        sourceSelection.resource.snapshots = [];
      }
    });
  }

  private isOnDemandEditing(): boolean {
    return this.getRestoreType() === 'ondemand' && this.editMode;
  }

  private initMetadata(resource: BaseHypervisorModel): void {
    let me = this, snapshots;

    let selection = me.getRestoreList() || [],
      targetResource = selection.find(function (item) {
        return item.resource.getId() === resource.getId();
      }), targetSnapshot;

    if (targetResource) {
      targetSnapshot = targetResource.resource.snapshots.find(function (item) {
        return item.metadata['selected'] === true;
      });
    }
    snapshots = resource.snapshots as Array<BaseModel> || [];
    snapshots.forEach(function (snapshot) {
      let selected = targetSnapshot && targetSnapshot.getId() === snapshot.getId();
      snapshot.metadata['selected'] = selected;
      if (selected) {
        resource.metadata['snapshot'] = snapshot;
      }
    });

    resource.metadata['snapshotLoaded'] = true;
  }

  private initSite(resource: BaseHypervisorModel): void {
    let me = this,
      versions = resource.snapshots || [];
    versions.forEach(function (snapshot: SnapshotModel) {
      let site = (me.sites || []).find(function (item: NvPairModel) {
        return item.value.id === snapshot.siteId;
      });
      snapshot.site = site ? site.name : '';
    });
  }

  private getRestoreList(): Array<RestoreItem> {
    let me = this;
    if (me.restoreSelectionTable)
      return me.restoreSelectionTable.getValue();
    return [];
  }

  private onDateRangeKeyDown(drp: BsDaterangepickerDirective, event: KeyboardEvent): void {
    if (event.keyCode === 8) { // BackSpace Key.
    }
  }

  private getRestoreType(): string {
    let me = this, model = me.model, restoreType: string = '';
    if (!model.useLatest)
      restoreType = 'ondemand';
    else
      restoreType = 'recurring';
    return restoreType;
  }

  private updateRestoreTableItem(oldResource: BaseHypervisorModel, newItem: RestoreItem): void {
    let me = this;
    if (me.restoreSelectionTable)
      me.restoreSelectionTable.update(oldResource, newItem);
  }

  private onSelectedRestoreSourceTypeChange(restoreSourceType: string): void {
    let me = this;
    if (['site', ''].indexOf(restoreSourceType) !== -1) {
      me.model.isOffload = false;
      me.model.showAlternateVsnap = false;
      me.model.useAlternateVsnap = false;
    } else if (['cloud', 'repository', 'archive', 'tape'].indexOf(restoreSourceType) !== -1) {
      me.model.isOffload = true;
      me.model.showAlternateVsnap = true;
      me.model.offloadType = restoreSourceType.toUpperCase();
    }
  }

  private loadResourceSnapshots(item: RestoreItem): void {
    let resource = item.resource;
    if (!resource)
      return;
    if (resource.hasLink('copies'))
      this.loadVersions(resource as BaseHypervisorModel, false);
    else
      this.loadResourceVersions(item);
  }


  private updateRestoreSource(restoreItem: RestoreItem): void {
    let me = this, version = restoreItem.snapshot, offloadInfo: CopyOffloadInfo = version ? version.offloadInfo : null,
      offloadInfoEx: CopyOffloadInfoEx = version ? version.offloadInfoEx : null,
      isOffload: boolean = version && version.isOffload(), isArchive: boolean = version && version.isArchive(),
      isCloud: boolean = offloadInfo && offloadInfo.offloadProvider !== 'sp' ||
        offloadInfoEx && offloadInfoEx.offloadProvider !== 'sp',
      isRepository: boolean = offloadInfo && offloadInfo.offloadProvider === 'sp' ||
        offloadInfoEx && offloadInfoEx.offloadProvider === 'sp',
      restoreSourceType: string;

    if (!version) {
      me.selectedRestoreSourceType = me.unselectedRestoreSourceTypeValue;
      me.selectedRestoreSourceItem = me.unselectedAvailableRestoreSourceItemValue;
    } else {
      restoreSourceType = me.restoreSourceType(isOffload, isArchive, isCloud, isRepository);
      me.switchRestoreSourceType(restoreSourceType, true);
      me.selectedRestoreSourceItem = me.availableRestoreSourceItems.find(function (item) {
        if (item.value && (restoreSourceType === 'site' && item.value.id === version.siteId ||
          restoreSourceType !== 'site' && (offloadInfo && item.value.id === offloadInfo.offloadProviderId &&
          item.value.provider === offloadInfo.offloadProvider ||
          offloadInfoEx && item.value.id === offloadInfoEx.offloadProviderId &&
          item.value.provider === offloadInfoEx.offloadProvider))) {
          me.model.copyLocation = item.value;
          return true;
        }
      }) || me.unselectedAvailableRestoreSourceItemValue;
    }
    me.onSelectedRestoreSourceTypeChange(me.selectedRestoreSourceType.value);
  }

  private updateRestoreSourceNDateRange(restoreItem: RestoreItem): void {
    let me = this, version = restoreItem.snapshot, offloadInfo: CopyOffloadInfo = version ? version.offloadInfo : null,
      offloadInfoEx: CopyOffloadInfoEx = version ? version.offloadInfoEx : null,
      isOffload: boolean = version && version.isOffload(), isArchive: boolean = version && version.isArchive(),
      isCloud: boolean = offloadInfo && offloadInfo.offloadProvider !== 'sp' ||
        offloadInfoEx && offloadInfoEx.offloadProvider !== 'sp',
      isRepository: boolean = offloadInfo && offloadInfo.offloadProvider === 'sp' ||
        offloadInfoEx && offloadInfoEx.offloadProvider === 'sp',
      copyTime: number = version ? version.copyTime || version.protectionTime : 0,
      fn: Function,
      restoreSourceType: string;

    if (!version)
      return;

    if (copyTime && me.model.dateRange) {
      if (copyTime < me.model.dateRange[0].valueOf())
        me.model.dateRange = [new Date(copyTime), me.model.dateRange[1]];
      else if (copyTime > me.model.dateRange[1].valueOf())
        me.model.dateRange = [me.model.dateRange[0], new Date(copyTime)];
    }

    if (me.updateRestoreSourcePending) {
      me.updateRestoreSourcePending = false;

      restoreSourceType = me.restoreSourceType(isOffload, isArchive, isCloud, isRepository);
      me.switchRestoreSourceType(restoreSourceType, true);
      me.onSelectedRestoreSourceTypeChange(restoreSourceType);
      fn = () => {
        me.selectedRestoreSourceItem = me.availableRestoreSourceItems.find(function (item) {
          if (item.value && (restoreSourceType === 'site' && item.value.id === version.siteId ||
            restoreSourceType !== 'site' && (offloadInfo && item.value.id === offloadInfo.offloadProviderId &&
            item.value.provider === offloadInfo.offloadProvider ||
              offloadInfoEx && item.value.id === offloadInfoEx.offloadProviderId &&
              item.value.provider === offloadInfoEx.offloadProvider))) {
            me.model.copyLocation = item.value;
            return true;
          }
        }) || me.unselectedAvailableRestoreSourceItemValue;
        me.setSnapshotFilters(true);

        if (me.singleSourceOnDemand) {
          me.preventSingleSourceSelector = false;
          me.onDateRangeChange(me.model.dateRange, true);
        }
      };
      me.loadSites(restoreSourceType === 'site' ? fn : undefined);
      me.loadClouds(restoreSourceType !== 'site' ? fn : undefined);
    }
  }

  private restoreSourceType(isOffload: boolean, isArchive: boolean, isCloud: boolean, isRepository: boolean): string {
    let rst: string;
    if (isCloud && isOffload)
      rst = 'cloud';
    else if (isCloud && isArchive)
      rst = 'archive';
    else if (isRepository && isOffload)
      rst = 'repository';
    else if (isRepository && isArchive)
      rst = 'tape';
    else if (!isOffload && !isArchive)
      rst = 'site';
    else if (isOffload && !isRepository)
      rst = 'cloud';
    else if (isArchive && !isRepository)
      rst = 'archive';

    return rst;
  }

  private switchRestoreSourceType(restoreSourceType: string, preventUpdateDateRange?: boolean) {
    let me = this;
    me.selectedRestoreSourceType = NvPairModel.find(me.restoreSourceTypes, restoreSourceType) ||
      me.unselectedRestoreSourceTypeValue;
    switch (restoreSourceType) {
      case 'cloud':
        me.availableRestoreSourceItems = me.clouds;
        if (!preventUpdateDateRange)
          me.model.dateRange = [me.dateRangeWeek, new Date()];
        break;
      case 'repository':
        me.availableRestoreSourceItems = me.repos;
        if (!preventUpdateDateRange)
          me.model.dateRange = [me.dateRangeWeek, new Date()];
        break;
      case 'archive':
        me.availableRestoreSourceItems = me.archiveClouds;
        if (!preventUpdateDateRange)
          me.model.dateRange = [me.dateRangeMonth, new Date()];
        break;
      case 'tape':
        me.availableRestoreSourceItems = me.archiveRepos;
        if (!preventUpdateDateRange)
          me.model.dateRange = [me.dateRangeMonth, new Date()];
        break;
      case 'site':
        me.availableRestoreSourceItems = me.sites;
        if (!preventUpdateDateRange)
          me.model.dateRange = [me.dateRangeWeek, new Date()];
        break;
      default:
        me.availableRestoreSourceItems = [];
        break;
    }
  }

  private populateSnapshots(): void {
    let me = this, list = me.getRestoreList() || [];
    list.forEach(function (source) {
      me.loadResourceSnapshot(source);
    });
  }

  private loadVersion(item: RestoreItem,
                      oldResource: BaseHypervisorModel): void {
    let me = this, protectionTime: number, observable: Observable<SnapshotModel>;
    if (item.snapshot) {
      protectionTime = item.snapshot.protectionTime;
      observable = item.snapshot.getRecord<SnapshotModel>(SnapshotModel, 'self',
        me.hypervisorRestoreService.proxy);
      if (observable) {
        me.mask = true;
        observable.takeUntil(me.subs).subscribe(
          record => {

            me.mask = false;
            item.snapshot = record;

            if (item.snapshot && !item.snapshot.protectionTime && protectionTime)
              item.snapshot.protectionTime = protectionTime;

            me.onSnapshotSelect(item);
            me.updateRestoreTableItem(oldResource, item);
            if (me.singleSourceOnDemand)
              me.singleSource = item;
            me.updateRestoreSourceNDateRange(item);
          },
          err => me.handleError(err)
        );
      }
    }
  }

  private loadResourceVersion(item: RestoreItem, preventLoadVersion?: boolean,
                               callback?: Function): boolean {
    let me = this, resource = item.resource,
      observable = resource.getRecord<HypervisorModel>(HypervisorModel, 'self', me.hypervisorRestoreService.proxy);
    if (observable) {
      me.mask = true;
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.mask = false;
          item.resource = record;
          if (!preventLoadVersion)
            me.loadVersion(item, resource);
          else {
            me.updateRestoreTableItem(resource, item);
          }
          if (callback)
            callback.call(me);
        },
        err => {
          me.mask = false;
          me.handleError(err, false);
        }
      );
      return true;
    }
    return false;
  }

  private loadResourceSnapshot(item: RestoreItem): void {
    let resource = item.resource;
    if (!resource.hasLink('copies')) {
      this.loadResourceVersion(item);
    }
  }

  private onToggleSnapshotSelect(item: RestoreItem): void {
    this.updateRestoreSource(item);
  }

  private getSingleSourceSnapshot(): RestoreItem {
    return this.singleSourceSelector ? this.singleSourceSelector.getValue() : null;
  }

  private saveOptions(): void {
    let me = this,
      model = me.model,
      singleSourceSnapshot = me.getSingleSourceSnapshot(),
      list = me.singleSourceOnDemand ? (singleSourceSnapshot ? [singleSourceSnapshot] : []) : me.getRestoreList() || [];
    model.source = [...list];
    model.copyPayload = me.getSiteValue();
  }

  private populateOptions(): void {
    let me = this,
      fn: Function,
      model = me.model,
      restoreType = me.getRestoreType(),
      isRecurring = restoreType === 'recurring',
      isOnDemand =  restoreType === 'ondemand',
      restoreSourceType: string;

    me.selectedRestoreType = NvPairModel.find(me.restoreTypes, restoreType);

    if (isRecurring) {
      fn = () => {
        me.selectedRestoreSourceItem = me.availableRestoreSourceItems.find(function (item) {
          if (item.value && item.value.getId() === model.copyLocationHref) {
            me.model.copyLocation = item.value;
            return true;
          }
        }) || me.unselectedAvailableRestoreSourceItemValue;
      };

      restoreSourceType = model.isOffload ? (model.offloadType || '').toLowerCase() : 'site';
      me.switchRestoreSourceType(restoreSourceType);

    } else if (isOnDemand) {
      me.updateRestoreSourcePending = true;
      if (me.singleSourceOnDemand)
        me.preventSingleSourceSelector = true;
      me.populateSnapshots();
    }
    me.spliceSteps(isRecurring, true);
    if (!isOnDemand) {
      me.loadSites(!model.isOffload ? fn : undefined);
      me.loadClouds(model.isOffload ? fn : undefined);
    }
    me.loadStorages(model.selectedStorageHref ? () => {
      me.model.selectedStorage = me.storageList.find(function (item) {
        return item.getId() === model.selectedStorageHref;
      });
    } : undefined);
  }
}
