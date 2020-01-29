import {Component, Input} from '@angular/core';
import {HasIcon} from 'shared/models/base.model';

/**
 *  Status Icon based on carbon icon from @carbon/icons-angular package.
 *  Currently supported icons include: error--filled, warning--filled, checkmark--filled.
 *
 *     Selector: status-icon
 *     Examples:
 *     1) <status-icon [model]="modelHasIcon" class="status-success" [tooltipEnabled]="false"></status-icon>
 *     2) <status-icon [model]="modelHasIcon" class="status-error" [tooltipEnabled]="true"></status-icon>
 *
 */
@Component({
  selector: 'status-icon',
  host: {
    '[class]': 'class',
    'role': 'img'
  },
  templateUrl: './status-icon.component.html',
  styleUrls: ['./status-icon.component.scss']
})
export class StatusIconComponent {
  @Input() model: HasIcon;
  @Input() class: string;
  @Input() tooltipEnabled: boolean = false;
  @Input() defaultTheme: boolean = true;

  get theme(): string {
    return this.defaultTheme ? 'default-theme' : '';
  }

  get _tooltipDisabled(): boolean {
    return !this.tooltipEnabled || !this.model.tooltip;
  }
}
