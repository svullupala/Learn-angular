import {
  Component, Input, AfterViewInit, EventEmitter,
  Output
} from '@angular/core';

@Component({
  selector: 'last-period-filter',
  styleUrls: ['./last-period-filter.scss'],
  templateUrl: './last-period-filter.component.html'
})
export class LastPeriodFilterComponent implements AfterViewInit {

  @Input() selectedLastPeriod: number = 12;
  @Input() lastRefreshedAt: Date;
  @Input() title: string;
  @Input() showRefresh: boolean = true;
  @Input() extraTimes: boolean = false;
  @Input() filterOnReady: boolean = true;

  @Output() filter = new EventEmitter<number>();

  selectExpanded: boolean = false;

  constructor() {
  }

  ngAfterViewInit() {
    if (this.filterOnReady)
      this.refresh();
  }

  refresh() {
    this.filter.emit(this.selectedLastPeriod);
  }

  onLastPeriodSelect(): void {
    this.refresh();
  }

  onSelectSwitch(): void {
    this.selectExpanded = !this.selectExpanded;
  }

  onSelectCollapse(): void {
    this.selectExpanded = false;
  }

  onSelectKeydown(event: KeyboardEvent): void {
    if (event.keyCode === 27)
      this.selectExpanded = false;
    else if (event.keyCode === 13)
      this.selectExpanded = true;
  }

  cdkFocused(element: Element): boolean {
    return element.classList.contains('cdk-keyboard-focused');
  }
}

