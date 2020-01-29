import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy, OnInit,
  Output
} from '@angular/core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {InventoryStatOptionCategoriesModel, InventoryStatOptionsModel} from '../inventory.model';
import {isNumeric} from 'rxjs/util/isNumeric';

@Component({
  selector: 'inventory-stat-options',
  templateUrl: './inventory-stat-options.component.html',
  styleUrls: ['./inventory-stat-options.component.scss'],
})
export class InventoryStatOptionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() view: NvPairModel;
  @Input() views: Array<NvPairModel> = [];
  @Input() model: InventoryStatOptionsModel;
  @Output() viewChange = new EventEmitter<NvPairModel>();
  @Output() apply = new EventEmitter<InventoryStatOptionsModel>();
  private dropdownMenuWidth: string;
  private resizeTimer: any;
  private options: InventoryStatOptionCategoriesModel[] = [
    // new InventoryStatOptionCategoriesModel(
    //   new NvPairModel('inventory.textProtectionThreshold', 'protectionThreshold'),
    //   [
    //     new NvPairModel('inventory.text25percent', 25),
    //     new NvPairModel('inventory.text50percent', 50),
    //     new NvPairModel('inventory.text75percent', 75),
    //     new NvPairModel('inventory.text100percent', 100)],
    //   'inventory.textProtectionThresholdTooltip'),
    new InventoryStatOptionCategoriesModel(
      new NvPairModel('inventory.textTimeRange', 'timeRange'),
      [
        new NvPairModel('inventory.text24hours', 1),
        new NvPairModel('inventory.text7days', 7),
        new NvPairModel('inventory.text30days', 30)])
  ];

  get hasViews(): boolean {
    return this.views && this.views.length > 0;
  }

  constructor(private element: ElementRef) {
  }

  ngOnInit(): void {
    this.selectByModel();
  }

  ngAfterViewInit(): void {
    this.bindResize();
  }

  ngOnDestroy(): void {
    this.unbindResize();
  }

  onViewClick(item: NvPairModel): void {
    let me = this;
    if (me.view.value !== item.value) {
      me.view = item;
      me.viewChange.emit(me.view);
    }
  }

  onApplyOptions(options: InventoryStatOptionCategoriesModel[]): void {
    let me = this;
    me.model = me.extractModel(options);
    me.apply.emit(me.model);
  }

  private bindResize(): void {
    this.resizeTimer = setInterval(this.detectResize.bind(this), 500);
  }

  private unbindResize(): void {
    if (this.resizeTimer)
      clearInterval(this.resizeTimer);
  }

  private detectResize(): void {
    let me = this,
      el = me.element.nativeElement && me.element.nativeElement.childNodes ?
        me.element.nativeElement.childNodes[0] : null;
    if (el && isNumeric(el.clientWidth) && el.clientWidth > 300) {
      me.dropdownMenuWidth = el.clientWidth + 'px';
    } else {
      me.dropdownMenuWidth = undefined;
    }
  }

  private extractSelection(options: InventoryStatOptionCategoriesModel[], key: string): NvPairModel {
    let result: NvPairModel,
      target: InventoryStatOptionCategoriesModel = (options || []).find(function (item) {
        return item.header.value === key;
      });
    if (target)
      result = target.selection;
    return result;
  }

  private extractModel(options: InventoryStatOptionCategoriesModel[]): InventoryStatOptionsModel {
    let me = this;
    return {
      protectionThreshold: me.extractSelection(options, 'protectionThreshold'),
      timeRange: me.extractSelection(options, 'timeRange')
    };
  }

  private setSelection(options: InventoryStatOptionCategoriesModel[], key: string, value: NvPairModel): NvPairModel {
    let result: NvPairModel,
      target: InventoryStatOptionCategoriesModel = (options || []).find(function (item) {
        return item.header.value === key;
      });
    if (target)
      target.selection = NvPairModel.find(target.categories || [], value.value);
    return result;
  }

  private selectByModel(): void {
    let me = this, model = me.model;
    if (model) {
      me.setSelection(me.options, 'protectionThreshold', me.model.protectionThreshold);
      me.setSelection(me.options, 'timeRange', me.model.timeRange);
    }
  }
}
