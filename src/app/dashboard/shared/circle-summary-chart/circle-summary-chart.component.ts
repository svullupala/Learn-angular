import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'circle-summary-chart',
  templateUrl: './circle-summary-chart.component.html',
  styleUrls: ['./circle-summary-chart.scss']
})
export class CircleSummaryChartComponent {

  @Input()
  label: string;

  @Input()
  rightLabel: string;

  @Input()
  wrapLabel: boolean = false;

  @Input()
  topLabel: string;

  @Input()
  topLabelColor: string;

  @Input()
  subLabel: string;

  @Input()
  value: number | string;

  @Input()
  valueTextOverflow: string = 'clip';

  @Input()
  valueOverflow: string = 'visible';

  @Input()
  seperator: string;

  @Input()
  unit: string;

  @Input()
  borderColor: string;

  @Input()
  fillColor: string;

  @Input()
  labelColor: string;

  @Input()
  seperatorColor: string;

  @Input()
  seperatorThin: boolean = false;

  @Input()
  seperatorMedium: boolean = false;

  @Input()
  unitColor: string;

  @Input()
  topIcon: string;

  @Input()
  unitThin: boolean = false;

  @Input()
  unitMedium: boolean = false;

  @Input()
  valueThin: boolean = false;

  @Input()
  valueMedium: boolean = false;

  @Input()
  width: string = undefined;
  
  @Input()
  minWidth: string = undefined;

  @Input()
  maxWidth: string = undefined;

  @Input()
  cursorType: string;

  @Input()
  isClickable: boolean = false;

  @Output()
  selection = new EventEmitter();

  constructor(private translate: TranslateService) {
  }

  onClick() {
    this.selection.emit();
  }

  private get _cursor(): string {
    return (this.cursorType === undefined && this.isClickable) ? 'pointer' : this.cursorType;
  }
}
