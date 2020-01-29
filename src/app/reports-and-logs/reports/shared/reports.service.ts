import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { ReportModel } from 'reports/shared/report.model';

export interface CustomReportSavedEvent {
  item: ReportModel;
  options: {
    removeSchedule?: boolean;
  };
}

@Injectable()
export class ReportsService {
  public customReportSavedSuccessfully = new Subject<CustomReportSavedEvent>();
  private isGlobalLoading = new BehaviorSubject<boolean>(false);
  private isCustomReportLoading = new BehaviorSubject<boolean>(false);

  constructor() {}

  public enableLoadingStatus(): void {
    this.isGlobalLoading.next(true);
  }

  public disableLoadingStatus(): void {
    this.isGlobalLoading.next(false);
  }

  public isGlobalLoading$(): Observable<boolean> {
    return this.isGlobalLoading.asObservable();
  }

  public enableCustomReportLoadingStatus(): void {
    this.isCustomReportLoading.next(true);
  }

  public disableCustomReportLoadingStatus(): void {
    this.isCustomReportLoading.next(false);
  }

  public isCustomReportLoading$(): Observable<boolean> {
    return this.isCustomReportLoading.asObservable();
  }

  public customReportSavedSuccessfully$(): Observable<CustomReportSavedEvent> {
    return this.customReportSavedSuccessfully.asObservable();
  }
}
