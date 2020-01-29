import { Component, Input, OnChanges, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import {AggrCountResult, DashboardService} from '../dashboard.service';
import * as Chart from 'chart.js';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.scss']
})
export class DoughnutChartComponent implements OnChanges, OnInit, AfterViewInit {

  @ViewChild('chartarea') chartAreaRef: ElementRef;
  @ViewChild('chartarea3') chartAreaRef3: ElementRef;
  @ViewChild('chartarea2') chartArea2Ref: ElementRef;
  chartArea: any;
  chartArea2: any;

  @Input()
  public data: DoughnutChartData[] = undefined;
  @Input()
  public dataDb: DoughnutChartData[] = undefined;
  @Input()
  public zeroChartColor: string = 'whitesmoke';
  @Input()
  public zeroChartLabel;
  @Input() splitDonut: boolean = false;

  private doughnutChart: any = undefined;
  private doughnutChart2: any = undefined;

  constructor(private translate: TranslateService) {}

  ngOnChanges() {
    let me = this;
    if (this.isReady()) {
      setTimeout(() => {
        me.refresh();
      }, 100);
    }
  }

  ngAfterViewInit() {
    if (this.chartAreaRef) {
      this.chartArea = jQuery(this.chartAreaRef.nativeElement);
    } else if (this.chartAreaRef3) {
      this.chartArea = jQuery(this.chartAreaRef3.nativeElement);
    }
    if (this.splitDonut) {
      this.chartArea2 = jQuery(this.chartArea2Ref.nativeElement);
    }
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

  public refresh() {
    if (this.isZeroData(this.data)) {
      this.zero(false);
    } else {
      if (!this.doughnutChart) {
        this.load();
      } else {
        this.update();
      }
    }

    if (this.splitDonut) {
      if (this.isZeroData(this.dataDb)) {
        this.zero(true);
      } else {
        if (!this.doughnutChart2) {
          this.load(true);
        } else {
          this.update(true);
        }
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

  public zero(dbChart: boolean = false) {
    let zeroData: DoughnutChartData[] = [new DoughnutChartData(1,
      this.zeroChartColor, this.zeroChartColor, this.zeroChartLabel, 100, 0, ' ', ' ')];
    if (dbChart) {
      if (this.chartArea2Ref) {
        this.doughnutChart2 = new Chart(this.chartArea2.get(0).getContext('2d')).Doughnut(zeroData, {
          segmentShowStroke: false,
          percentageInnerCutout: 64,
          responsive: true,
          animation: false
        });
      }
    } else {
      if (this.chartAreaRef) {
        this.doughnutChart = new Chart(this.chartArea.get(0).getContext('2d')).Doughnut(zeroData, {
          segmentShowStroke: false,
          percentageInnerCutout : 64,
          responsive: true,
          animation: false
        });
      } else {
        if (this.chartAreaRef) {
          this.chartArea = jQuery(this.chartAreaRef.nativeElement);
        } else if (this.chartAreaRef3) {
          this.chartArea = jQuery(this.chartAreaRef3.nativeElement);
        }
        this.doughnutChart = new Chart(this.chartArea.get(0).getContext('2d')).Doughnut(zeroData, {
          segmentShowStroke: false,
          percentageInnerCutout : 64,
          responsive: true,
          animation: false
        });
      }
    }
  }

  public update(dbChart: boolean = false) {
    // TODO: newer version of chart.js is required for a real update
    if (dbChart) {
      if (this.chartArea2Ref) {
        this.doughnutChart2 = new Chart(this.chartArea2.get(0).getContext('2d')).Doughnut(this.dataDb, {
          segmentShowStroke: false,
          percentageInnerCutout: 64,
          responsive: true,
          animation: false
        });
      }
    } else {
      if (this.chartAreaRef) {
        this.doughnutChart = new Chart(this.chartArea.get(0).getContext('2d')).Doughnut(this.data, {
          segmentShowStroke: false,
          percentageInnerCutout : 64,
          responsive: true,
          animation: false
        });
      } else {
        if (this.chartAreaRef) {
          this.chartArea = jQuery(this.chartAreaRef.nativeElement);
        } else if (this.chartAreaRef3) {
          this.chartArea = jQuery(this.chartAreaRef3.nativeElement);
        }
        this.doughnutChart = new Chart(this.chartArea.get(0).getContext('2d')).Doughnut(this.data, {
          segmentShowStroke: false,
          percentageInnerCutout : 64,
          responsive: true,
          animation: false
        });
      }
    }
  }

  public load(dbChart: boolean = false) {
      if (dbChart) {
        if (this.chartArea2Ref) {
          this.doughnutChart2 = new Chart(this.chartArea2.get(0).getContext('2d')).Doughnut(this.dataDb, {
            segmentShowStroke: false,
            percentageInnerCutout: 64,
            responsive: true
          });
        }
      } else {
        if (this.chartAreaRef) {
          this.doughnutChart = new Chart(this.chartArea.get(0).getContext('2d')).Doughnut(this.data, {
            segmentShowStroke: false,
            percentageInnerCutout : 64,
            responsive: true
          });
        } else {
          if (this.chartAreaRef) {
            this.chartArea = jQuery(this.chartAreaRef.nativeElement);
          } else if (this.chartAreaRef3) {
            this.chartArea = jQuery(this.chartAreaRef3.nativeElement);
          }
          this.doughnutChart = new Chart(this.chartArea.get(0).getContext('2d')).Doughnut(this.data, {
            segmentShowStroke: false,
            percentageInnerCutout : 64,
            responsive: true,
            animation: false
          });
        }
      }
  }

  public isReady(): boolean {
    if (this.data === undefined) {
      return false;
    }
    if (this.splitDonut && this.dataDb === undefined) {
      return false;
    }

    return true;
  }

  private ellipsisPath(value: string, length: number = 20): string {
    return SharedService.ellipsisPath(value, length);
  }
}

export class DoughnutChartData {
  constructor(public value: number, public color: string, public highlight: string,
              public label: string, public percentage: number, public order: number,
              public primaryLabel: string, public secondaryLabel: string) { }
}
