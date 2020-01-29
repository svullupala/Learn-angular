import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreMongoModel} from '../snapshot-restore-mongo.model';
import {
  ApplicationSelectTableComponent
} from 'app/manage-protection/applications/restore/application-select-table/application-select-table.component';
import {
  ApplicationRestoreItem
} from 'app/manage-protection/applications/restore/application-list-table/application-list-table.component';
import {NvPairModel} from 'shared/models/nvpair.model';
import {FilterModel} from 'shared/models/filter.model';
import {TranslateService} from '@ngx-translate/core';
import {InstancesModel} from 'app/manage-protection/applications/shared/instances.model';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {ApplicationService} from 'app/manage-protection/applications/shared/application.service';
import {Subject} from 'rxjs/Subject';
import {ApplicationRestoreSourceTableComponent}
  from 'app/manage-protection/applications/restore/application-restore-source-table/application-restore-source-table.component';
import {ApplicationRestoreSelectionTableComponent}
  from 'app/manage-protection/applications/restore/application-restore-selection-table/application-restore-selection-table.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'snapshot-restore-mongo-source',
  templateUrl: './snapshot-restore-mongo-source.component.html',
  styleUrls: ['../snapshot-restore-mongo.scss']
})
export class SnapshotRestoreMongoSourceComponent extends WizardPage<SnapshotRestoreMongoModel> implements OnInit,
  OnDestroy {
  get applicationType(): string {
    return this.model.workflow;
  }

  @ViewChild(ApplicationRestoreSourceTableComponent) restoreTable: ApplicationRestoreSourceTableComponent;
  @ViewChild(ApplicationRestoreSelectionTableComponent) restoreListTable: ApplicationRestoreSelectionTableComponent;
  views: Array<NvPairModel> = [];
  view: NvPairModel;

  get targetLocation(): string { return this.model.targetLocation; }

  filters: Array<FilterModel> = [];
  namePattern: string = '';
  breadcrumbs: Array<any>;

  private subs: Subject<void> = new Subject<void>();
  private subscriptions: Subscription[] = [];

  get isSystemDbFlag(): boolean { return this.model.isSystemDbFlag; }
  set isSystemDbFlag(value: boolean) { this.model.isSystemDbFlag = value; }
  get hasMultipleVersions(): boolean { return this.model.hasMultipleVersions; }
  set hasMultipleVersions(value: boolean) { this.model.hasMultipleVersions = value; }

  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  private get originalLocation(): boolean {
    return this.targetLocation === 'original' || this.targetLocation === 'originalPrimary';
  }

  get summaryValue(): string {
    let me = this, names: string[] = [], items = me.getRestoreList();
    (items || []).forEach(function (item) {
      names.push(item.resource.name);
    });
    return names.join(', ');
  }

  constructor(private translate: TranslateService,
              private applicationRestoreService: ApplicationRestoreService,
              private applicationService: ApplicationService) {
    super();
    this.breadcrumbs = this.applicationService.breadcrumbs;
  }

  ngOnInit(): void {
    let me = this;
    // Initialize views.
    me.views.push(
      new NvPairModel('', InstancesModel.APPLICATION_VIEW),
      new NvPairModel('', InstancesModel.DATABASE_GROUP_VIEW));
    me.view = me.view || me.views[0];

    me.translate.get([
      'common.textSite',
      'cloud.textCloudServers',
      'repositoryserver.textRepositoryServers',
      'application.standaloneText',
      'application.alwaysonText'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {

        me.views[0].name = resource['application.standaloneText'];
        me.views[1].name = resource['application.alwaysonText'];
      });
  }

  ngOnDestroy(): void {
    let me = this;
    if (me.subs) {
      me.subs.next();
      me.subs.complete();
      me.subs.unsubscribe();
    }
    if (me.subscriptions)
      me.unsubscribe(me.subscriptions);
  }

  validate(silent: boolean): boolean {
    let list = this.getRestoreList();
    return list && list.length > 0;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  get showView(): boolean {
    return false;
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (firstTime) {
      // Publish the sourceEligibility subject.
      me.publish<ApplicationRestoreItem[]>({
        sourceEligibility: {
          initValue: null
        }
      });
      // Subscribe the sourceEligibility subject.
      me.subscriptions.push(...me.subscribe<ApplicationRestoreItem[]>({
        sourceEligibility: {
          fn: (value: ApplicationRestoreItem[]) => {
            if (value)
              me.handleSourceEligibility(value);
          },
          scope: me
        }
      }));
    }
    if (me.editMode && firstTime)
      me.populateOptions();
    else if (!firstTime)
      me.updateRestoreTable();
  }

  onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(true))
      me.saveOptions();
  }

  startSearch(searchPattern: string): void {
    let me = this;
    if (searchPattern !== undefined) {
      me.namePattern = searchPattern;
    }
    me.setSqlFilters();
    me.restoreTable.dbSearch(me.applicationType, 'recovery', {name: me.namePattern || ''},
      me.filters, me.view.value === InstancesModel.DATABASE_GROUP_VIEW);
  }

  setSqlFilters(): void {
    let me = this,
      dbGroupFilterIdx = me.filters.findIndex((item) => {
        return item.property === 'databaseGroupPk';
      });
    if (dbGroupFilterIdx !== -1 && me.view) {
      me.filters[dbGroupFilterIdx].op = me.view.value === InstancesModel.DATABASE_GROUP_VIEW ? 'EXISTS' : 'NOT EXISTS';
    }
    // me.restoreTable.setFilters(me.filters);
  }

  onBreadcrumbClick(item: any, event?: any): void {
    let me = this,
      dbView: boolean = false;

    if (item && item.resource) {
      return;
    }
    if (me.restoreTable) {
      me.restoreTable.setView(me.view);
      // me.restoreTable.setFilters(me.filters);
      if (me.view.value === InstancesModel.DATABASE_GROUP_VIEW) {
        dbView = true;
      }
      me.restoreTable.loadData(dbView);
    }
  }

  hasSnapshotPresent(): boolean {
    return false;
  }

  canNavigateBreadCrumb(item: ApplicationRestoreItem): boolean {
    if (item && item.resource) {
      return item.resource.hasLink(InstancesModel.APPLICATION_VIEW)
        || item.resource.hasLink(InstancesModel.DATABASE_GROUP_VIEW);
    }
    return true;
  }

  private excludeIneligibleSelections(eligibleItems: ApplicationRestoreItem[]): void {
    let me = this, listComp = me.restoreListTable,
      list = me.getRestoreList() || [],
      ineligibleItems = list.filter(function (item) {
        return eligibleItems.findIndex(function (eligibleItem) {
          return eligibleItem.resource && item.resource && eligibleItem.resource.getId() === item.resource.getId();
        }) === -1;
      });

    if (ineligibleItems && listComp) {
      ineligibleItems.forEach(function (item) {
        listComp.remove(item);
      });
    }
  }

  private handleSourceEligibility(eligibleItems: ApplicationRestoreItem[]): void {
    this.excludeIneligibleSelections(eligibleItems);
  }

  private onRemoveItem(): void {
    if (this.cannotHaveMultipleVersions()) {
      this.hasMultipleVersions = this.hasMultipleVersionSelections();
    }
    this.onFilterInstances();
  }

  private getRestoreList(): Array<ApplicationRestoreItem> {
    return this.restoreListTable && this.restoreListTable.getValue();
  }

  private updateRestoreTable(): void {
    let me = this, list = [...me.model.source];
    if (me.restoreListTable) {
      me.restoreListTable.removeAll();
      list.forEach(function (source) {
        me.restoreListTable.add(source);
      });
    }
  }

  private onAddClick(item: ApplicationRestoreItem): void {
    let me = this;
    if (me.restoreListTable) {
      me.restoreListTable.add(item);

      me.model.source = me.getRestoreList();
      if (me.isStandalone()) {
        me.isSystemDbFlag = me.hasSystemDbInList();
        me.isSystemDbFlag ? (me.setIaType()) : (me.setRestoreType('test'));
      } else if (me.cannotHaveMultipleVersions()) {
        me.hasMultipleVersions = me.hasMultipleVersionSelections();
      }
      me.onFilterInstances();
    }
  }

  private onFilterInstances(): void {
    if (!this.originalLocation) {
      this.applicationRestoreService.filterInstances(this.getRestoreList());
    }
  }

  private setIaType(): void {
    this.model.subPolicyType = ApplicationRestoreService.IA_VAL;
    this.checkTargetLocationForSqlAag();
  }

  private setRestoreType(type?: string): void {
    this.model.subPolicyType = ApplicationRestoreService.RESTORE_VAL;
    this.model.runType = type;
    this.checkTargetLocationForSqlAag();
  }

  private checkTargetLocationForSqlAag() {
  }

  private hasMultipleVersionSelections(): boolean {
    let i: number = 0,
      version: string,
      hasMultiple: boolean = false,
      restoreList: Array<ApplicationRestoreItem> = this.getRestoreList(),
      length: number = (restoreList && restoreList.length) || 0;
    for (i = 0; i < length; i++) {
      if (i > 0) {
        // check for any different versions
        if (version !== restoreList[i].instanceVersion) {
          hasMultiple = true;
          break;
        }
      } else {
        // store the version string for the first item in list
        version = restoreList[i].instanceVersion;
      }
    }
    return hasMultiple;
  }

  private isStandalone(): boolean {
    return false;
  }

  private cannotHaveMultipleVersions(): boolean {
    return true;
  }

  private isListEmpty(): boolean {
    return this.restoreListTable && this.restoreListTable.isEmpty();
  }

  private hasSystemDbInList(): boolean {
    return (this.getRestoreList() || []).findIndex((item: ApplicationRestoreItem) => {
      return this.isSystemDb(item);
    }) !== -1;
  }

  private isSystemDb(item: ApplicationRestoreItem): boolean {
    return ['master', 'msdb', 'model'].indexOf(item.resource.name) !== -1;
  }

  private saveOptions(): void {
    let me = this,
      model = me.model;
    model.source = me.getRestoreList();
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0];

    me.restoreListTable.setSource(policy.spec.source);
    me.restoreListTable.setRestoreType(subpolicy);
    model.source = me.getRestoreList();
    me.onFilterInstances();
    if (me.cannotHaveMultipleVersions()) {
      me.hasMultipleVersions = me.hasMultipleVersionSelections();
    }
  }
}
