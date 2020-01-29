import {Component, Input, NgZone, Renderer2, Output, EventEmitter} from '@angular/core';
import { ScheduleModel } from './schedule.model';
import {BsDatepickerDirective} from 'ngx-bootstrap/datepicker';
import {KeyboardDate} from 'shared/util/keyboard-date';
import {FocusMonitor} from '@angular/cdk/a11y';
import {BsDatepickerState} from 'ngx-bootstrap/datepicker/reducer/bs-datepicker.state';
import {LocaleService} from 'shared/locale.service';
import {NvPairModel} from 'shared/models/nvpair.model';
import {$e} from 'codelyzer/angular/styles/chars';
import {TimepickerValue} from 'shared/components/time-picker/time-picker.component';

@Component({
  selector: 'define-schedule',
  styleUrls: ['./define-schedule.component.scss'],
  templateUrl: './define-schedule.component.html',
})

export class DefineSchedule extends KeyboardDate {
  @Input() enableMinMax: boolean = false;
  @Input() allowDisableSchedule: boolean = false;
  @Input() disableScheduleCheckboxFlag: boolean = false;
  @Input() hideSubhourlyType: boolean = false;
  @Input() hideHourlyType: boolean = false;
  @Input() hideWeeklyType: boolean = false;
  @Input() hideDailyType: boolean = false;
  @Input() hideMonthlyType: boolean = false;
  @Input() hideStartTime: boolean = false;
  @Input() hideStartHourAndMinute: boolean = false;
  @Input() frequencyLabel: string;
  @Input() startTimeLabel: string;
  @Input() startHourAndMinuteLabel: String;
  @Input() startTimeLabelMarginClass: string = 'space-right-10';
  @Input() startHourAndMinuteLabelMarginClass: string = 'space-right-10';
  @Input() hideLabel: boolean = false;
  @Input() disable: boolean = false;
  @Input() disableSchedule = this.disable;
  @Input() disableStartTime = this.disable;
  @Input() disableStartHourAndMinute = this.disable;
  @Input() defaultFrequency: number;
  @Input() defaultType: string;
  @Input() frequencyWarningMessage: String;
  @Output() calculatedFrequency: EventEmitter<number> = new EventEmitter<number>();
  @Output() defineScheduleDisabled: EventEmitter<boolean> = new EventEmitter<boolean>();
  model: ScheduleModel = new ScheduleModel();
  private hiddenMinute: NvPairModel;
  private max: number;
  private min: number = 1;
  private bsConfig: Partial<BsDatepickerState>;
  private minDate: Date;
  private get disableScheduleField() {
    return this.disable || this.disableScheduleCheckboxFlag || this.disableSchedule || this.disableStartTime || this.disableStartHourAndMinute;
  }

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private localeService: LocaleService){
    super(renderer, focusMonitor, ngZone);
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      showWeekNumbers: false,
      dateInputFormat: 'L',
      locale: this.localeService.bsLocaleID
    });
    this.minDate = new Date();
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.defaultType) {
      this.model.type = this.defaultType;
    }
    if (this.enableMinMax) {
      this.setFrequencyMinMax();
    }
    this.calculateFrequency();
  }

  public getSchedule(){
    let me = this;

    if (me.allowDisableSchedule && me.disableScheduleCheckboxFlag) {
      return {};
    }

    if (me.model.type === 'SUBHOURLY') {
      // me.model.activateHour = 0;
      // me.model.activateMinute = 0;
    } else if (me.model.type === 'HOURLY') {
      // me.model.activateHour = 0;
    } else if (me.model.type === 'WEEKLY') {
      me.onChangeDOW();
    } else if (me.model.type === 'MONTHLY') {
      me.onChangeDOM();
    }
    return me.model.getSchedule();
  }

  public parseDate() {
    let me = this,
      now = new Date(),
      date = me.model.activateDate !== 0 ? new Date(me.model.activateDate) : now;
    // no schedule and set checkbox
    if (me.model.activateDate === 0 && me.allowDisableSchedule) {
      me.disableScheduleCheckboxFlag = true;
    }
    if (me.model.type === 'WEEKLY') {
      for (let w = 0; w < me.model.dowList.length; w++){
        if (me.model.dowList[w])
          me.model.dow = w;
      }
    } else if (me.model.type === 'MONTHLY') {
      for (let m = 0; m < me.model.domList.length; m++){
        if (me.model.domList[m])
          me.model.dom = m;
      }
    }
    me.minDate = now.valueOf() > date.valueOf() ? date : now;
    me.model.date = date;
    me.model.activateHour = date.getHours();
    me.model.activateMinute = date.getMinutes();
    me.resetHiddenMinute();
  }

  public onChangeDOW() {
    let me = this;
    for (let c = 0; c < me.model.dowList.length; c++){
      me.model.dowList[c] = false;
    }
    me.model.dowList[me.model.dow] = true;
  }

  public onChangeDOM() {
    let me = this;
    for (let c = 0; c < me.model.domList.length; c++){
      me.model.domList[c] = false;
    }
    me.model.domList[me.model.dom] = true;
  }

  public onChangeType() {
    let me = this;
    if (me.model.type === 'SUBHOURLY'){
      if (me.model.frequency < 5){
        me.model.frequency = 5;
      }
    }
    if (me.enableMinMax)
      me.setFrequencyMinMax();
  }

  public calculateFrequency() {
    let me = this;
    let frequency = 0;
    switch (me.model.type) {
      case 'MONTHLY':
        frequency = 1 / (me.model.frequency * 30 * 24 * 60);
        break;
      case 'WEEKLY':
        frequency = 1 / (me.model.frequency * 7 * 24 * 60);
        break;
      case 'DAILY':
        frequency = 1 / (me.model.frequency * 24 * 60);
        break;
      case 'HOURLY':
        frequency = 1 / (me.model.frequency * 60);
        break;
      case 'SUBHOURLY':
        frequency = 1 / me.model.frequency;
        break;
      default:
        frequency = 0;
        break;
    }
    me.calculatedFrequency.emit(frequency);
  }

  public showWarningMessage() {
    return this.frequencyWarningMessage !== '' && this.frequencyWarningMessage !== undefined;
  }

  public setFrequencyMinMax(){
    let me = this;

    switch (me.model.type) {
      case 'HOURLY':
        me.min = 1;
        me.max = 24;
        break;
      case 'DAILY':
        me.min = 1;
        me.max = 30;
        break;
      case 'WEEKLY':
        me.min = 1;
        me.max = 4;
        break;
      case 'MONTHLY':
        me.min = 1;
        me.max = 12;
        break;
      default:
        me.min = 5;
        me.max = 60;
        break;
    }
  }

  public isValid(): boolean {
    let me = this;

    if (me.allowDisableSchedule && me.disableScheduleCheckboxFlag) {
      return true;
    }

    if (me.model.frequency === undefined
      || me.model.frequency  < 1
      || me.model.frequency % 1 !== 0) {
      return false;
    }

    if (me.enableMinMax && (me.model.frequency < this.min
      || me.model.frequency > this.max)) {
      return false;
    }

    if (!me.model.date)
      return false;

    if (!this.isTimePickerValid())
      return false;

    return true;
  }

  public isTimePickerValid(): boolean {
    return this.model.activateHour !== null && this.model.activateMinute !== null;
  }

  public resetSchedule() {
    this.model = new ScheduleModel();
    if (this.defaultType)
      this.model.type = this.defaultType;
    if (this.defaultFrequency)
      this.model.frequency = this.defaultFrequency;
    this.disableScheduleCheckboxFlag = false;
  }

  public setModel(model: ScheduleModel): void {
    this.model = model;
    this.setFrequencyMinMax();
    this.calculateFrequency();
  }

  public onChangeTimepickerValue(value: TimepickerValue) {
    this.model.activateHour = value.h;
    this.model.activateMinute = value.m;
  }

  private onDateKeyDown(drp: BsDatepickerDirective, event: KeyboardEvent): void {
    if (event.keyCode === 8) { // BackSpace Key.
      this.model.date = null;
      drp.bsValue = null;
      drp.hide();
    }
  }

  private onHandleKeyPress(key: KeyboardEvent) {
    // do not allow floating point numbers, return false to cancel event
    return !(key.key === '.' || key.keyCode === 46 || key.which === 46);
  }

  private onDisableCheckboxChange(value: boolean): void {
    // put this here just incase we need to handle another use case
    this.defineScheduleDisabled.emit(value);
  }

  private resetHiddenMinute(): void {
    let me = this,
      activateMinute = me.model ? me.model.activateMinute || 0 : 0,
      remainder = activateMinute % 5;

    me.hiddenMinute = remainder > 0 ? new NvPairModel(
      (activateMinute < 10 ? '0' : '') + activateMinute,
      activateMinute) : null;
  }
}
