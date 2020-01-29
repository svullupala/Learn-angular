import {Component, OnDestroy, Input, OnInit, AfterViewInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {FilesystemModel, MetricsModel, SystemInfoService} from './system-info.service';
import {FileSizePipe} from 'shared/pipes/file-size.pipe';
import {DecimalPipe, PercentPipe} from '@angular/common';
import {ProgressBarStatus, ProgressBarComponent} from 'shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'system-info-metrics',
  templateUrl: './system-info-metrics.component.html',
  styleUrls: ['./system-info.scss']
})
export class SystemInfoMetricsComponent implements OnDestroy, AfterViewInit, OnInit {
  metrics: MetricsModel = undefined;
  title: string;
  textCPU: string;
  textMEM: string;

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

  getMEMTotalLabel() {
    if (this.metrics) {
      return this.percent.transform((this.metrics.mem || 0) / 100, '1.0-0') + ' ( '
        + this.fileSize.transform(this.metrics.memTotal) + ' )';
    }
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
        console.log('system-info dashboard widget error: '  + JSON.stringify(err));
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
      'dashboard.textSystemInformation',
      'dashboard.textCPU',
      'dashboard.textMEM',
    ]).subscribe(
      resource => {
        this.title = resource['dashboard.textSystemInformation'];
        this.textCPU = resource['dashboard.textCPU'];
        this.textMEM = resource['dashboard.textMEM'];
      }
    ));
  }
}
