import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[radioSelectionFor]'
})
export class RadioSelectionDirective {
  @Input() radioSelectionFor: string;
  @Input() radioSelectionLabel: string;

  constructor() {}
}
