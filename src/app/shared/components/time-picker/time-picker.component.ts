import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

export interface TimepickerDropdownOption {
  name: string;
  value: string;
}

export interface TimepickerValue {
  h: number;
  m: number;
}

@Component({
  selector: 'time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit, OnChanges {
  @Input() initValue: TimepickerValue = null;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() scrollableHolder: Element;
  @Output() onChangeValue = new EventEmitter<TimepickerValue>();

  public inputValue: string = null;
  public options: TimepickerDropdownOption[] = [];

  ngOnInit(): void {
    if (this.initValue) {
      this.inputValue = this.transformObjectTimeToString(this.initValue);
    }
    this.options = this.prepareTimeIntervals();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.initValue &&
      changes.initValue.currentValue &&
      changes.initValue.currentValue.h !== null &&
      changes.initValue.currentValue.m !== null
    ) {
      this.inputValue = this.transformObjectTimeToString(changes.initValue.currentValue);
    }
  }

  public onSelectValue(value: TimepickerDropdownOption): void {
    this.inputValue = value.value;
  }

  public onChangeInput(event: string): void {
    if (event.length < 4) {
      this.onChangeValue.emit({
        h: null,
        m: null
      });
    } else {
      this.onChangeValue.emit(this.transformStringTimeToObject(event));
    }
  }

  public isValid(): boolean {
    return this.inputValue.length > 3;
  }

  private transformStringTimeToObject(value: string): TimepickerValue {
    return {
      h: value[0] === '0' ? +value[1] : +value.substring(0, 2),
      m: value[2] === '0' ? +value[3] : +value.substring(2)
    };
  }

  private transformObjectTimeToString({ h, m }: TimepickerValue): string {
    const hour = h < 10 ? '0' + h : h;
    const min = m < 10 ? '0' + m : m;

    return hour + ':' + min;
  }

  private prepareTimeIntervals(): TimepickerDropdownOption[] {
    const timeIntervals: TimepickerDropdownOption[] = [];

    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 4; j++) {
        const hours = i < 10 ? `${'0'}${i}` : i.toString();
        const mins = j === 0 ? '00' : `${j * 15}`;
        const time = hours + ':' + mins;

        timeIntervals.push({ name: time, value: time });
      }
    }

    return timeIntervals;
  }
}
