import {Component, Input, OnInit, Output, OnDestroy, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';
/**
 * Simple dashboard widget that contains a label, icon, and number value
 *
 * Inputs
 *
 * title - string - label at the top of widget header.
 * icon - string - icon to place in the middle of widget
 * value - number - value to place on the widget
 * rate - number - rate at which to emit onTick event for refresh purposes.  Set to 0 if not needed
 * iconColor - string - color of the icon. default is grey
 * iconSize - string - css icon size default is 50px
 * Outputs
 * onTick - event on a clock rate set by rate input.
 */
@Component({
  selector: 'count-dashboard',
  styleUrls: ['./count-dashboard.scss'],
  templateUrl: './count-dashboard.component.html'
})
export class CountDashboardComponent implements OnInit, OnDestroy{

  @Output()
  onTick = new EventEmitter();
  @Input()
  title: string;
  @Input()
  icon: string = 'ion-android-happy';
  @Input()
  iconColor: string = 'grey';
  @Input()
  iconSize: string = '45px';
  @Input()
  countSize: string = '35px';
  @Input()
  value: number = 0;
  @Input()
  dbValue: number = 0;
  @Input()
  isSummary: boolean = false;
  @Input()
  rate:  number = 30000;
  @Input() dbTooltip: string;
  @Input() vmTooltip: string;
  @Input() genericToolTip: string;

  private clock: any;

  constructor(private translate: TranslateService) { }

  ngOnInit() {
    this.initClock();
  }

  ngOnDestroy() {
    if (this.clock) {
      this.clock.unsubscribe();
    }
  }
  private initClock() {
    if (this.rate > 0) {
      this.clock = Observable.interval(this.rate).subscribe(
        () => {
          this.onTick.emit();
        }
      );
    }
  }
}
