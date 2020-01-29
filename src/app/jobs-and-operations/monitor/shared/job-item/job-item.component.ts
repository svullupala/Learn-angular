import { OnInit, ViewChild, Component, Input, TemplateRef, OnDestroy, SimpleChanges, OnChanges} from '@angular/core';
import { JobModel } from 'job/shared/job.model';
import { JobSessionModel } from 'job/shared/job-session.model';
import { DurationDisplayPipe, DurationDisplayType } from 'job/shared/duration-display.pipe';
import { SharedService } from 'shared/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { PercentageDoughnutChartComponent } from 'shared';
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss']
})
export class JobItemComponent implements OnInit, OnDestroy, OnChanges {
  @Input() job: JobSessionModel;
  @Input() isList: boolean = true;
  @Input() isHistory: Boolean = false;
  @Input() hideChart: boolean = false;

  @ViewChild('history', {read: TemplateRef})
  historyRef: TemplateRef<any>;
  @ViewChild('details', {read: TemplateRef})
  detailsRef: TemplateRef<any>;
  @ViewChild('running', {read: TemplateRef})
  runningRef: TemplateRef<any>;
  
  
  private durationType = DurationDisplayType.SHORT;
  private success: string = '#33BC6E';
  private warning: string = '#FFB000';
  private failure: string = '#E62325';
  private normal: string = '#777677';

  private textSuccess: string = 'Success: ';
  private textFailed: string = 'Failed: ';
  private textSkipped: string = 'Skipped: ';
  private textCompleted: string = 'Completed: ';
  private textVMs: string = 'VMs';
  private textResources: string = 'Resources';
  private textDatabases: string = 'Databases';
  private textTotalPattern: string = 'Total {0}:';

  private view: TemplateRef<any> = undefined;
  private subs: Subject<void> = new Subject<void>();

  private tooltipPattern = 'Success: {0} Failed: {1} Skipped: {2}';

  // chart.js is finicky that it on certain code changes may not react to changes. 
  //   leaving this around for testing purposes;  do not leave testMode set on commit
  private testPercentage: number = 0;
  private testColor: string = this.normal;
  private testMode: boolean = false;

  constructor(private translate: TranslateService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
        'job.textSuccessColon',
        'job.textFailedColon',
        'job.textSkippedColon',
        'hypervisor.textVMs',
        'common.textResources',
        'application.textDatabases',
        'common.textColonTotalPattern',
        'common.textCompletedColon'
      ]).takeUntil(this.subs).subscribe((resource: Object) => {
          this.textSuccess = resource['job.textSuccessColon'];
          this.textFailed = resource['job.textFailedColon'];
          this.textSkipped = resource['job.textSkippedColon'];
          this.textCompleted = resource['common.textCompletedColon'];
          this.textVMs = resource['hypervisor.textVMs'];
          this.textResources = resource['common.textResources'];
          this.textDatabases = resource['application.textDatabases'];
          this.textTotalPattern = resource['common.textColonTotalPattern'];
          this.tooltipPattern = this.textSuccess + ' {0} ' + this.textFailed + ' {1} ' + this.textSkipped + ' {2} ';
      });

      if (this.testMode) {
        Observable.interval(5000).subscribe(
          () => {
            this.testPercentage = this.testPercentage + 10;
            if (this.testPercentage > 100) {
              this.testPercentage = 0;
              this.testColor = (this.testColor === this.normal) ? this.success : this.normal;
            }
          }
        ); 
      }
  }

  ngOnChanges(changes: SimpleChanges) {
    let me = this;
    me.onChangeView();   
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  isStats(): boolean {
    if (this.testMode) {
      return this.percentage > 0;
    } else {
      return this.total > 0;
    }
  }

  isOnDemandJob(): boolean {
    return (this.job.jobName).includes('onDemandRestore_');
  }

  onChangeView() {
    if (this.isHistory && this.historyRef) {
      this.view =  this.historyRef;
    } else if (this.isList && this.runningRef) {
      this.view =  this.runningRef;
    } else if (this.detailsRef) {
      this.view =  this.detailsRef;
    }
  }

  get percentage(): number  {
    let me = this;

    if (me.testMode) {
      return this.testPercentage; 
    } else {
      return (this.total > 0 && this.completed <= this.total) ? (Math.round((this.completed / this.total) * 100)) : 0;
    }
  }

  get progressColor(): string {
    let me = this;

    if (me.testMode) {
      return me.testColor;
    }

    let fails = ((me.job.stats) && me.job.stats['failed']) ? me.job.stats['failed'] : 0;
    let skips = ((me.job.stats) && me.job.stats['skipped']) ? me.job.stats['skipped'] : 0;
    let passes = ((me.job.stats) && me.job.stats['success']) ? me.job.stats['success'] : 0;
    let total = fails + skips + passes;


    if (passes == total) {
      return me.success;
    } else if (fails == total) {
      return me.failure;
    } else {
      return me.warning;
    }
  }

  get resourceType(): string {
    if (! ((this.job.stats) && this.job.stats['resourceType'])) {
      return '';
    }

    switch (this.job.stats['resourceType']) {
      case 'vm': {
        return this.textVMs;
      }
      case 'database': {
        return this.textDatabases;
      }
      default: {
        return this.textResources;
      }
    }
  }

  get totalLabel(): string {
    let me=this;
    return SharedService.formatString(me.textTotalPattern, me.resourceType);
  }

  get tooltipStats(): string {
    let me = this;
    return SharedService.formatString(this.tooltipPattern, 
      (me.job.stats && me.job.stats['success']) ? me.job.stats['success'] : 0, 
      (me.job.stats && me.job.stats['failed']) ? me.job.stats['failed'] : 0, 
      (me.job.stats && me.job.stats['skipped']) ? me.job.stats['skipped'] : 0
      );
  }


  get total(): number {
    let me=this;
    return (me.job && me.job.stats && me.job.stats['total']) ? me.job.stats['total'] : 0;
  }

  get completed(): number {
    let me = this, count: number = 0;  
    count += (me.job.stats && me.job.stats['success']) ? me.job.stats['success'] : 0;
    count += (me.job.stats && me.job.stats['failed']) ? me.job.stats['failed'] : 0;
    count += (me.job.stats && me.job.stats['skipped']) ? me.job.stats['skipped'] : 0;

    return count;
  }
}
