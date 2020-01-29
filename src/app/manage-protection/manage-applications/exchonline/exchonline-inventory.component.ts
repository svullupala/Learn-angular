import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {AppServerModel} from 'appserver/appserver.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {ApplicationListComponent} from '../shared';
import {SqlStatChartComponent} from '../sql';
import {Subscription} from 'rxjs';
import {
  ApplicationInventoryCategory, ApplicationInventoryCategoryLabel,
  ApplicationInventoryService, ApplicationInventoryWorkflow,
  ApplicationRegistrationSubjectModel, ApplicationStatSubjectModel
} from '../shared/application-inventory.service';
import {NvPairModel} from 'shared/models/nvpair.model';
import {InventoryDoughnutChartData} from 'inventory/stat-chart/inventory-stat-chart';

@Component({
  selector: 'exchonline-inventory',
  templateUrl: './exchonline-inventory.component.html',
  styleUrls: ['./exchonline-inventory.component.scss'],
})
export class ExchonlineInventoryComponent {
  @Output() itemSelect = new EventEmitter<AppServerModel>();
  @Output() itemEdit = new EventEmitter<AppServerModel>();
  @Output() assignPolicy = new EventEmitter<BaseApplicationModel>();
  @Output() editRunSettings = new EventEmitter<BaseApplicationModel>();
  @ViewChild(ApplicationListComponent) list: ApplicationListComponent;
  @ViewChild(SqlStatChartComponent) chart: SqlStatChartComponent;

  private applicationType: string = 'office365';
  private subscriptions: Subscription[] = [];
  private view: NvPairModel;
  private selectedCategory: ApplicationInventoryCategory;

  get inCategoryView(): boolean {
    return !!this.selectedCategory;
  }

  constructor(private inventorySvc: ApplicationInventoryService) {
  }

  ngOnInit(): void {
    let me = this;
    me.subscriptions.push(
      ...me.inventorySvc.subscribe<ApplicationRegistrationSubjectModel>('registration',
        undefined,
        value => {
          if (value.workflow === me.applicationType && (value.action === 'register' || value.action === 'unregister'))
            me.refreshList();
        }),
      ...me.inventorySvc.subscribe<ApplicationStatSubjectModel>('stat',
        me.applicationType as ApplicationInventoryWorkflow,
        value => {
          if (value && value.action === 'activate-view')
            me.view = value.target as NvPairModel;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  refreshList(): void {
    this.list.refresh();
  }

  onItemSelect(item: AppServerModel): void {
    this.itemSelect.emit(item);
  }

  onItemEdit(item: AppServerModel): void {
    this.itemEdit.emit(item);
  }

  onStatCategorySelect(item: InventoryDoughnutChartData): void {
    this.selectedCategory = item ? new ApplicationInventoryCategory(
      item.label as ApplicationInventoryCategoryLabel,
      item.value,
      this.applicationType) : undefined;
  }

  onCategoryViewClose(): void {
    this.selectedCategory = undefined;
    if (this.chart)
      this.chart.deselect();
  }

  onAssignPolicy(item: BaseApplicationModel): void {
    this.assignPolicy.emit(item);
  }

  onEditRunSettings(item: BaseApplicationModel): void {
    this.editRunSettings.emit(item);
  }
}
