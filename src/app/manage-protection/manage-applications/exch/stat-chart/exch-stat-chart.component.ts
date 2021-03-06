import {Component, ViewChild} from '@angular/core';
import {ApplicationStatChart} from 'applicationinventory/stat-chart/application-stat-chart';
import {TranslateService} from '@ngx-translate/core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {ApplicationInventoryService} from 'applicationinventory/application-inventory.service';
import {InventoryStatChartComponent} from 'inventory/stat-chart/inventory-stat-chart.component';

@Component({
  selector: 'exch-stat-chart',
  templateUrl: '../../shared/stat-chart/application-stat-chart.component.html',
  styleUrls: ['../../shared/stat-chart/application-stat-chart.component.scss']
})
export class ExchStatChartComponent extends ApplicationStatChart {
  @ViewChild(InventoryStatChartComponent) chart: InventoryStatChartComponent;
  private textStandalone: string;
  private textGroup: string;

  constructor(protected translate: TranslateService,
              protected service: ApplicationInventoryService) {
    super(translate, 'exch', service);
  }

  ngOnInit() {
    let me = this;
    me.views.push(
      new NvPairModel(me.textStandalone, 'applicationview'),
      new NvPairModel(me.textGroup, 'databasegroupview'));

    super.ngOnInit();

    me.translate.get([
      'application.standaloneText',
      'application.textDatabaseAvailGroups']).takeUntil(me.subs)
      .subscribe((resource: Object) => {

        me.textStandalone = resource['application.standaloneText'];
        me.textGroup = resource['application.textDatabaseAvailGroups'];

        NvPairModel.setName(me.views, 'applicationview', me.textStandalone);
        NvPairModel.setName(me.views, 'databasegroupview', me.textGroup);
      });
  }

  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }
}
