import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

/**
 *  Carbon Icon.
 *
 *     Selector: carbon-icon
 *     Examples:
 *     1) <carbon-icon class="red extra-style1" type="app-services"></carbon-icon>
 *     2) <carbon-icon [class]="'yellow extra-style2'" [type]="'settings'" title="I am Settings icon">
 *
 *  Note: extra carbon icons are available from @carbon/icons-angular package
 *        (https://github.com/carbon-design-system/carbon-icons-angular).
 *  Examples:
 *      <!-- the directive should be preferred whenever possible -->
 *      <svg ibmIconAdd size="16" class="add-icon" sdlTooltip
 *            container="body"
 *            placement="right"
 *            [sdlTooltip]="'16px icon from ibmIconAdd'"></svg>
 *      <!-- but a component is also available -->
 *      <ibm-icon-add size="32" class="add-icon" title="32px icon from ibm-icon-add"></ibm-icon-add>
 *
 */
@Component({
  selector: 'carbon-icon',
  host: {
    '[attr.title]': 'title',
    '[attr.aria-hidden]': 'ariaHidden',
    '[class]': 'class',
    'role': 'img'
  },
  templateUrl: './carbon-icon.component.html',
  styleUrls: ['./carbon-icon.component.scss']
})
export class CarbonIconComponent implements OnChanges {
  @Input() type: string;
  @Input() title: string;
  @Input() class: string;
  @Output() clickEvent = new EventEmitter<any>();

  ariaHidden: true | null = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['title'] && changes['title'].currentValue) {
      this.ariaHidden = null;
    } else {
      this.ariaHidden = true;
    }
  }

  onClick(event: any): void {
    this.clickEvent.emit(event);
  }
}
