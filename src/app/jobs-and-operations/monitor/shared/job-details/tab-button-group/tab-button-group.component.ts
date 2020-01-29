import { Component, Input, Output, EventEmitter, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { JobSessionModel } from 'job/shared/job-session.model';
@Component({
  selector: 'tab-button-group',
  styleUrls: ['./tab-button-group.scss'],
  templateUrl: './tab-button-group.component.html'
})
export class TabButtonGroupComponent implements OnInit, OnChanges {
  @Input() buttonProgress: string = undefined;
  @Input() buttonJobLog: string = undefined;
  @Input() buttonConcurrentJobs: string = undefined;
  @Input() jobSession: JobSessionModel;
  @Output() onSelectTab = new EventEmitter();

  isButtonProgressNgClassEnabled: boolean;
  isButtonJobLogStyledNgClassEnabled: boolean;
  isButtonConcurrentJobsNgClassEnabled: boolean = true;

  ngOnInit() {
    this.isButtonProgressNgClassEnabled = this.isProgressTabDisplayed() ? false : true;
    this.isButtonJobLogStyledNgClassEnabled = this.isProgressTabDisplayed() ? true : false;
  }

  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (
      simpleChanges['jobSession'] &&
      simpleChanges['jobSession']['previousValue'] &&
      simpleChanges['jobSession']['currentValue']
    ) {
      if (
        (simpleChanges['jobSession']['previousValue']['serviceId'] !== 'serviceprovider.maintenance' ||
          simpleChanges['jobSession']['previousValue']['serviceId'] !== 'serviceprovider.report') &&
        (simpleChanges['jobSession']['currentValue']['serviceId'] === 'serviceprovider.maintenance' ||
          simpleChanges['jobSession']['currentValue']['serviceId'] === 'serviceprovider.report') &&
        !this.isButtonProgressNgClassEnabled
      ) {
        this.onClickEvent('JOB_LOG');
      }
    }
  }

  onClickEvent(button): void {
    switch (button) {
      case 'PROGRESS':
        this.isButtonProgressNgClassEnabled = false;
        this.isButtonJobLogStyledNgClassEnabled = true;
        this.isButtonConcurrentJobsNgClassEnabled = true;
        this.onSelectTab.emit(button);
        return;
      case 'JOB_LOG':
        this.isButtonProgressNgClassEnabled = true;
        this.isButtonJobLogStyledNgClassEnabled = false;
        this.isButtonConcurrentJobsNgClassEnabled = true;
        this.onSelectTab.emit(button);
        return;
      case 'CONCURRENT_JOBS':
        this.isButtonProgressNgClassEnabled = true;
        this.isButtonJobLogStyledNgClassEnabled = true;
        this.isButtonConcurrentJobsNgClassEnabled = false;
        this.onSelectTab.emit(button);
        return;
      default:
        return;
    }
  }

  private isProgressTabDisplayed() {
    return (
      this.jobSession &&
      this.jobSession.serviceId !== 'serviceprovider.maintenance' &&
        this.jobSession.serviceId !== 'serviceprovider.report'
    );
  }
}
