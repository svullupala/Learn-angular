import {Input, OnDestroy, OnInit} from '@angular/core';
import {
  InventoryDoughnutChartData,
  InventoryStatChart
} from 'inventory/stat-chart/inventory-stat-chart';
import {NvPairModel} from 'shared/models/nvpair.model';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs';
import {InventoryAggrCountResult, InventoryStatOptionsModel} from 'inventory/inventory.model';
import {FixedStack, StackItem} from '../../../../dashboard/shared/fixedstack.item';
import {SharedService} from 'shared/shared.service';
import {
  HypervisorInventoryService,
  HypervisorInventoryWorkflow,
  HypervisorRegistrationSubjectModel, HypervisorStatSubjectModel
} from '../hypervisor-inventory.service';
import {FilterModel} from 'shared/models/filter.model';
import {HypervisorsModel} from 'hypervisor/shared/hypervisors.model';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';

export class HypervisorStatChart extends InventoryStatChart implements OnInit, OnDestroy {
  @Input() distinctive: boolean = false;
  @Input() totalServersHidden: boolean = false;
  protected useDummyData: boolean = false; // Set to true when dummy data is used.
  protected textVMs: string;
  protected textDatastore: string;
  protected textTotalTpl: string;
  protected subs: Subject<void> = new Subject<void>();
  private api: string = 'api/endeavour/catalog/hypervisor/vm';
  private apiProtected: string = 'api/endeavour/catalog/recovery/hypervisorvm';
  private textTotalVMsTpl: string;
  private textTotalVolumesTpl: string;
  private textTotalTagsTpl: string;
  private textUnprotected: string;
  private textProtected: string;
  private textFailed: string;
  private textVMCount: string;
  private textVMsCount: string;
  private textVolumesCount: string;
  private textVolumeCount: string;
  private textVolumes: string;
  private textTagsCount: string;
  private textTagCount: string;
  private textTags: string;
  private textSelectCategoryInstruction: string;

  private UNPROTECTED: string = 'Unprotected';
  private PROTECTED: string = 'Protected';
  private FAILED: string = 'Failed';
  private MAXSHOWN: number = 3;
  private fixedStack: FixedStack = undefined;
  private totalServers: number = 0;
  private totalResources: number = 0;
  private aggrProtected: InventoryAggrCountResult[];
  private aggrTotal: InventoryAggrCountResult[];
  private aggrFailed: InventoryAggrCountResult[];

  get title(): string {
    return (this.totalServersHidden ? '' : SharedService.formatString(this.textTotalTpl, this.totalServers) + ' | ')
      + this.resourceTitle;
  }

  get resourceTitle(): string {
    let me = this, tpl: string;
      // view = me.view ? me.view.value : undefined;

    // tpl = view === 'tagview' ? me.textTotalTagsTpl :
    //   view === 'storageview' ? me.textTotalVolumesTpl :
    //     me.textTotalVMsTpl;
    tpl = me.textTotalVMsTpl;

    return SharedService.formatString(tpl, me.totalResources);
  }

  constructor(protected translate: TranslateService,
              protected hypervisorType: string,
              protected service: HypervisorInventoryService) {
    super();
  }

  ngOnInit() {
    let me = this;

    me.beforeViewsInit();

    me.views.push(
      new NvPairModel(me.textVMs, 'vms'),
      new NvPairModel(me.textDatastore, 'storageview'));

    me.translate.get([
      'inventory.textTotalVMsTpl',
      'inventory.textTotalTagsTpl',
      'inventory.textTotalVolumesTpl',
      'inventory.textUnprotected',
      'inventory.textProtected',
      'inventory.textFailed',
      'inventory.textVMCount',
      'inventory.textVMsCount',
      'hypervisor.textVMs',
      'inventory.textVolumesCount',
      'inventory.textVolumeCount',
      'hypervisor.textVolumes',
      'inventory.textTagsCount',
      'inventory.textTagCount',
      'inventory.textSelectCategoryInstruction',
      'hypervisor.textTags',
      'hypervisor.textDatastore']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textTotalVMsTpl = resource['inventory.textTotalVMsTpl'];
        me.textTotalTagsTpl = resource['inventory.textTotalTagsTpl'];
        me.textTotalVolumesTpl = resource['inventory.textTotalVolumesTpl'];
        me.textUnprotected = resource['inventory.textUnprotected'];
        me.textProtected = resource['inventory.textProtected'];
        me.textFailed = resource['inventory.textFailed'];
        me.textVMCount = resource['inventory.textVMCount'];
        me.textVMsCount = resource['inventory.textVMsCount'];
        me.textVMs = resource['hypervisor.textVMs'];
        me.textVolumesCount = resource['inventory.textVolumesCount'];
        me.textVolumeCount = resource['inventory.textVolumeCount'];
        me.textVolumes = resource['hypervisor.textVolumes'];
        me.textTagsCount = resource['inventory.textTagsCount'];
        me.textTagCount = resource['inventory.textTagCount'];
        me.textTags = resource['hypervisor.textTags'];

        me.textDatastore = resource['hypervisor.textDatastore'];
        me.textSelectCategoryInstruction = resource['inventory.textSelectCategoryInstruction'];

        NvPairModel.setName(me.views, 'vms', me.textVMs);
        NvPairModel.setName(me.views, 'storageview', me.textDatastore);

        me.view = me.view || me.views[0];
        me.afterViewsInit();
      });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  protected beforeViewsInit(): void {
  }

  protected afterViewsInit(): void {
  }

  onViewChange(view: NvPairModel): void {
    let me = this;
    me.refresh();
    super.onViewChange(view);
    me.service.next<HypervisorStatSubjectModel>('stat',
      {workflow: me.hypervisorType as HypervisorInventoryWorkflow, action: 'activate-view', target: view});
  }

  onApply(options: InventoryStatOptionsModel): void {
    let me = this;
    me.refresh();
    super.onApply(options);
    me.service.next<HypervisorStatSubjectModel>('stat',
      {workflow: me.hypervisorType as HypervisorInventoryWorkflow, action: 'apply-options', target: options});
  }

  /**
   * Refresh aggregate data.
   *
   * 1. To get total number of VMs per vCenter/Hyper-V Server or hypervisorType
   *  /api/endeavour/catalog/hypervisor/vm?action=aggregate
   *  Aggr expression for per vCenter/Hyper-V Server:
   *  {"op":[\{"operation":"count","fieldname":"hypervisorManagementServerID", "outputname":"count"}
   *  ],"group":["hypervisorManagementServerID"]}
   *  Aggr expression for per hypervisorType:
   *  {"op":[\{"operation":"count","fieldname":"hypervisorType", "outputname":"count"}
   *  ],"group":["hypervisorType"]}
   * 2. To get total number of protected VMs per vCenter/Hyper-V Server or hypervisorType
   *  /api/endeavour/catalog/recovery/hypervisorvm?action=aggregate
   *  Aggr expression for per vCenter/Hyper-V Server:
   *  {"op":[\{"operation":"count","fieldname":"hypervisorManagementServerID", "outputname":"count"}
   *  ],"group":["hypervisorManagementServerID"]}
   *  Aggr expression for per hypervisorType:
   *  {"op":[\{"operation":"count","fieldname":"hypervisorType", "outputname":"count"}
   *  ],"group":["hypervisorType"]}
   * 3. To get total number of unprotected VMs per vCenter/Hyper-V Server or hypervisorType
   *  Just subtract Protected from Total per vCenter/Hyper-V Server.
   */
  refresh() {
    this.loadData();
  }

  protected loadData(): void {
    let me = this, filters = [new FilterModel('type', me.hypervisorType)],
      observable = HypervisorsModel.retrieve<HypervisorModel, HypervisorsModel>(HypervisorsModel,
        me.service.proxy, filters, undefined, 0, 0);

    if (observable)
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.totalServers = dataset.total;

            me.service.next<HypervisorRegistrationSubjectModel>('registration',
              {workflow: me.hypervisorType as HypervisorInventoryWorkflow, action: 'list', target: dataset});

            me.getAggrTotal();
            me.getAggrProtected();
            me.getAggrFailed();
          }
        }
      );
  }

  protected getAggrTotal(): void {
    let me = this;
    if (me.service) {
      me.aggrTotal = undefined;
      me.service.getAggrGroupCount(me.api,
        'hypervisorManagementServerID',
        'hypervisorManagementServerID', me.hypervisorType).takeUntil(me.subs).subscribe(
        res => {
          me.aggrTotal = res;
          if (me.aggrResultReady)
            me.handleAggrResult();
        }
      );
    }
  }

  protected getAggrProtected(): void {
    let me = this;
    if (me.service) {
      me.aggrProtected = undefined;
      me.service.getAggrGroupCount(me.apiProtected,
        'hypervisorType',
        'hypervisorType', me.hypervisorType).takeUntil(me.subs).subscribe(
        res => {
          me.aggrProtected = res;
          if (me.aggrResultReady)
            me.handleAggrResult();
        }
      );
    }
  }

  protected getAggrFailed(): void {
    // TODO: To get total number of failed VMs per vCenter/Hyper-V Server when the related API is ready.
  }

  get aggrTotalReady(): boolean {
    return !!this.aggrTotal;
  }

  get aggrProtectedReady(): boolean {
    return !!this.aggrProtected;
  }

  get aggrFailedReady(): boolean {
    return !!this.aggrFailed;
  }

  get aggrResultReady(): boolean {
    return this.aggrTotalReady && this.aggrProtectedReady;
    // TODO: add condition - && this.aggrFailedReady when the related API is ready.
  }

  protected sumAggrResult(data: InventoryAggrCountResult[]): number {
    let sum = 0;
    (data || []).forEach(function (item) {
      sum += item.count;
    });
    return sum;
  }

  handleAggrResult(): void {
    let me = this, sServers = (me.aggrTotal || []).length,
      sTotal = me.sumAggrResult(me.aggrTotal),
      sProtected = me.sumAggrResult(me.aggrProtected),
      sFailed = me.sumAggrResult(me.aggrFailed),
      sUnprotected = sTotal - sProtected - sFailed;

    if (me.useDummyData) {
      sServers = me.getRandom(20);
      if (sServers === 0)
        sServers = 1;
      sUnprotected = me.getRandom(200);
      sFailed = me.getRandom(100);
      sProtected = me.getRandom(600);
      sTotal = sUnprotected + sFailed + sProtected;
      me.totalServers = sServers;
    }
    if (sUnprotected < 0)
      sUnprotected = 0;
    me.totalResources = sTotal;
    me.fixedStack = me.createFixedStack();

    me.fixedStack.push(new StackItem(me.UNPROTECTED, sUnprotected));
    me.fixedStack.push(new StackItem(me.FAILED, sFailed));
    me.fixedStack.push(new StackItem(me.PROTECTED, sProtected));
    me.chartData = me.toDoughnutChartData(me.fixedStack);
  }

  private getRandom(max: number): number {
    return Math.floor(Math.random() * max);
  }

  private getSecondaryLabel(item: StackItem): string {
    let me = this, name: string = item ? (item.label || '') : 'N/A';
    if (name.toUpperCase() === me.UNPROTECTED.toUpperCase()) {
      return 'inventory.textUnprotectedDesc';
    } else if (name.toUpperCase() === me.PROTECTED.toUpperCase()) {
      return 'inventory.textProtectedDesc';
    } else if (name.toUpperCase() === me.FAILED.toUpperCase()) {
      return 'inventory.textFailedDesc';
    }
    return '';
  }

  private getPrimaryLabel(item: StackItem): string {
    let me = this, name: string = item ? (item.label || '') : 'N/A';
    if (name.toUpperCase() === me.UNPROTECTED.toUpperCase()) {
      return me.textUnprotected;
    } else if (name.toUpperCase() === me.PROTECTED.toUpperCase()) {
      return me.textProtected;
    } else if (name.toUpperCase() === me.FAILED.toUpperCase()) {
      return me.textFailed;
    }
    return '';
  }

  private isBanner(item: StackItem): boolean {
    return item && (item.label || '').toUpperCase() === this.PROTECTED.toUpperCase();
  }

  private getSummary(count: number): string {
    let me = this, tpl: string;
      // view = me.view ? me.view.value : undefined;

    if (count === 1) {
      // tpl = view === 'tagview' ? me.textTagCount :
      //   view === 'storageview' ? me.textVolumeCount :
      //     me.textVMCount;
      tpl = me.textVMCount;
    } else {
      // tpl = view === 'tagview' ? me.textTagsCount :
      //   view === 'storageview' ? me.textVolumesCount :
      //     me.textVMsCount;
      tpl = me.textVMsCount;
    }
    return SharedService.formatString(tpl, count);
  }

  private toDoughnutChartData(stack: FixedStack): InventoryDoughnutChartData[] {
    let me = this, precise: boolean = false,
      values: StackItem[], retVal: InventoryDoughnutChartData[] = [];

    if (!stack)
      return retVal;

    values = stack.getLengthContents(me.MAXSHOWN, undefined, true);

    precise = me.needPrecise(values);
    for (let i = 0; i < values.length; i++) {
      let title: string = values[i] ? values[i].label : 'N/A',
        v = new InventoryDoughnutChartData(values[i].value, me.getColor(title, i),
          me.service.getHighlightColor(), values[i].label,
          me.getPercentage(values[i], values, precise), i,
          me.getPrimaryLabel(values[i]), me.getSecondaryLabel(values[i]),
          me.getSummary(values[i].value), me.isBanner(values[i]),
          me.getOuterRadius(title), me.getPercentageInnerCutout(title),
          me.isLabelHidden(title), me.textSelectCategoryInstruction);
      retVal.push(v);
    }

    return retVal;
  }

  private getColor(name: string, order: number): string {
    let me = this;
    if (name && typeof name === 'string') {
      if (name.toUpperCase() === me.UNPROTECTED.toUpperCase()) {
        return me.service.getUnprotectedColor(me.distinctive);
      } else if (name.toUpperCase() === me.PROTECTED.toUpperCase()) {
        return me.service.getProtectedColor(me.distinctive);
      } else if (name.toUpperCase() === me.FAILED.toUpperCase()) {
        return me.service.getFailedColor(me.distinctive);
      }
    }
    return me.service.getColor(order);
  }

  private getOuterRadius(name: string): number {
    let me = this;
    if (me.distinctive && name && typeof name === 'string' && name.toUpperCase() === me.PROTECTED.toUpperCase())
      return 92;
    return undefined;
  }

  private getPercentageInnerCutout(name: string): number {
    let me = this;
    if (me.distinctive && name && typeof name === 'string' && name.toUpperCase() === me.PROTECTED.toUpperCase())
      return 72;
    return undefined;
  }

  private isLabelHidden(name: string): boolean {
    let me = this;
    if (me.distinctive && name && typeof name === 'string' && name.toUpperCase() === me.PROTECTED.toUpperCase())
      return true;
    return false;
  }

  private fixPercent(percent: number): number {
    return (percent < 0) ? 0 : (percent > 100 ? 100 : percent);
  }

  private needPrecise(values: StackItem[]): boolean {
    let me = this, sum = this.getSum(values), target: StackItem = (values || []).find(function (item) {
      let percent = Math.round(item.value * 100 / sum);
      return (percent === 0 && item.value >= 1);
    });
    if (!target) {
      let percentSum: number = 0;
      (values || []).forEach(function (item) {
        let percent = Math.round(item.value * 100 / sum);
        percentSum += me.fixPercent(percent);
      });
      return percentSum !== 100;
    }
    return true;
  }

  private getPercentage(value: StackItem, values: StackItem[], precise?: boolean): number {
    let me = this, percent: number = 0, sum = this.getSum(values);
    if (sum > 0) {
      percent = precise ? Math.round(value.value * 10000 / sum) / 100 : Math.round(value.value * 100 / sum);
      percent = me.fixPercent(percent);
    }
    return percent;
  }

  private getSum(values: StackItem[]): number {
    let retVal: number = 0;
    for (let i = 0; i < values.length; i++) {
      retVal += values[i].value;
    }
    return retVal;
  }

  private createFixedStack(): FixedStack {
    let me = this, retVal: FixedStack = new FixedStack();
    retVal.pushItem(me.UNPROTECTED, 0);
    retVal.pushItem(me.FAILED, 0);
    retVal.pushItem(me.PROTECTED, 0);
    return retVal;
  }
}
