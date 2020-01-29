import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnChanges, SimpleChanges,
      SimpleChange, Input, Output, EventEmitter } from '@angular/core';
import * as Chart from 'chart.js';


@Component({
  selector: 'percentage-doughnut-chart',
  templateUrl: './percentage-doughnut-chart.component.html',
  styleUrls: ['./percentage-doughnut-chart.scss']
})
export class PercentageDoughnutChartComponent implements OnInit, AfterViewInit, OnChanges {
  // global unique id
  @Input() chartId: string;
  @Input() percentage: number = 0;
  @Input() label: string;
  @Input() labelColor: string;
  @Input() backgroundColor: string = '#d6d5d5';
  @Input() backgroundHoverColor: string;
  @Input() progressColor: string = '#317ebc';
  @Input() progressHoverColor: string;
  @Input() toolTipText: string;
  @Input() hasAnimation: boolean = true;
  // chart Width and Height (px)
  @Input() chartSize: number = 100;
  @Input() chartThickness: number = 15;

  @Input() hoverTooltipText: string = '';

  @Input() labelClickable: boolean = false;
  @Input() enableHalfDoughnut: boolean = false;
  @Output() labelWasClicked = new EventEmitter();

  private myDoughnutChart: any = undefined;
  private ctx: any;
  private canvas: any;
  private chartRotation: number;
  private chartHeight: number;

  constructor() {
  }

  ngOnInit() {
    let me = this;
    me.chartHeight = me.chartSize;
    if (me.enableHalfDoughnut) {
      me.chartRotation = -90;
      me.chartHeight = me.chartSize / 2;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['percentage'] || changes['progressColor']) {
      let change = changes['percentage'];
      this.updateChart();
    }
  }

  private updateChart(): void {
    let me = this, data = me._chartData();
    me._initChart(data);
  }

  private _chartData(): DoughnutChartData[] {
      let me = this, zeroData: DoughnutChartData[] = [
        new DoughnutChartData(
          me.enableHalfDoughnut ? me.percentage / 2 : me.percentage,
          me.progressColor,
          me.progressHoverColor ? me.progressHoverColor : me.progressColor,
          '', 0, 0, ' ', ' '),
        new DoughnutChartData(
          me.enableHalfDoughnut ? (100 - me.percentage) / 2 : (100 - me.percentage),
          me.backgroundColor,
          me.backgroundHoverColor ? me.backgroundHoverColor : me.backgroundColor,
          '',
          0, 0, ' ', ' '),
        new DoughnutChartData(
          me.enableHalfDoughnut ? 50 : 0,
          'transparent',
          'transparent',
          '',
          0, 0, ' ', ' ')
      ];

      return zeroData;
  }

  private _updateChart(data: DoughnutChartData[]): void {
    return undefined;
  }

  private _initChart(data: DoughnutChartData[]): void {
    let me = this;
    if (me.ctx) {
      me.myDoughnutChart = new Chart(me.ctx).Doughnut(data, {
        responsive: true,
        animation: me.hasAnimation,
        percentageInnerCutout: (1 - me.chartThickness * 2 / me.chartSize ) * 100,
        showTooltips: false
      });
    }
  }

  ngAfterViewInit() {
    let me = this;

    me.canvas = document.getElementById(this.chartId);
    me.ctx = me.canvas.getContext('2d');

    this.updateChart();
  }

  handleClick() {
    if (this.labelClickable) {
      this.labelWasClicked.emit();
    }
  }
}

export class DoughnutChartData {
  constructor(public value: number, public color: string, public highlight: string,
    public label: string, public percentage: number, public order: number,
    public primaryLabel: string, public secondaryLabel: string) { }
}
