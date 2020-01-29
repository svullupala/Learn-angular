import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {Subject} from 'rxjs/Subject';
import {DashboardService} from '../dashboard.service';
import {SessionService, ScreenId} from 'core';
import {Router} from '@angular/router';
import {StorageStatsModel} from 'diskstorage/shared/storage-stats.model';
import {isNumeric} from 'rxjs/util/isNumeric';

@Component({
  selector: 'dashboard-destinations',
  styleUrls: ['../dashboard.scss'],
  templateUrl: './dashboard-destinations.component.html'
})

export class DashboardDestinationsComponent implements OnInit, AfterViewInit, OnDestroy {

  sub: Subject<void> = new Subject<void>();
  model: StorageStatsModel = undefined;

  private transparentColor: string = 'transparent';
  private cerulean70Color: string = '#1c496d';
  private defaultTextColor: string = '#464646';
  private defaultBubbleTextColor: string = '#595859';
  private fillColor = '#F9F9F9';

  constructor(private router: Router, private service: DashboardService, private decimalPipe: DecimalPipe) {
  }

  ngOnInit() {
    this.refresh();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.sub.next();
    this.sub.complete();
    this.sub.unsubscribe();
  }

  getUsedPct(usedSpace: number, total: number) {
    var getUsedPctValue  = Math.round((usedSpace / total) * 100);
    if(isNaN(Number(getUsedPctValue)))
    return 0;
    else
    return getUsedPctValue;
  }

  getSizeAndUnit(size: string, unit: string) {
    return size + ' ' + unit;
  }

  refresh() {
    this.refreshStatus();
  }

  refreshStatus() {
    let me = this,
      observable = StorageStatsModel.retrieve(StorageStatsModel, me.service.proxy);
    if (observable)
      observable.takeUntil(me.sub).subscribe(
        record => {
          me.model = record;
        },
        err => {
          me.model = null;
        }
      );
  }

  ratioValue(value: any): any {
    return isNumeric(value) ? this.decimalPipe.transform(value, '1.0-2') : value;
  }

  onViewCapacitySummary(): void {
    this.router.navigate(['/pages/systemconfiguration/backupstorage/disk']);
  }

  private hasViewPermission(): boolean {
    return SessionService.getInstance().hasScreenPermission(ScreenId.BACKUP_STORAGE);
  }
}
