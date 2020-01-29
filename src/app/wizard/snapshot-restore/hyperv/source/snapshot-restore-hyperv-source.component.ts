import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreHypervModel} from '../snapshot-restore-hyperv.model';
import {HypervisorBrowseService} from 'app/manage-protection/hypervisor/shared/hypervisor-browse.service';
import {FilterModel} from 'shared/models/filter.model';
import {RestoreItem} from 'app/manage-protection/hypervisor/restore';
import {NvPairModel} from 'shared/models/nvpair.model';
import {TranslateService} from '@ngx-translate/core';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {BaseHypervisorModel} from 'app/manage-protection/hypervisor/shared/base-hypervisor.model';
import {SnapshotModel} from 'app/manage-protection/hypervisor/shared/snapshot.model';
import {AlertComponent, AlertType, SdlSearchBarComponent} from 'app/shared/components';
import {Subscription} from 'rxjs';
import {HypervisorRestoreSelectionTableComponent}
  from 'app/manage-protection/hypervisor/restore/hypervisor-restore-selection-table/hypervisor-restore-selection-table.component';
import {HypervisorRestoreSourceTableComponent} from 'app/manage-protection/hypervisor/restore/hypervisor-restore-source-table';
import {SessionService} from 'core';

@Component({
  selector: 'snapshot-restore-hyperv-source',
  templateUrl: './snapshot-restore-hyperv-source.component.html',
  styleUrls: ['../snapshot-restore-hyperv.scss']
})
export class SnapshotRestoreHypervSourceComponent extends WizardPage<SnapshotRestoreHypervModel> implements OnInit,
  OnDestroy {
  @ViewChild(HypervisorRestoreSourceTableComponent) restoreSourceTable: HypervisorRestoreSourceTableComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(HypervisorRestoreSelectionTableComponent) restoreSelectionTable: HypervisorRestoreSelectionTableComponent;
  views: Array<NvPairModel> = [];
  view: NvPairModel;
  namePattern: string = '';
  vmbrowseService: HypervisorBrowseService;
  breadcrumbs: Array<any>;

  alert: AlertComponent;
  public clouds: Array<NvPairModel> = [];
  public repos: Array<NvPairModel> = [];
  public sites: Array<NvPairModel> = [];
  public snapshotFilters: Array<FilterModel> = [];
  private transSub: Subscription;
  private subscriptions: Subscription[] = [];

  private textConfirm: string;
  private textSwitchView: string;
  private restoreListConfirmChangeText: string;

  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  get summaryValue(): string {
    let me = this, names: string[] = [], items = me.getRestoreList();
    (items || []).forEach(function (item) {
      names.push(item.resource.name);
    });
    return names.join(', ');
  }

  constructor(private translate: TranslateService,
              private _vmbrowse: HypervisorBrowseService,
              private hypervisiorRestoreService: HypervisorRestoreService) {
    super();
    this.vmbrowseService = _vmbrowse;
    this.breadcrumbs = this.vmbrowseService.breadcrumbs;
  }

  ngOnInit(): void {
    let me = this;
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    // Initialize views.
    me.views.push(new NvPairModel('', 'vms'));
    me.view = me.views[0];

    me.transSub = me.translate.get([
      'common.textConfirm',
      'hypervisor.textSwitchView',
      'hypervisor.textForcedRestoreConfirmation',
      'hypervisor.textVMView',
      'hypervisor.restoreListConfirmChangeText'
    ])
      .subscribe((resource: Object) => {

        me.textConfirm = resource['common.textConfirm'];
        me.textSwitchView = resource['hypervisor.textSwitchView'];
        me.restoreListConfirmChangeText = resource['hypervisor.restoreListConfirmChangeText'];
        me.views[0].name = resource['hypervisor.textVMView'];
      });
  }

  ngOnDestroy(): void {
    let me = this;
    if (me.transSub)
      me.transSub.unsubscribe();

    if (me.subscriptions)
      me.unsubscribe(me.subscriptions);
  }

  validate(silent: boolean): boolean {
    let list = this.getRestoreList();
    return list && list.length > 0;
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (firstTime) {
      // Publish the sourceEligibility subject.
      me.publish<RestoreItem[]>({
        sourceEligibility: {
          initValue: null
        }
      });
      // Subscribe the sourceEligibility subject.
      me.subscriptions.push(...me.subscribe<RestoreItem[]>({
        sourceEligibility: {
          fn: (value: RestoreItem[]) => {
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

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  startSearch(force?: boolean, namePattern?: string): void {
    let me = this, crumb;

    if (namePattern !== undefined)
      me.namePattern = namePattern;

    let removeAllFilters = !(me.namePattern && me.namePattern.length > 0);
    if (!force && removeAllFilters) {
      crumb = me.vmbrowseService.currentBreadcrumb();
      if (crumb)
        me.onBreadcrumbClick(crumb);
    } else {
      if (me.restoreSourceTable)
        me.restoreSourceTable.searchVms(me.namePattern);
    }
  }

  onBreadcrumbClick(item: any, event?: any) {
    let me = this;

    if (me.restoreSourceTable) {
      me.restoreSourceTable.setView(me.view);
      if (item.resource) {
        me.restoreSourceTable.navigate(item.resource, event);
      } else
        me.restoreSourceTable.loadData();
    }
  }

  private excludeIneligibleSelections(eligibleItems: RestoreItem[]): void {
    let me = this, listComp = me.restoreSelectionTable,
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

  private handleSourceEligibility(eligibleItems: RestoreItem[]): void {
    this.excludeIneligibleSelections(eligibleItems);
  }

  private getRestoreList(): Array<RestoreItem> {
    let me = this;
    if (me.restoreSelectionTable)
      return me.restoreSelectionTable.getValue();
    return [];
  }

  private updateRestoreTable(): void {
    let me = this, list = [...me.model.source];
    if (me.restoreSelectionTable) {
      me.restoreSelectionTable.removeAll();
      list.forEach(function (source) {
        me.restoreSelectionTable.add(source);
      });
    }
  }

  private updateSourceSelection(): void {
    this.hypervisiorRestoreService.update(this.getRestoreList());
  }

  private removeRestoreItem() {
    let me = this;
    me.updateSourceSelection();
    me.model.source = me.getRestoreList();
  }

  private setWorkflowType(type: string): string {
    let workflowType: string = HypervisorRestoreService.IA_VAL;
    if (type !== 'vdisk') {
      workflowType = HypervisorRestoreService.IV_VAL;
    }
    return workflowType;
  }

  private onAddClick(event: { resource: BaseHypervisorModel, snapshot: SnapshotModel }): void {
    let me = this, item;
    if (me.restoreSelectionTable && event.resource) {
      item = new RestoreItem(event.resource, event.snapshot);
      if (me.model.sourceType !== event.resource.resourceType && !me.restoreListIsEmpty()) {
        let discardHandler = () => {
          me.restoreSelectionTable.remove(item);
          me.updateSourceSelection();
        };
        me.confirm(me.restoreListConfirmChangeText, () => {
          me.restoreSelectionTable.removeAll();
          me.model.sourceType = event.resource.resourceType;
          me.restoreSelectionTable.add(item);
          me.model.source = me.getRestoreList();
          me.model.workflowType = me.setWorkflowType(event.resource.resourceType);
          me.model.runType = 'test';
          // TODO Reset the model here just to be safe
        }, discardHandler);
      } else {
        me.model.sourceType = event.resource.resourceType;
      }

      me.restoreSelectionTable.add(item);
      me.model.source = me.getRestoreList();
      me.model.workflowType = me.setWorkflowType(event.resource.resourceType);
    }
  }

  private onViewClick(item: NvPairModel): void {
    let me = this, handler;
    if (me.view.value !== item.value) {
      handler = function () {
        let crumb;
        me.namePattern = '';
        if (me.searchBarComponent)
          me.searchBarComponent.reset();
        me.model.source = new Array<RestoreItem>();
        me.emptyResourceSelection();

        me.emptyRestoreList();

        me.view = item;
        crumb = me.vmbrowseService.firstBreadcrumb();
        if (me.restoreSourceTable) {
          me.restoreSourceTable.setView(item);
        }
        if (crumb)
          me.onBreadcrumbClick(crumb);
      };
      if (me.hasResourceSelection())
        me.confirm(me.textSwitchView, handler);
      else
        handler();
    }
  }

  private emptyResourceSelection(): void {
    let me = this;
    if (me.restoreSourceTable)
      me.restoreSourceTable.emptySelection();
  }

  private emptyRestoreList(): void {
    let me = this;
    if (me.restoreSelectionTable) {
      me.restoreSelectionTable.removeAll();
      me.model.source = me.getRestoreList();
      me.updateSourceSelection();
    }
  }

  private hasResourceSelection(): boolean {
    return this.getRestoreList().length > 0;
  }

  private confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler, discardHandler);
  }

  private restoreListIsEmpty(): boolean {
    return this.getRestoreList() && this.getRestoreList().length < 1;
  }

  private saveOptions(): void {
    let me = this,
      model = me.model;
    model.source = me.getRestoreList();
  }

  get sourceType(): string {
    let model = this.model;
    return model.source && model.source.length > 0 && model.source[0].resource ?
      model.source[0].resource.resourceType : '';
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      policy = model.policy;

    me.restoreSelectionTable.setSource(policy.spec.source);
    model.source = me.getRestoreList();
    model.sourceType = me.sourceType;
  }
}
