import {Component, Input, OnChanges, OnInit, AfterViewInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';

export type ProgressBarStatus = 'normal' | 'warning' | 'critical';

/**
 * Simple progress bar implementation
 *
 * Inputs
 *
 * [topLeftLabel]                                                        [topRightLabel]
 * [topLeftSubLabel]                                                     [topRightSubLabel] 
 * [label]                                                               [totalLabel]
 * [leftLabel] [# [barLabel] #################                         ] [rightLabel]
 * [bottomLabel]
 *
 * MyStorageUtilization                               100 TB
 * [# 50% #################                                ]
 *
*  type - string - thin or standard
 * label - string - Label string for the upper left
 * totalLabel - string - Label string for the upper right
 * barLabel - string - Label string to display inside the bar
 * bottomLabel - string - Label string to display below left of the bar

 * leftLabel - string - Label string to display to the left of the bar
 * leftLabelColWidth - number - column width (col-lg-#) for left label
 * rightLabel - string - Label string to display to the right of the bar
 * rightLabelColWidth - number - column width (col-lg-#) for right label

 * percentage - number - percentage value to render the bar.
 * status - ProgressBarStatus - sets the status of the bar.
 * initialDelay - number - milliseconds to delay before adjusting width.  Default is 1000
 */
@Component({
  selector: 'progress-bar',
  styleUrls: ['./progress-bar.scss'],
  templateUrl: './progress-bar.component.html'
})
export class ProgressBarComponent implements OnChanges, AfterViewInit, OnInit {

  @Input()
  type: string = 'standard';
  @Input()
  subLabel: string = undefined;
  
  @Input()
  topLeftLabel: string = undefined;
  @Input()
  topLeftSubLabel: string = undefined;
  @Input()
  topRightLabel: string = undefined;
  @Input()
  topRightSubLabel: string = undefined;
  
  @Input()
  subTotalLabel: string = undefined;
  @Input()
  label: string = undefined;
  @Input()
  barLabel: string = undefined;
  @Input()
  totalLabel: string = undefined;
  @Input()
  bottomLabel: string = undefined;
  @Input()
  usedLabel: string = undefined;

  @Input()
  leftLabel: string = undefined;
  @Input()
  leftLabelColWidth: number = 1;
  @Input()
  rightLabel: string = undefined;
  @Input()
  rightLabelColWidth: number = 1;

  @Input()
  percentage: number = undefined;
  @Input()
  status: ProgressBarStatus = 'normal';
  @Input()
  initialDelay: number = 1000;
  @Input()
  isTransition: boolean = true;

  currentPercentage: number = 0;
  private isInit: boolean = false;
  progressColClass: string = 'col-lg-12';
  progressBarTypeClass: string = 'progress-standard';
  progressColTypeClass: string = 'progress-col-standard';

  ngAfterViewInit() {
    this.delay(() => {
      this.currentPercentage = this.percentage;
      this.delay(() => {
        this.isInit = true;
      }, 2000);
    }, this.initialDelay);
  }

  ngOnChanges() {
    if (this.isInit) {
      this.currentPercentage = this.percentage;
    }
  }

  ngOnInit() {
    this.progressColClass = this.getProgressColClass();
    this.progressBarTypeClass = this.getProgressBarTypeClass();
    this.progressColTypeClass = this.getProgressColTypeClass();
  }

  private getProgressColTypeClass(): string {
    return 'progress-col-' + this.type;
  }

  private get transition(): string {
    if (this.isTransition) {
      return 'transition-on';
    } else {
      return 'transition-off';
    }
  }

  private getProgressColClass(): string {
    let total = 12;
    if (this.leftLabel !== undefined) {
      total = total - this.leftLabelColWidth;
    }

    if (this.rightLabel !== undefined) {
      total = total - this.rightLabelColWidth;
    }

    return 'col-lg-' + total;
  }

  private getProgressBarTypeClass(): string { 
    return 'progress-' + this.type;
  }

  private delay(callback: any, interval: number) {
    let sub: any = Observable.interval(interval).take(1).subscribe(
      () => {
        callback();
        sub.unsubscribe();
      }
    );
  }
}
