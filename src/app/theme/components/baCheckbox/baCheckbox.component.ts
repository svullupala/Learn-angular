import { Component, EventEmitter, Input, Output, Self } from '@angular/core';
import {ControlValueAccessor, NgModel} from '@angular/forms';

@Component({
  selector: 'ba-checkbox[ngModel]',
  styleUrls: ['./baCheckbox.scss'],
  templateUrl: './baCheckbox.html',
  providers: [NgModel]
})
export class BaCheckbox implements ControlValueAccessor {
  @Output() onChangeEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() disabled:boolean;
  @Input() label:string;
  @Input() value:string;
  @Input() tooltip: string;
  @Input() baCheckboxClass:string;

  public model: NgModel;
  public state: boolean;

  public constructor(@Self() state:NgModel) {
    this.model = state;
    state.valueAccessor = this;
  }

  public onChange(value: any): void {}
  public onTouch(value: any): void {}
  public writeValue(state: any): void {
    this.state = state;
  }

  public registerOnChange(fn: any): void {
    this.onChange = function(state: boolean) {
      this.writeValue(state);
      this.model.viewToModelUpdate(state);
      this.onChangeEvent.emit(state);
    };
  }
  public registerOnTouched(fn: any): void { this.onTouch = fn; }
}
