import {Component, OnDestroy, Input, OnInit, AfterViewInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {FilesystemModel, MetricsModel, SystemInfoService} from './system-info.service';
import {FileSizePipe} from 'shared/pipes/file-size.pipe';
import {DecimalPipe, PercentPipe} from '@angular/common';
import {ProgressBarStatus, ProgressBarComponent} from 'shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'cpu-usage-metrics',
  templateUrl: './cpu-usage-metrics.component.html',
  styleUrls: ['./cpu-usage.scss']
})
export class CPUUsageMetricsComponent implements OnDestroy, AfterViewInit, OnInit {
  metrics: MetricsModel = undefined;
  title: string;
  textCPU: string;
  textCPUSubLabel: string;
  textPctUsed: string;
  
  @Input()
  rate: number = 1000;

  @Input()
  percentDanger: number = 90;

  @Input()
  percentWarning: number  = 80;

  private sub: any [] = [];
  private fileSize: FileSizePipe = undefined;

  constructor(private service: SystemInfoService,
              private translate: TranslateService,
              private decimalPipe: DecimalPipe,
              private percent: PercentPipe) {
    this.fileSize = new FileSizePipe(translate, decimalPipe);
  }

  getProgressBarStatus(percentage: number): ProgressBarStatus {
    if (percentage >= this.percentDanger) {
      return 'critical';
    } else if (percentage >= this.percentWarning) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  getCPUTotalLabel() {
    if (this.metrics) {
      return this.percent.transform((this.metrics.cpu || 0) / 100, '1.0-0');
    }

    return '';
  }

  ngOnDestroy() {
    for (let i = 0; i < this.sub.length; i++) {
      if (this.sub[i])  {
        this.sub[i].unsubscribe();
      }
    }
  }

  ngAfterViewInit() {
    this.initClock();
    this.refresh();
  }

  ngOnInit() {
    this.init();
  }


  private refresh() {
    this.sub.push(this.service.getMetrics().subscribe(
      metrics => {
        this.metrics = metrics;
      },
      err => {
        console.log('cpu-usage component error: '  + JSON.stringify(err));
      }
    ));
  }

  private initClock() {
    this.sub.push(Observable.interval(this.rate).subscribe(
      () => {
        this.refresh();
      }
    ));
  }


  private init() {
    this.sub.push(this.translate.get([
      'dashboard.textCPUUsage',
      'dashboard.textCPUUsageSubLabel',
      'dashboard.textUsed'
    ]).subscribe(
      resource => {
        this.textCPU = resource['dashboard.textCPUUsage'];
        this.textCPUSubLabel = resource['dashboard.textCPUUsageSubLabel'];
        this.textPctUsed = resource['dashboard.textUsed'];
      }
    ));
  }
}
