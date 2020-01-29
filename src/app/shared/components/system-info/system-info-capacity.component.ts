import {Component, OnDestroy, Input, OnInit, AfterViewInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {FilesystemModel, MetricsModel, SystemInfoService} from './system-info.service';
import {FileSizePipe} from 'shared/pipes/file-size.pipe';
import {DecimalPipe, PercentPipe} from '@angular/common';
import {ProgressBarStatus, ProgressBarComponent} from 'shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'system-info-capacity',
  templateUrl: './system-info-capacity.component.html',
  styleUrls: ['./system-info.scss']
})
export class SystemInfoCapacityComponent implements OnDestroy, AfterViewInit, OnInit {
  metrics: MetricsModel = undefined;
  title: string;
  textData1: string;
  textData2: string;
  textData3: string;

  data1: FilesystemModel = undefined;
  data2: FilesystemModel = undefined;
  data3: FilesystemModel = undefined;


  @Input()
  rate: number = 30000;

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

  getProgressBarStatusFileSystem(value: FilesystemModel): ProgressBarStatus {
    if (value) {
      if (value.status === 'ERROR') {
        return 'critical';
      } else if (value.status === 'WARNING') {
        return 'warning';
      }
    }
    return 'normal';
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

  getData1TotalLabel(value: FilesystemModel): string {
    let percentage: number = value.util / 100;
    let used: number = 0;
    if (percentage > 0) {
      used = value.size * percentage;
    }
    let totalDisp = this.fileSize.transform(value.size);
    let usedDisp = this.fileSize.transform(used);
    return this.percent.transform(percentage, '1.0-2') + ' ( ' + usedDisp + ' / ' + totalDisp + ' )';
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
    this.refreshLow();
  }

  ngOnInit() {
    this.init();
  }

  private getFilesystemModelByName(value: string, values: FilesystemModel[]): FilesystemModel {
    for (let i = 0; i < values.length; i++) {
      if (values[i].name === value) {
        return values[i];
      }
    }

    return undefined;
  }

  private refreshLow() {
    this.sub.push(this.service.getFilesystems().subscribe(
      filesystems => {
        this.data1 = this.getFilesystemModelByName('Configuration', filesystems);
        this.data2 = this.getFilesystemModelByName('Catalog', filesystems);
        this.data3 = this.getFilesystemModelByName('Search', filesystems);
      }
    ));
  }

  private initClock() {
    this.sub.push(Observable.interval(this.rate).subscribe(
      () => {
        this.refreshLow();
      }
    ));
  }


  private init() {
    this.sub.push(this.translate.get([
      'dashboard.textSystemInformation',
      'dashboard.textData1',
      'dashboard.textData2',
      'dashboard.textData3',
    ]).subscribe(
      resource => {
        this.title = resource['dashboard.textSystemInformation'];
        this.textData1 = resource['dashboard.textData1'];
        this.textData2 = resource['dashboard.textData2'];
        this.textData3 = resource['dashboard.textData3'];
      }
    ));
  }
}
