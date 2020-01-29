import {Component, ViewChild} from '@angular/core';
import {HypervisorStatChart} from 'hypervisorinventory/stat-chart/hypervisor-stat-chart';
import {TranslateService} from '@ngx-translate/core';
import {HypervisorInventoryService} from 'hypervisorinventory/hypervisor-inventory.service';
import {InventoryStatChartComponent} from 'inventory/stat-chart/inventory-stat-chart.component';

@Component({
  selector: 'hyperv-stat-chart',
  templateUrl: '../../shared/stat-chart/hypervisor-stat-chart.component.html',
  styleUrls: ['../../shared/stat-chart/hypervisor-stat-chart.component.scss']
})
export class HypervStatChartComponent extends HypervisorStatChart {

  @ViewChild(InventoryStatChartComponent) chart: InventoryStatChartComponent;

  constructor(protected translate: TranslateService,
              protected service: HypervisorInventoryService) {
    super(translate, 'hyperv', service);
  }

  ngOnInit() {
    let me = this;
    super.ngOnInit();

    me.translate.get([
      'inventory.textTotalHyperVServersTpl']).takeUntil(me.subs)
      .subscribe((resource: Object) => {

        me.textTotalTpl = resource['inventory.textTotalHyperVServersTpl'];

      });
  }

  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }
}
