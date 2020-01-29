import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { NodeService, SessionService } from 'core';
import { ReportModel } from '../report.model';
import { ReportsModel, ReportsModelNgp } from '../reports.model';
import { RestService } from 'core';
import { FilterModel } from 'shared/models/filter.model';
import { DatasetModel } from 'shared/models/dataset.model';
import { LinkModel } from 'shared/models/link.model';
import { Subscription } from 'rxjs';
import { SharedService } from 'shared/shared.service';
import { ReportsModalContent } from 'reports/shared/report-shared.model';
import { ReportCategoryModel } from 'reports/shared/report-category.model';

export interface CategoriesDropdownOption {
  name: string;
  value: string;
}

@Component({
  selector: 'reports-table',
  templateUrl: './reports-table.component.html',
  styleUrls: ['./reports-table.component.scss']
})
export class ReportsTableComponent implements OnInit, OnChanges, OnDestroy {
  @Output() deleteClick = new EventEmitter<ReportModel>();
  @Output() customClick = new EventEmitter<ReportModel>();
  @Output() onRunReport = new EventEmitter<ReportsModalContent>();
  @Output() onScheduleReport = new EventEmitter<ReportsModalContent>();
  @Output() onCreateOrUpdateCustomReport = new EventEmitter<ReportsModalContent>();
  @Output() reportsLoad = new EventEmitter<DatasetModel<ReportModel>>();
  @Input() isCustomReports: boolean = false;
  @Input() categories: ReportCategoryModel[] = [];

  public textRunReport: string;
  public textCreateCustomReport: string;
  public textRunCustom: string;
  public textUpdateCustomReport: string;
  public textRemoveReport: string;
  public textScheduleReportWithDefaultParams: string;
  public textAll: string;
  public dropdownCategories: CategoriesDropdownOption[] = [];
  public selectedCategory: CategoriesDropdownOption;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private records: Array<ReportModel>;
  private masked: boolean = false;
  private createLink: LinkModel;
  private deleteSub: Subscription;
  private textConfirm: string;
  private textConfirmDelete: string;

  constructor(
    private restService: RestService,
    private nodeService: NodeService,
    private translate: TranslateService
  ) {}

  handleError(err: any, node?: boolean): void {
    if (this.errorHandler) this.errorHandler.handle(err, node);
  }

  ngOnInit() {
    this.translate
      .get([
        'common.textConfirm',
        'common.textConfirmDelete',
        'reports.textRunReport',
        'reports.textCreateCustomReport',
        'reports.textUpdateCustomReport',
        'reports.textRunCustom',
        'reports.textRemoveReport',
        'reports.textScheduleReportWithDefaultParams',
        'reports.textAll'
      ])
      .subscribe((resource: Object) => {
        this.textConfirm = resource['common.textConfirm'];
        this.textConfirmDelete = resource['common.textConfirmDelete'];
        this.textRunReport = resource['reports.textRunReport'];
        this.textCreateCustomReport = resource['reports.textCreateCustomReport'];
        this.textUpdateCustomReport = resource['reports.textUpdateCustomReport'];
        this.textRunCustom = resource['reports.textRunCustom'];
        this.textRemoveReport = resource['reports.textRemoveReport'];
        this.textScheduleReportWithDefaultParams = resource['reports.textScheduleReportWithDefaultParams'];
        this.textAll = resource['reports.textAll'];
      });
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.categories.previousValue !== changes.categories.currentValue &&
      !!changes.categories.currentValue.length
    ) {
      this.dropdownCategories = this.categories.map(cat => ({
        name: cat.displayName,
        value: cat.name
      }));

      if (!this.isCustomReports) {
        const allOption = { name: this.textAll, value: 'all' };
        this.dropdownCategories = [allOption, ...this.dropdownCategories];
        this.selectedCategory = allOption;
      } else {
        this.selectedCategory = this.dropdownCategories.find(cat => cat.name === 'System');
      }
    }
  }

  ngOnDestroy() {
    if (this.deleteSub) {
      this.deleteSub.unsubscribe();
    }
  }

  loadData(filters: FilterModel[] = []): void {
    // TODO: This observable is only for development, should be removed in future
    // const observable = ReportsModel.retrieve<ReportModel, ReportsModel>(
    //   ReportsModel,
    //   this.restService,
    //   [new FilterModel('custom', this.isCustomReports, '=')],
    //   null,
    //   null,
    //   null,
    //   [{ name: 'userId', value: SessionService.getInstance().getUserId() }]
    // );

    const observable = ReportsModelNgp.getReports(this.nodeService, [
      new FilterModel('custom', String(this.isCustomReports), '='),
      ...filters,
      ...(!filters.length && this.isCustomReports
        ? [new FilterModel('category', 'System', '=')]
        : [])
    ]);

    if (observable) {
      this.mask();
      observable.subscribe(
        dataset => {
          this.records = dataset.reports;
          this.unmask();
          this.onReportsLoad(dataset);
        },
        err => this.handleError(err, false)
      );
    }
  }

  onClickRunReport(item: ReportModel): void {
    const data: ReportsModalContent = {
      item,
      modalType: this.isCustomReports ? 'custom-run' : 'run'
    };
    this.onRunReport.emit(data);
  }

  onClickScheduleReport(item: ReportModel): void {
    const data: ReportsModalContent = {
      item,
      modalType: 'schedule'
    };
    this.onScheduleReport.emit(data);
  }

  onClickCreateCustomReport(item: ReportModel): void {
    const data: ReportsModalContent = {
      item,
      createLink: this.createLink,
      modalType: 'custom-create'
    };
    this.onCreateOrUpdateCustomReport.emit(data);
  }

  onClickUpdateCustomReport(item: ReportModel): void {
    const data: ReportsModalContent = {
      item,
      createLink: this.createLink,
      modalType: 'custom-update'
    };
    this.onCreateOrUpdateCustomReport.emit(data);
  }

  onCategoriesFilterChange(category: CategoriesDropdownOption): void {
    this.selectedCategory = category;

    if (this.selectedCategory.value === 'all') {
      this.loadData();
    } else {
      const categoryFilter = new FilterModel('category', this.selectedCategory.name, '=');

      this.loadData([categoryFilter]);
    }
  }

  private mask(): void {
    this.masked = true;
  }

  private unmask(): void {
    this.masked = false;
  }

  private onReportsLoad(reports: DatasetModel<ReportModel>): void {
    this.createLink = reports.getLink('create');
  }

  private onDeleteClick(item: ReportModel): void {
    let me = this;

    me.confirm(item, function() {
      me.mask();
      me.deleteSub = item.remove(me.nodeService).subscribe(
        () => {
          const category = new FilterModel('category', me.selectedCategory.name, '=');
          me.unmask();
          me.loadData([category]);
        },
        err => {
          me.unmask();
          me.handleError(err, true);
        }
      );
    });
  }

  private confirm(item: ReportModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(
        me.textConfirm,
        SharedService.formatString(me.textConfirmDelete, item.name),
        AlertType.CONFIRMATION,
        handler
      );
  }
}
