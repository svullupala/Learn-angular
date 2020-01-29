import {Component, ViewChild} from '@angular/core';
import {ApplicationStatChart} from 'applicationinventory/stat-chart/application-stat-chart';
import {TranslateService} from '@ngx-translate/core';
import {ApplicationInventoryService} from 'applicationinventory/application-inventory.service';
import {InventoryStatChartComponent} from 'inventory/stat-chart/inventory-stat-chart.component';

@Component({
  selector: 'exchonline-stat-chart',
  templateUrl: '../../shared/stat-chart/application-stat-chart.component.html',
  styleUrls: ['../../shared/stat-chart/application-stat-chart.component.scss']
})
export class ExchonlineStatChartComponent extends ApplicationStatChart {

  @ViewChild(InventoryStatChartComponent) chart: InventoryStatChartComponent;

  constructor(protected translate: TranslateService,
              protected service: ApplicationInventoryService) {
    super(translate, 'office365', service);
  }


  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }
}
