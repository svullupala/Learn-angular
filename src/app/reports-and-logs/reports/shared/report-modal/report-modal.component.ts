import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  OnDestroy,
  ElementRef
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap';
import { ReportModel } from '../report.model';
import { Observable, Subject } from 'rxjs';
import { ReportCustomComponent } from 'reports/shared/report-custom';
import { DefineSchedule, DynamicTabEntry } from 'shared/components';
import { JsonConvert } from 'json2typescript/src/json2typescript/json-convert';
import { ScheduleModel } from 'shared/components/define-schedule/schedule.model';
import { ReportsService } from 'reports/shared/reports.service';
import { NotificationComponent } from 'shared/components/notification/notification.component';
import { NodeService } from 'core';
import { LinkModel } from 'shared/models/link.model';
import { ReportsModalType } from 'reports/shared/report-shared.model';
import { ReportParameterModel } from 'reports/shared/report-parameter.model';

@Component({
  selector: 'run-report-modal',
  styleUrls: ['./report-modal.component.scss'],
  templateUrl: './report-modal.component.html'
})
export class ReportModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(ReportCustomComponent) reportCustom: ReportCustomComponent;
  @ViewChild(DefineSchedule) scheduleComponent: DefineSchedule;
  @ViewChild(NotificationComponent) notificationComponent: NotificationComponent;
  @ViewChild('tabset', { read: ElementRef }) tabsetEl: ElementRef;
  @ViewChild('parameters', { read: TemplateRef }) public parametersTemplateRef: TemplateRef<any>;
  @ViewChild('schedule', { read: TemplateRef }) public scheduleTemplateRef: TemplateRef<any>;

  public onRunReport = new Subject<ReportParameterModel[]>();
  public onRunSchedule = new Subject<Observable<any>>();
  public isLoading: boolean = false;
  public tabsContentEl: HTMLElement;
  private item: ReportModel;
  private tabs: DynamicTabEntry[] = [];
  private mode: string = 'parameters';
  private defineSchedule: boolean = true;
  private displaySchedule: boolean = false;
  private displayScheduleTab: boolean = false;
  private successText: string;
  private successReportText: string;
  private textSelectOneReport: string;
  private textRunReport: string;
  private textScheduleReportWithDefaultParams: string;
  private textCreateCustomReport: string;
  private textRunCustom: string;
  private textUpdateCustomReport: string;
  private textSchedule: string;
  private textParameters: string;
  private modalType: ReportsModalType;
  private createLink: LinkModel;
  private isSaveCustomReportValid: boolean = false;
  private destroy$ = new Subject();

  constructor(
    private translate: TranslateService,
    public bsModalRef: BsModalRef,
    private reportsService: ReportsService,
    private node: NodeService
  ) {}

  ngOnInit() {
    this.translate
      .get([
        'reports.textSuccessfulReportScheduled',
        'common.successText',
        'reports.textSelectOneReport',
        'reports.textRunReport',
        'reports.textCreateCustomReport',
        'reports.textUpdateCustomReport',
        'reports.textRunCustom',
        'reports.textSchedule',
        'reports.textParameters',
        'reports.textScheduleReportWithDefaultParams'
      ])
      .subscribe((resource: Object) => {
        this.successText = resource['common.successText'];
        this.successReportText = resource['reports.textSuccessfulReportScheduled'];
        this.textSelectOneReport = resource['reports.textSelectOneReport'];
        this.textRunReport = resource['reports.textRunReport'];
        this.textCreateCustomReport = resource['reports.textCreateCustomReport'];
        this.textUpdateCustomReport = resource['reports.textUpdateCustomReport'];
        this.textRunCustom = resource['reports.textRunCustom'];
        this.textSchedule = resource['reports.textSchedule'];
        this.textParameters = resource['reports.textParameters'];
        this.textScheduleReportWithDefaultParams =
          resource['reports.textScheduleReportWithDefaultParams'];
      });
    this.reportsService
      .isCustomReportLoading$()
      .takeUntil(this.destroy$)
      .subscribe(loading => {
        setTimeout(() => {
          this.isLoading = loading;
        }, 0);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.displaySchedule = this.canDisplaySchedule();
      this.displayScheduleTab = this.canDisplayScheduleTab();
      this.initTabs();
      setTimeout(() => {
        if (
          this.item &&
          this.item.trigger &&
          this.item.trigger.activateDate &&
          this.scheduleComponent
        ) {
          this.initSchedule();
        } else {
          this.resetSchedule();
        }
      }, 0);
      if (this.tabsetEl) {
        this.tabsContentEl = this.tabsetEl.nativeElement.getElementsByClassName('tab-content')[0];
      }
    }, 0);
  }

  hide(): void {
    this.bsModalRef.hide();
  }

  onSwitchMode(activeTab: DynamicTabEntry): void {
    this.mode = activeTab.key;
  }

  checkIsSaveCustomReportValid(): boolean {
    return (
      this.isSaveCustomReportValid &&
      (this.displaySchedule
        ? this.isScheduleSaveValid() && this.item && this.item.hasLink('run')
        : true)
    );
  }

  onSaveCustomReportClick(): void {
    let scheduleData = null;

    if (
      this.displaySchedule ||
      (!this.displaySchedule && this.item && this.item.trigger && this.item.trigger.activateDate)
    ) {
      if (this.displaySchedule && this.hasValidNotificationInput()) {
        this.notificationComponent.onAddNotification();
      }
      scheduleData = {
        trigger: this.defineSchedule && this.displaySchedule ? this.getSchedule() : {},
        notification: this.getNotification() || this.item.notification
      };
    }

    this.reportCustom.onSaveClick(scheduleData);
    this.hide();
  }

  getModalTitle(): string {
    switch (this.modalType) {
      case 'run':
        return this.textRunReport;
      case 'schedule':
        return this.textScheduleReportWithDefaultParams;
      case 'custom-create':
        return this.textCreateCustomReport;
      case 'custom-run':
        return this.textRunCustom;
      case 'custom-update':
        return this.textUpdateCustomReport;
      default:
        return '';
    }
  }

  private initSchedule(): void {
    this.scheduleComponent.model = JsonConvert.deserializeObject(this.item.trigger, ScheduleModel);
    this.scheduleComponent.parseDate();
    this.defineSchedule = true;
    this.notificationComponent.setNotification(this.item.notification);
  }

  private canDisplaySchedule(): boolean {
    return (
      this.modalType === 'run' ||
      this.modalType === 'schedule' ||
      (this.modalType === 'custom-update' &&
        this.item &&
        this.item.trigger &&
        this.item.trigger.activateDate)
    );
  }

  private canDisplayScheduleTab(): boolean {
    return this.modalType === 'custom-create' || this.modalType === 'custom-update';
  }

  private canDisplayDefineScheduleCheckbox(): boolean {
    if (this.modalType === 'schedule') {
      return this.item && this.item.trigger && this.item.trigger.activateDate;
    }

    return true;
  }

  private initTabs(): void {
    this.tabs = [
      {
        key: 'parameters',
        title: this.textParameters,
        content: this.parametersTemplateRef,
        refresh: false,
        active: this.mode === 'parameters'
      }
    ];
    if (this.displayScheduleTab) {
      this.tabs.push({
        key: 'schedule',
        title: this.textSchedule,
        content: this.scheduleTemplateRef,
        refresh: false,
        disabled: false,
        active: this.mode === 'schedule'
      });
    }
  }

  private onRunClick(): void {
    const paramValues = this.reportCustom.getCustomParams();

    this.onRunReport.next(paramValues);
    this.hide();
  }

  private resetSchedule(): void {
    if (this.scheduleComponent) {
      this.scheduleComponent.resetSchedule();
      this.defineSchedule = true;
    }
  }

  private getSchedule(): any {
    return this.scheduleComponent && this.scheduleComponent.getSchedule();
  }

  private hasValidSchedule(): boolean {
    return this.defineSchedule && this.scheduleComponent && this.scheduleComponent.isValid();
  }

  private onRunScheduledReportClick(): void {
    let me = this,
      report = me.item,
      observable: Observable<any>;

    this.reportsService.enableLoadingStatus();
    report.setTrigger = me.defineSchedule && me.displaySchedule ? me.getSchedule() : {};

    if (this.displaySchedule && me.hasValidNotificationInput()) {
      me.notificationComponent.onAddNotification();
    }
    report.notification = me.getNotification() || [];

    observable = report.scheduleReport(me.node);
    this.onRunSchedule.next(observable);
    this.hide();
  }

  private getNotification(): Array<string> {
    return this.notificationComponent && this.notificationComponent.getNotification();
  }

  private hasNotification(): boolean {
    let ntf = this.getNotification();
    return ntf && ntf.length > 0;
  }

  private hasValidNotification(): boolean {
    return (
      this.hasValidNotificationInput() ||
      (!this.notificationComponent.validate() &&
        this.notificationComponent.isInputEmpty() &&
        this.hasNotification())
    );
  }

  private hasValidNotificationInput(): boolean {
    return !this.notificationComponent.isInputEmpty() && this.notificationComponent.validate();
  }

  private hasValidReport(): boolean {
    let report = this.item;
    return report !== undefined;
  }

  private hasDefinedScheduleEnabled(): boolean {
    return this.defineSchedule;
  }

  private isScheduleSaveValid(): boolean {
    return (
      !this.hasDefinedScheduleEnabled() ||
      (this.hasValidSchedule() && this.hasValidNotification() && this.hasValidReport()) ||
      (this.modalType === 'schedule' && !this.displaySchedule)
    );
  }

  private onSaveCustomReportValid(value: boolean): void {
    this.isSaveCustomReportValid = value;
  }
}
