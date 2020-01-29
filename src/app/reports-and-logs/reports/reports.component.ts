import { Component, OnDestroy, OnInit, Renderer, TemplateRef, ViewChild } from '@angular/core';
import 'rxjs/add/operator/delay';
import { Observable } from 'rxjs/Observable';
import { JsonConvert } from 'json2typescript';
import { TranslateService } from '@ngx-translate/core';
import {
  AlertType,
  AlertComponent,
  ErrorHandlerComponent,
  DynamicTabEntry,
  DynamicTabsetComponent
} from 'shared/components';
import { SessionService } from 'core';
import { ReportCustomComponent } from './shared/report-custom/report-custom.component';
import { LinkModel } from 'shared/models/link.model';
import { ReportModel } from './shared/report.model';
import { ReportInstanceModel } from './shared/report-instance.model';
import { ReportViewerComponent } from './shared/report-viewer/report-viewer.component';
import { ActionSchemaModel } from './shared/action-schema.model';
import { HateoasModel } from 'shared/models/hateoas.model';
import { ReportParameterModel } from './shared/report-parameter.model';
import { ReportTaskModel } from './shared/report-task.model';
import { DatasetModel } from 'shared/models/dataset.model';
import { DefineSchedule } from 'shared/components/define-schedule/define-schedule.component';
import { NodeService } from 'core';
import { NotificationComponent } from 'shared/components/notification/notification.component';
import { RestService } from 'core';
import { ScheduleModel } from 'shared/components/define-schedule/schedule.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ReportModalComponent } from 'reports/shared/report-modal/report-modal.component';
import { ReportsTableComponent } from 'reports/shared/reports-table';
import { ReportsService } from 'reports/shared/reports.service';
import { SharedService } from 'shared/shared.service';
import { Subject } from 'rxjs';
import { ReportsModalContent } from 'reports/shared/report-shared.model';
import { ReportCategoryModel } from 'reports/shared/report-category.model';
import { ReportCategoriesModel } from 'reports/shared/report-categories.model';
import { SorterModel } from 'shared/models/sorter.model';
import { FilterModel } from 'shared/models/filter.model';

@Component({
  selector: 'reports',
  styleUrls: ['./reports.scss'],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit, OnDestroy {
  @ViewChild(ReportCustomComponent) reportCustom: ReportCustomComponent;
  @ViewChild(ReportViewerComponent) reportViewer: ReportViewerComponent;
  @ViewChild(DefineSchedule) scheduleComponent: DefineSchedule;
  @ViewChild(NotificationComponent) notificationComponent: NotificationComponent;
  @ViewChild(DynamicTabsetComponent) dynamicTabSet: DynamicTabsetComponent;
  @ViewChild('customReportsTable') customReportsTable: ReportsTableComponent;
  @ViewChild('reportsTable') reportsTable: ReportsTableComponent;
  @ViewChild('reports', { read: TemplateRef }) public reportsTemplateRef: TemplateRef<any>;
  @ViewChild('customReports', { read: TemplateRef }) public customReportsTemplateRef: TemplateRef<any>;

  public reportInstance: ReportInstanceModel;
  public bsModalRef: BsModalRef;
  public isLoading: boolean = false;
  public categories: ReportCategoryModel[] = [];
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private createLink: LinkModel;
  private tabs: DynamicTabEntry[] = [];
  private selectedTab: 'reports' | 'customReports' = 'reports';
  private successText: string;
  private successReportText: string;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private textSelectOneReport: string;
  private textReports: string;
  private textCustomReports: string;
  private reportInstanceDisplayName: string;
  private defineSchedule: boolean = false;
  private masked: boolean = false;
  private isCreatingReport: boolean = false;
  private isReportViever: boolean = false;
  private destroy$ = new Subject();

  constructor(
    private translate: TranslateService,
    private renderer: Renderer,
    private rest: RestService,
    private node: NodeService,
    private modalService: BsModalService,
    private reportsService: ReportsService
  ) {}

  ngOnDestroy() {
    SharedService.maximizeContent(true);
    this.destroy$.next();
  }

  ngOnInit() {
    let me = this;

    SharedService.maximizeContent(false, true);
    me.translate
      .get([
        'common.infoTitle',
        'common.warningTitle',
        'common.processingRequestMsg',
        'common.textConfirm',
        'common.textConfirmDelete',
        'reports.textSuccessfulReportScheduled',
        'common.successText',
        'reports.textSelectOneReport',
        'reports.textReports',
        'reports.textCustomReports'
      ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.successText = resource['common.successText'];
        me.successReportText = resource['reports.textSuccessfulReportScheduled'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['common.textConfirmDelete'];
        me.textSelectOneReport = resource['reports.textSelectOneReport'];
        me.textReports = resource['reports.textReports'];
        me.textCustomReports = resource['reports.textCustomReports'];

        this.tabs = this.prepareTabs();
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    this.loadCategories();
    this.reportsService
      .isGlobalLoading$()
      .takeUntil(this.destroy$)
      .subscribe(loading => {
        setTimeout(() => {
          this.isLoading = loading;
        }, 0);
      });
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string, type?: AlertType) {
    let me = this;
    if (me.alert) me.alert.show(title || me.infoTitle, message, type);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler) me.errorHandler.handle(err, node);
  }

  onWizardCancel(): void {
    this.isCreatingReport = false;
  }

  onWizardSubmit(): void {
    this.isCreatingReport = false;
  }

  onSelect(reportModel: ReportModel): void {
    if (reportModel && reportModel.trigger && reportModel.trigger.activateDate && this.scheduleComponent) {
      this.scheduleComponent.model = JsonConvert.deserializeObject(reportModel.trigger, ScheduleModel);
      this.scheduleComponent.parseDate();
      this.defineSchedule = true;
      if (this.notificationComponent && reportModel.notification) {
        this.notificationComponent.setNotification(reportModel.notification);
      }
    } else {
      this.resetSchedule();
    }
  }

  onBackBtnClick(): void {
    this.isReportViever = false;
    SharedService.maximizeContent(false, true);
  }

  onRunReport(data: ReportsModalContent): void {
    if (this.notificationComponent && data.item.notification) {
      this.notificationComponent.setNotification(data.item.notification);
    }
    this.bsModalRef = this.modalService.show(ReportModalComponent, { backdrop: 'static', class: 'modal-lg' });
    this.bsModalRef.content.item = data.item;
    this.bsModalRef.content.modalType = data.modalType;

    this.bsModalRef.content.onRunReport.takeUntil(this.destroy$).subscribe(paramValues => {
      this.handleRunReport(data.item, paramValues);
    });
  }

  onScheduleReport(data: ReportsModalContent): void {
    this.bsModalRef = this.modalService.show(ReportModalComponent, { backdrop: 'static', class: 'modal-lg' });
    this.bsModalRef.content.item = data.item;
    this.bsModalRef.content.createLink = data.createLink;
    this.bsModalRef.content.modalType = data.modalType;

    this.bsModalRef.content.onRunSchedule.takeUntil(this.destroy$).subscribe(obs => {
      obs.subscribe(
        () => {
          this.reportsService.disableLoadingStatus();
          this.info(this.successReportText, this.successText, AlertType.INFO);
          this.reportsTable.loadData();
        },
        err => {
          this.reportsService.disableLoadingStatus();
          this.handleError(err, true);
        }
      );
    });
  }

  onCreateOrUpdateCustomReport(data: ReportsModalContent): void {
    this.bsModalRef = this.modalService.show(ReportModalComponent, { backdrop: 'static', class: 'modal-lg' });
    this.bsModalRef.content.item = data.item;
    this.bsModalRef.content.createLink = data.createLink;
    this.bsModalRef.content.modalType = data.modalType;

    this.reportsService
      .customReportSavedSuccessfully$()
      .take(1)
      .subscribe(event => {
        if (
          !!Object.keys(event.item.setTrigger).length ||
          (event.options && event.options.removeSchedule)
        ) {
          this.changeSelectedTab('customReports');
          event.item
            .scheduleReport(this.node)
            .takeUntil(this.destroy$)
            .take(1)
            .subscribe(
              () => {
                this.reportsService.disableLoadingStatus();
                this.onSaveCustomReportSuccess(data.item.category);
              },
              err => {
                this.reportsService.disableLoadingStatus();
                this.onSaveCustomReportSuccess(data.item.category);
                this.handleError(err, true);
              }
            );
        } else {
          this.reportsService.disableLoadingStatus();
          this.onSaveCustomReportSuccess(data.item.category);
        }
      });
  }

  private prepareTabs(): DynamicTabEntry[] {
    return [
      {
        key: 'reports',
        title: this.textReports,
        content: this.reportsTemplateRef,
        refresh: false,
        active: this.selectedTab === 'reports'
      },
      {
        key: 'customReports',
        title: this.textCustomReports,
        content: this.customReportsTemplateRef,
        refresh: false,
        active: this.selectedTab === 'customReports'
      }
    ];
  }

  private loadCategories(): void {
    ReportCategoriesModel.retrieve<ReportCategoryModel, ReportCategoriesModel>(
      ReportCategoriesModel,
      this.rest,
      null,
      [new SorterModel('name', 'ASC')]
    ).subscribe(res => {
      this.categories = res.categories;
    });
  }

  private changeSelectedTab(type: 'reports' | 'customReports'): void {
    this.tabs[0].active = type === 'reports';
    this.tabs[1].active = type === 'customReports';
    this.selectedTab = type;

    if (this.dynamicTabSet) {
      this.dynamicTabSet.runChangeDetection();
    }
  }

  private resetSchedule(): void {
    if (this.scheduleComponent) {
      this.scheduleComponent.resetSchedule();
      this.defineSchedule = false;
    }
  }
  /**
   * Gets Run Payload by the given action schema.
   * @param {ActionSchemaModel} schema
   * @param {ReportParameterModel} params
   * @returns {{[p: string]: any}}
   */
  private getRunPayload(schema: ActionSchemaModel, params: ReportParameterModel[]) {
    let me = this,
      payload: { [key: string]: any } = {};

    // Extract default parameters from action schema.
    if (schema.parameter && schema.parameter.paramValues && schema.parameter.paramValues.objectSchema) {
      HateoasModel.each(
        schema.parameter.paramValues.objectSchema,
        function(key, value) {
          let item = <ReportParameterModel>value;
          payload[key] = item.defaultValue;
        },
        me
      );
    }

    // Override the parameters using custom items.
    if (params && params.length > 0) {
      params.forEach(function(param) {
        if (payload.hasOwnProperty(param.name)) payload[param.name] = param.value;
      });
    }

    return { paramValues: payload };
  }

  private getGeneratedReport(task: ReportTaskModel): void {
    let me = this,
      observable: Observable<ReportInstanceModel>;
    me.mask();
    observable = task.getResult();
    if (observable)
      observable.subscribe(
        record => {
          me.onViewClick(record);
        },
        err => {
          me.unmask();
          me.handleError(err);
        },
        () => {
          me.unmask();
        }
      );
    else me.unmask();
  }

  private waitComplete(task: ReportTaskModel, mask?: boolean): void {
    let me = this,
      observable: Observable<ReportTaskModel>;
    if (mask) me.reportsService.enableLoadingStatus();
    observable = task.query();
    if (observable)
      observable.delay(2000).subscribe(
        record => {
          if (record.status === 'RUNNING') me.waitComplete(record, false);
          else {
            me.reportsService.disableLoadingStatus();
            if (record.status === 'SUCCESS') me.getGeneratedReport(record);
          }
        },
        err => {
          me.reportsService.disableLoadingStatus();
          me.handleError(err);
        }
      );
    else {
      me.reportsService.disableLoadingStatus();
    }
  }

  private runReport(payload: Object, report: ReportModel): void {
    let me = this,
      observable: Observable<ReportTaskModel>;
    if (report) {
      this.reportsService.enableLoadingStatus();
      observable = report.run(payload);
      if (observable)
        observable.subscribe(
          record => {
            me.reportsService.disableLoadingStatus();
            me.waitComplete(record, true);
          },
          err => {
            me.reportsService.disableLoadingStatus();
            me.handleError(err);
          }
        );
      else me.reportsService.disableLoadingStatus();
    }
  }

  private onViewClick(item: ReportInstanceModel): void {
    this.reportInstance = item;
    this.isReportViever = true;
    SharedService.maximizeContent(true);
    setTimeout(() => {
      this.reportViewer.loadData(item);
    }, 0);
  }

  private handleRunReport(report: ReportModel, params: ReportParameterModel[]): void {
    let me = this,
      observable: Observable<ActionSchemaModel>;
    this.reportInstanceDisplayName = report['displayName'];
    this.reportsService.enableLoadingStatus();
    observable = report.getRunActionSchema(me.rest);

    if (observable)
      observable.subscribe(
        schema => {
          let payload = me.getRunPayload(schema, params);
          me.runReport(payload, report);
        },
        err => {
          this.reportsService.disableLoadingStatus();
          me.handleError(err);
        }
      );
    else this.reportsService.disableLoadingStatus();
  }

  private onReportsLoad(reports: DatasetModel<ReportModel>): void {
    this.createLink = reports.getLink('create');
  }

  private onSaveCustomReportSuccess(categoryName: string): void {
    this.changeSelectedTab('customReports');
    if (this.customReportsTable) {
      const category = this.categories.find(cat => cat.displayName === categoryName);
      const categoryFilter = [new FilterModel('category', category.name, '=')];

      this.customReportsTable.selectedCategory = { name: category.displayName, value: category.name };
      this.customReportsTable.loadData(categoryFilter);
    }
  }
}
