import {Component, Input} from '@angular/core';
import {SystemInfoCapacityComponent} from './system-info-capacity.component';
import {SystemInfoMetricsComponent} from './system-info-metrics.component';

@Component({
  selector: 'system-info',
  templateUrl: './system-info.component.html',
  styleUrls: ['./system-info.scss']
})
export class SystemInfoComponent {
  @Input()
  rate: number = 1000;

  @Input()
  percentDanger: number = 90;

  @Input()
  percentWarning: number  = 80;
}
