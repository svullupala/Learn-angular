import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';

/**
 * Basic refresh button with optional tick.
 *
 *
 * selector: refresh button-basic
 *
 * input:
 *          rate: number - rate in ms for the tick (default 30000)
 *          tickEnabled: boolean - set to true to emit onTick event (default false)
 *          defaultState: boolean - sets the default state of the toggle button.  (default false)
 *          iconClass: string - class of the icon.  default ion-refresh
 *          buttonLabel: string - label for button default Auto Refresh
 *
 * output:
 *          onToggle - event when button is toggled.  Returns state of button (boolean)
 *          onTick - event on the clock tick.
 *
 *  ex:
 *          Toggle button behavior:
 *
 *      <refresh-button-basic [defaultState]="true" (onToggle)="toggleAutoRefresh($event)"></refresh-button-basic>
 *
 *          Tick behavior
 *
 *      <refresh-button-basic [defaultState]="true" [rate]="1000" [tickEnabled]="true" (onTick)="getRecords()"></refresh-button-basic>
 *
 */
@Component({
  selector: 'refresh-button-basic',
  template: `
    <button type="button" (click)="toggle()" class="sdl inline small with-icon"
            [hidden]="hideAutoRefreshBtn"
            [ngClass]="{'ghost': !isEnabled}"><i [ngClass]="iconClass"></i>{{isEnabled ? buttonLabel : buttonDisabledLabel}}</button>
  `,
})
export class RefreshButtonBasicComponent {
  @Output() onToggle = new EventEmitter();
  @Output() onTick = new EventEmitter();
  @Input() rate: number = 30000;
  @Input() hideAutoRefreshBtn: boolean = false;
  @Input() tickEnabled: boolean = false;
  @Input() defaultState: boolean = false;
  @Input() iconClass = 'ion-refresh';
  @Input() buttonLabel = 'Auto Refresh';
  @Input() buttonDisabledLabel = 'Refresh paused';
  @Input() isEnabled: boolean = false;
  clock: any = undefined;

  constructor(private translate: TranslateService) {
    let me = this;
    me.translate.get([
      'common.textAutoRefreshButton',
      'common.textRefreshPauseButton'])
      .subscribe((resource: Object) => {
        me.buttonLabel = resource['common.textAutoRefreshButton'];
        me.buttonDisabledLabel = resource['common.textRefreshPauseButton'];
      });
  }

  toggle() {
    if (this.isEnabled) {
      this.isEnabled = false;
    } else {
      this.isEnabled = true;
    }
    this.onToggle.emit(this.isEnabled);
  }

  ngOnInit() {
    if (this.defaultState) {
      this.isEnabled = true;
    }

    if (this.tickEnabled) {
      this.initClock();
    }
  }

  ngOnDestroy() {
    if (this.clock !== undefined) {
      this.clock.unsubscribe();
    }
  }

  private initClock() {
    this.clock = Observable.interval(this.rate).subscribe(
      () => {
        if (this.isEnabled) {
          this.onTick.emit();
        }
      }
    );
  }
}
