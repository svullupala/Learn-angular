import {Component, ViewChild} from '@angular/core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {TranslateService} from '@ngx-translate/core';
import {HypervisorStatChart} from 'hypervisorinventory/stat-chart/hypervisor-stat-chart';
import {HypervisorInventoryService} from 'hypervisorinventory/hypervisor-inventory.service';
import {InventoryStatChartComponent} from 'inventory/stat-chart/inventory-stat-chart.component';

@Component({
  selector: 'vmware-stat-chart',
  templateUrl: '../../shared/stat-chart/hypervisor-stat-chart.component.html',
  styleUrls: ['../../shared/stat-chart/hypervisor-stat-chart.component.scss']
})
export class VmwareStatChartComponent extends HypervisorStatChart {

  @ViewChild(InventoryStatChartComponent) chart: InventoryStatChartComponent;

  private textVmAndTemplates: string;
  private textVMCategoryTagView: string;
  private textHostsAndClustersView: string;

  constructor(protected translate: TranslateService,
              protected service: HypervisorInventoryService) {
    super(translate, 'vmware', service);
  }

  ngOnInit() {
    let me = this;
    me.views.push(
      new NvPairModel(me.textVmAndTemplates, 'vmview'),
      new NvPairModel(me.textVMCategoryTagView, 'tagview'),
      new NvPairModel(me.textHostsAndClustersView, 'hostview'));

    super.ngOnInit();

    me.translate.get([
      'inventory.textTotalVCentersTpl',
      'hypervisor.textVmAndTemplates',
      'hypervisor.textVMCategoryTagView',
      'hypervisor.textHostsAndClustersView']).takeUntil(me.subs)
      .subscribe((resource: Object) => {

        me.textTotalTpl = resource['inventory.textTotalVCentersTpl'];
        me.textVmAndTemplates = resource['hypervisor.textVmAndTemplates'];
        me.textVMCategoryTagView = resource['hypervisor.textVMCategoryTagView'];
        me.textHostsAndClustersView = resource['hypervisor.textHostsAndClustersView'];

        NvPairModel.setName(me.views, 'vmview', me.textVmAndTemplates);
        NvPairModel.setName(me.views, 'tagview', me.textVMCategoryTagView);
        NvPairModel.setName(me.views, 'hostview', me.textHostsAndClustersView);
      });
  }

  deselect(): void {
    if (this.chart)
      this.chart.deselect();
  }

  protected afterViewsInit(): void {
    let me = this;
    super.afterViewsInit();
    me.sortViews();
  }

  private sortViews(): void {
    let me = this;
    me.views = me.views.sort((a, b) => {
      const keys = ['vmview', 'vms', 'storageview', 'tagview', 'hostview'],
        offset = keys.indexOf(a.value) - keys.indexOf(b.value);
      return offset > 0 ? 1 : (offset < 0 ? -1 : 0);
    });
  }
}
