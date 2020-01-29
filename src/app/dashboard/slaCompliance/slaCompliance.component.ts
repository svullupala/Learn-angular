import {Component, Input, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef} from '@angular/core';
import {DashboardService} from '../dashboard.service';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {DoughnutChartData} from '../shared/doughnut-chart/doughnut-chart.component';
import {FixedStack, StackItem} from '../shared/fixedstack.item';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'slacompliance',
  templateUrl: './slaCompliance.html',
  styleUrls: ['./slaCompliance.scss', '../shared/widget.scss']
})

export class SlaComplianceComponent implements OnDestroy, AfterViewInit, OnInit {
  @Input()
  rate: number = 60000;
  chartData: DoughnutChartData[] = undefined;
  chartDbData: Array<DoughnutChartData> = undefined;
  title: string;

  private fixedStack: FixedStack = undefined;
  private fixedDbStack: FixedStack = undefined;
  private api: string = 'api/endeavour/catalog/recovery/hypervisorvm';
  private textProtectionByPolicy: string;
  private textTotal: string;
  private textProtectedVMs: string;
  private textProtectedVM: string;
  private textDatabase: string;
  private textDatabases: string;
  private GOLD: string = 'Gold';
  private SILVER: string = 'Silver';
  private BRONZE: string = 'Bronze';
  private OTHER: string = '';
  private MAXSHOWN: number = 3;

  private sub: any [] = [];

  constructor(private service: DashboardService,
              private translate: TranslateService) {
  }

  isReady(): boolean {
    if (this.fixedStack === undefined) {
      return false;
    }

    return true;
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
  }

  ngOnInit() {
    this.init();
  }

  private init() {
    this.sub.push(this.translate.get([
      'dashboard.textProtectionByPolicy',
      'common.textTotal',
      'dashboard.textDatabaseCount',
      'dashboard.textDatabasesCount',
      'dashboard.textProtectionByPolicy',
      'dashboard.textVMCount',
      'dashboard.textVMsCount',
      'dashboard.textOther'
    ]).subscribe(
      resource => {
        this.title = resource['dashboard.textProtectionByPolicy'];
        this.textTotal = resource['common.textTotal'];
        this.textProtectedVMs = resource['dashboard.textVMsCount'];
        this.textProtectedVM = resource['dashboard.textVMCount'];
        this.textDatabase = resource['dashboard.textDatabaseCount'];
        this.textDatabases = resource['dashboard.textDatabasesCount'];
        this.textProtectionByPolicy = resource['dashboard.textProtectionByPolicy'];
        this.OTHER = resource['dashboard.textOther'];
        this.refresh();
      }
    ));
  }

  private refresh() {
    this.refreshData();
  }

  private getLabel(count: number, isDb: boolean = false): string {
    if (count > 1) {
      return isDb ? SharedService.formatString(this.textDatabases, count) : SharedService.formatString(this.textProtectedVMs, count);
    } else if (count === 1) {
      return isDb ? SharedService.formatString(this.textDatabase, count) : SharedService.formatString(this.textProtectedVM, count);
    } else {
      return isDb ? SharedService.formatString(this.textDatabases, count) : SharedService.formatString(this.textProtectedVMs, count);
    }
  }

  private initClock() {
    this.sub.push(Observable.interval(this.rate).subscribe(
      () => {
        this.refresh();
      }
    ));
  }

  private _toDoughnutChartData(stack: FixedStack, isDb: boolean = false): DoughnutChartData[] {
    let retVal: DoughnutChartData[] = [];

    if (stack === undefined) {
      return retVal;
    }

    let values: StackItem[] = stack.getLengthContents(this.MAXSHOWN, this.OTHER);

    for (let i = 0; i < values.length; i++) {
      let title: string = values[i] ? values[i].label : 'N/A',
        v = new DoughnutChartData(values[i].value, this.getColor(title, i),
        this.service.getPrimaryColor(), values[i].label, this._getPercentage(values[i], values), i,
        values[i].label, this.getLabel(values[i].value, isDb));
      retVal.push(v);
    }

    return retVal;
  }

  private getColor(name: string, order: number): string {
    if (name && typeof name === 'string') {
      if (name.toUpperCase() === this.GOLD.toUpperCase()) {
        return this.service.getGoldColor();
      } else if (name.toUpperCase() === this.SILVER.toUpperCase()) {
        return this.service.getSilverColor();
      } else if (name.toUpperCase() === this.BRONZE.toUpperCase()) {
        return this.service.getBronzeColor();
      }
    }
    return this.service.getColor(order);
  }

  private _getPercentage(value: StackItem, values: StackItem[]) {
    return (value.value / this._getSum(values)) * 100;
  }

  private _getSum(values: StackItem[]): number {
    let retVal: number = 0;
    for (let i = 0; i < values.length; i++) {
      retVal += values[i].value;
    }

    return retVal;
  }

  private createFixedStack(): FixedStack {
    let retVal: FixedStack = new FixedStack();
    retVal.pushItem(this.GOLD, 0);
    retVal.pushItem(this.SILVER, 0);
    retVal.pushItem(this.BRONZE, 0);
    return retVal;
  }

  private refreshData() {
    this.sub.push(this.service.getAggrGroupCount(this.api, 'pk', 'protectionInfo.storageProfileName').subscribe(
      res => {
        let data = res;
        this.fixedStack = this.createFixedStack();

        for (let i = 0; i < data.length; i++) {
          this.fixedStack.push(new StackItem(data[i].group, data[i].count));
        }

        this.chartData = this._toDoughnutChartData(this.fixedStack);
      },
      err => {
        this.chartData = undefined;
        this.fixedStack = undefined;
        console.log('slaCompliance widget error: ' + JSON.stringify(err));
      }
    ));

    this.sub.push(this.service.getDbAggrCount('pk', 'protection', true).subscribe(
      res => {
        let data = res;
        this.fixedDbStack = this.createFixedStack();

        for (let i = 0; i < data.length; i++) {
          this.fixedDbStack.push(new StackItem(data[i].group, data[i].count));
        }
        this.chartDbData = this._toDoughnutChartData(this.fixedDbStack, true);
      },
      err => {
        this.chartDbData = undefined;
        this.fixedDbStack = undefined;
        console.log('slaCompliance widget error: ' + JSON.stringify(err));
      }
    ));

  }
}

