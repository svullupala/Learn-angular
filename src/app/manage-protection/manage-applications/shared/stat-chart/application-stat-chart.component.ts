import {Component, Input, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ApplicationStatChart} from './application-stat-chart';
import {ApplicationInventoryService} from '../application-inventory.service';
import {InventoryStatChartComponent} from 'inventory/stat-chart/inventory-stat-chart.component';

@Component({
  selector: 'application-stat-chart',
  templateUrl: './application-stat-chart.component.html',
  styleUrls: ['./application-stat-chart.component.scss']
})
export class ApplicationStatChartComponent extends ApplicationStatChart {
  @Input() applicationType: string;
  @ViewChild(InventoryStatChartComponent) chart: InventoryStatChartComponent;

  constructor(protected translate: TranslateService,
              protected service: ApplicationInventoryService) {
    super(translate, '', service);
  }

  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }
}
