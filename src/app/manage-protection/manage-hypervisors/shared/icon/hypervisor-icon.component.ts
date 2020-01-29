import {Component, Input} from '@angular/core';
import {HasIcon} from 'shared/models/base.model';

@Component({
  selector: 'hypervisor-icon',
  host: {
    '[class]': 'class',
    'role': 'img'
  },
  templateUrl: './hypervisor-icon.component.html',
  styleUrls: ['./hypervisor-icon.component.scss']
})
export class HypervisorIconComponent {
  @Input() model: HasIcon;
  @Input() class: string;
}
