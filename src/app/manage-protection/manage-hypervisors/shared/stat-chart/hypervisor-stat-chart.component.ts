import {Component, Input, ViewChild} from '@angular/core';
import {HypervisorStatChart} from './hypervisor-stat-chart';
import {TranslateService} from '@ngx-translate/core';
import {HypervisorInventoryService} from '../hypervisor-inventory.service';
import {InventoryStatChartComponent} from 'inventory/stat-chart/inventory-stat-chart.component';

@Component({
  selector: 'hypervisor-stat-chart',
  templateUrl: './hypervisor-stat-chart.component.html',
  styleUrls: ['./hypervisor-stat-chart.component.scss']
})
export class HypervisorStatChartComponent extends HypervisorStatChart {
  @Input() hypervisorType: string;
  @ViewChild(InventoryStatChartComponent) chart: InventoryStatChartComponent;

  constructor(protected translate: TranslateService,
              protected service: HypervisorInventoryService) {
    super(translate, '', service);
  }

  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }
}
