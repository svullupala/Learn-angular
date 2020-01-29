import {AfterViewInit, EventEmitter, Input, OnDestroy, Output, TemplateRef} from '@angular/core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {InventoryStatOptionsModel} from '../inventory.model';

export type InventoryDoughnutChartPosition = {
  x: number;
  y: number;
};

export class InventoryDoughnutChartData {
  constructor(public value: number, public color: string, public highlight: string,
              public label: string, public percentage: number, public order: number,
              public primaryLabel: string, public secondaryLabel: string,
              public summary?: string, public banner?: boolean,
              public outerRadius?: number, public percentageInnerCutout?: number,
              public labelHidden?: boolean, public actionInstruction?: string) {
  }
}

export class InventoryStatChart implements OnDestroy, AfterViewInit {
  @Input() hasToolbar: boolean = true;
  @Input() view: NvPairModel;
  @Input() views: Array<NvPairModel> = [];
  @Input() options: InventoryStatOptionsModel = {
    protectionThreshold: new NvPairModel('inventory.text50percent', 50),
    timeRange: new NvPairModel('inventory.text7days', 7)
  };

  @Output() viewChange = new EventEmitter<NvPairModel>();
  @Output() apply = new EventEmitter<InventoryStatOptionsModel>();
  @Input() rate: number = 10000;
  @Input() title: string | TemplateRef<any>;
  @Input() titleCentered: boolean = false;
  @Input() chartData: InventoryDoughnutChartData[] = undefined;
  @Output() itemSelect = new EventEmitter<InventoryDoughnutChartData>();

  private refreshTimer: any;

  ngOnDestroy(): void {
    this.unbindRefresh();
  }

  ngAfterViewInit(): void {
    this.bindRefresh();
    this.refresh();
  }

  onViewChange(view: NvPairModel): void {
    this.viewChange.emit(view);
  }

  onApply(options: InventoryStatOptionsModel): void {
    this.options = options;
    this.apply.emit(options);
  }

  onItemSelect(item: InventoryDoughnutChartData): void {
    this.itemSelect.emit(item);
  }

  refresh() {
  }

  private bindRefresh(): void {
    this.refreshTimer = setInterval(this.refresh.bind(this), this.rate);
  }

  private unbindRefresh(): void {
    if (this.refreshTimer)
      clearInterval(this.refreshTimer);
  }
}
