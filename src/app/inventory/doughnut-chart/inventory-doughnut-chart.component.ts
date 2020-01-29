import {
  Component,
  Input,
  OnChanges,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  TemplateRef,
  Output, EventEmitter
} from '@angular/core';
import * as Chart from 'chart.js';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';
import {InventoryDoughnutChartData, InventoryDoughnutChartPosition} from '../stat-chart/inventory-stat-chart';

Chart.types.Doughnut.extend({
  name: 'InventoryDoughnut',

  addData: function (segment, atIndex, silent) {
    var index = atIndex !== undefined ? atIndex : this.segments.length;
    if (typeof (segment.color) === 'undefined') {
      segment.color =
        Chart.defaults.global.segmentColorDefault[index % Chart.defaults.global.segmentColorDefault.length];
      segment.highlight = Chart.defaults.global.segmentHighlightColorDefaults
        [index % Chart.defaults.global.segmentHighlightColorDefaults.length];
    }
    this.segments.splice(index, 0, new this.SegmentArc({
      value: segment.value,
      outerRadius: (this.options.animateScale) ? 0 : segment.outerRadius || this.outerRadius,
      innerRadius: (this.options.animateScale) ? 0 :
        (this.outerRadius / 100) * (segment.percentageInnerCutout || this.options.percentageInnerCutout),
      percentageInnerCutout: segment.percentageInnerCutout,
      fillColor: segment.color,
      highlightColor: segment.highlight || segment.color,
      showStroke: this.options.segmentShowStroke,
      strokeWidth: this.options.segmentStrokeWidth,
      strokeColor: this.options.segmentStrokeColor,
      startAngle: Math.PI * 1.5,
      circumference: (this.options.animateRotate) ? 0 : this.calculateCircumference(segment.value),
      label: segment.label
    }));
    if (!silent) {
      this.reflow();
      this.update();
    }
  },

  reflow: function () {
    Chart.helpers.extend(this.SegmentArc.prototype, {
      x: this.chart.width / 2,
      y: this.chart.height / 2
    });
    this.outerRadius = (Chart.helpers.min([this.chart.width, this.chart.height]) - this.options.segmentStrokeWidth / 2)
      / 2;
    Chart.helpers.each(this.segments, function (segment) {
      segment.update({
        outerRadius: segment.outerRadius || this.outerRadius,
        innerRadius: (this.outerRadius / 100) * (segment.percentageInnerCutout || this.options.percentageInnerCutout)
      });
    }, this);
  },

  draw: function (easeDecimal) {
    var animDecimal = (easeDecimal) ? easeDecimal : 1;
    this.clear();
    Chart.helpers.each(this.segments, function (segment, index) {
      segment.transition({
        circumference: this.calculateCircumference(segment.value),
        outerRadius: segment.outerRadius || this.outerRadius,
        innerRadius: (this.outerRadius / 100) * (segment.percentageInnerCutout || this.options.percentageInnerCutout)
      }, animDecimal);

      segment.endAngle = segment.startAngle + segment.circumference;

      segment.draw();
      if (index === 0) {
        segment.startAngle = Math.PI * 1.5;
      }
      // Check to see if it's the last segment, if not get the next and update the start angle
      if (index < this.segments.length - 1) {
        this.segments[index + 1].startAngle = segment.endAngle;
      }
    }, this);
  }
});

@Component({
  selector: 'inventory-doughnut-chart',
  templateUrl: './inventory-doughnut-chart.component.html',
  styleUrls: ['./inventory-doughnut-chart.scss']
})
export class InventoryDoughnutChartComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() header: string | TemplateRef<any>;
  @Input() title: string | TemplateRef<any>;
  @Input() titleCentered: boolean = false;
  @Input() banner: string | TemplateRef<any>;
  @Input() data: InventoryDoughnutChartData[];
  @Input() zeroChartColor: string = 'whitesmoke';
  @Input() zeroChartLabel;

  @Output() itemSelect = new EventEmitter<InventoryDoughnutChartData>();

  @ViewChild('chartarea') chartAreaRef: ElementRef;

  private labelPositions: InventoryDoughnutChartPosition[];
  private ctx: CanvasRenderingContext2D;
  private chartArea: any = undefined;
  private doughnutChart: any = undefined;
  private selectedItem: InventoryDoughnutChartData;

  constructor(private translate: TranslateService) {
  }

  ngOnChanges() {
    let me = this;
    if (me.isReady()) {
      setTimeout(() => {
        me.refresh();
      }, 100);
    }
  }

  ngAfterViewInit() {
    let me = this;
    if (me.chartAreaRef)
      me.chartArea = jQuery(me.chartAreaRef.nativeElement);
    me.ctx = me.chartArea.get(0).getContext('2d');
  }

  ngOnInit() {
    this.translate.get([
      'common.textNoData',
    ]).subscribe(
      resource => {
        this.zeroChartLabel = resource['common.textNoData'];
      }
    );
  }

  get bannerDataItem(): InventoryDoughnutChartData {
    let target: InventoryDoughnutChartData =
      (this.data || []).find(function (item) {
        return item.banner;
      });
    if (!target) {
      (this.data || []).forEach(function (item) {
        if (!target || item.percentage > target.percentage)
          target = item;
      });
    }
    return target;
  }

  get bannerPrimay(): string {
    let target = this.bannerDataItem;
    return target ? target.percentage + '%' : '';
  }

  get bannerSecondary(): string {
    let target = this.bannerDataItem;
    return target ? target.primaryLabel : '';
  }

  get noData(): boolean {
    return !this.data || this.isZeroData(this.data);
  }

  labelPosition(ce: any): InventoryDoughnutChartPosition {
    let offset = 48, innerRadius: number, outerRadius: number,
      centreAngle: number, rangeFromCentre: number;
    if (!ce)
      return null;

    innerRadius = ce.outerRadius;
    outerRadius = ce.outerRadius + offset;
    centreAngle = ce.startAngle + ((ce.endAngle - ce.startAngle) / 2);
    rangeFromCentre = (outerRadius - innerRadius) / 2 + innerRadius;
    return {
      x: ce.x + (Math.cos(centreAngle) * rangeFromCentre),
      y: ce.y + (Math.sin(centreAngle) * rangeFromCentre)
    };
  }

  extractLabelPositions(): InventoryDoughnutChartPosition[] {
    let me = this,
      segments, result: InventoryDoughnutChartPosition[] = [],
      chart = me.doughnutChart;
    if (chart) {
      segments = chart.segments;
      if (segments && segments.length > 0) {
        segments.forEach((item) => {
          let pos = me.labelPosition(item);
          if (pos)
            result.push(pos);
        });
      }
    }
    return result;
  }

  public refresh() {
    if (this.isZeroData(this.data)) {
      this.zero();
    } else {
      if (!this.doughnutChart) {
        this.load();
      } else {
        this.update();
      }
    }
  }

  isZeroData(data): boolean {
    for (let i = 0; i < data.length; i++) {
      if (data[i].value !== 0) {
        return false;
      }
    }
    return true;
  }

  onDrawComplete(): void {
    this.labelPositions = this.extractLabelPositions();
  }

  onChannelClick(item: InventoryDoughnutChartData): void {
    let me = this;
    if (!me.selectedItemMatching(item)) {
      me.selectedItem = item;
      me.itemSelect.emit(me.selectedItem);
    }
  }

  deselect(): void {
    this.selectedItem = undefined;
  }

  isSelected(item: InventoryDoughnutChartData): boolean {
    let si = this.selectedItem;
    return si === item || si && si.label === item.label;
  }

  public zero() {
    let me = this,
      zeroData: InventoryDoughnutChartData[] = [new InventoryDoughnutChartData(1,
        me.zeroChartColor, me.zeroChartColor, me.zeroChartLabel, 100, 0, ' ', ' ')];

    if (me.doughnutChart)
      me.doughnutChart.destroy();

    me.doughnutChart = new Chart(me.ctx).InventoryDoughnut(zeroData, {
      segmentShowStroke: false,
      percentageInnerCutout: 64,
      responsive: true,
      animation: false,
      tooltipTemplate: '<%if (label){%><%=label%><%}%>'
    });
  }

  public update() {
    let me = this;
    if (me.doughnutChart)
      me.doughnutChart.destroy();

    me.doughnutChart = new Chart(me.ctx).InventoryDoughnut(me.data, {
      segmentShowStroke: false,
      percentageInnerCutout: 64,
      responsive: true,
      animation: false
    });
    me.onDrawComplete();
  }

  public load() {
    let me = this;
    me.doughnutChart = new Chart(me.ctx).InventoryDoughnut(me.data, {
      segmentShowStroke: false,
      percentageInnerCutout: 64,
      responsive: true,
      animation: true,
      onAnimationComplete: () => {
        me.onDrawComplete();
      }
    });
  }

  public isReady(): boolean {
    return !!this.chartArea && !!this.data;
  }

  private ellipsisPath(value: string, length: number = 20): string {
    return SharedService.ellipsisPath(value, length);
  }

  private tooltip(item: InventoryDoughnutChartData): string {
    let instruction = this.actionInstruction(item),
      tpl = this.isSelected(item) || !instruction ? '{0} {1}' : '{0} {1}. {2}';
    return SharedService.formatString(tpl,
      this.percentage(item),
      this.primaryLabel(item),
      instruction
    );
  }

  private primaryLabel(item: InventoryDoughnutChartData): string {
    return item ? (item.primaryLabel || '').toLowerCase() : '';
  }

  private actionInstruction(item: InventoryDoughnutChartData): string {
    return item ? (item.actionInstruction || '') : '';
  }

  private percentage(item: InventoryDoughnutChartData): string {
    return item ? item.percentage + '%' : '';
  }

  private labelStyle(pos: InventoryDoughnutChartPosition, idx: number): object {
    let data = this.data,
      style: object = {
        marginLeft: (pos.x - 16) + (pos.x !== 0 ? 'px' : ''),
        marginTop: (pos.y - 8) + (pos.y !== 0 ? 'px' : '')
      };
    if (!data || !data[idx] || data[idx].percentage === 0 || data[idx].labelHidden)
      style['display'] = 'none';
    return style;
  }

  private selectedItemMatching(item: InventoryDoughnutChartData): boolean {
    let si = this.selectedItem;
    return this.isSelected(item) && si && si.value === item.value;
  }
}

