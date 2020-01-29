import {
  AfterContentInit,
  Component,
  ContentChildren,
  forwardRef,
  QueryList,
  TemplateRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RadioSelectionDirective } from 'shared/components/radio-selection/radio-selection.directive';

interface RadioSelection {
  key: string;
  labelText: string;
}

@Component({
  selector: 'radio-selection',
  templateUrl: './radio-selection.component.html',
  styleUrls: ['./radio-selection.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioSelectionComponent),
      multi: true
    }
  ]
})
export class RadioSelectionComponent implements ControlValueAccessor, AfterContentInit {
  @ContentChildren(RadioSelectionDirective, { read: TemplateRef })
  templates: QueryList<TemplateRef<any>>;
  @ContentChildren(RadioSelectionDirective) selectionDirectives: QueryList<RadioSelectionDirective>;

  value: string = '';
  selections: RadioSelection[] = [];
  private onModelChange: Function;

  constructor() {}

  ngAfterContentInit(): void {
    this.setSelections();
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: any): void {}

  handleClick(key: string): void {
    this.value = key;
    this.onModelChange(key);
  }

  private setSelections(): void {
    this.selections = this.selectionDirectives.toArray().map(selection => ({
      key: selection.radioSelectionFor,
      labelText: selection.radioSelectionLabel
    }));
  }
}
