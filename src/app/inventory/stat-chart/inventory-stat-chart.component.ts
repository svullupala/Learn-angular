import {Component, ViewChild} from '@angular/core';
import {InventoryStatChart} from './inventory-stat-chart';
import {InventoryDoughnutChartComponent} from '../doughnut-chart/inventory-doughnut-chart.component';

@Component({
  selector: 'inventory-stat-chart',
  templateUrl: './inventory-stat-chart.component.html',
  styleUrls: ['./inventory-stat-chart.component.scss'],
})
export class InventoryStatChartComponent extends InventoryStatChart {
  @ViewChild(InventoryDoughnutChartComponent) chart: InventoryDoughnutChartComponent;

  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }
}
