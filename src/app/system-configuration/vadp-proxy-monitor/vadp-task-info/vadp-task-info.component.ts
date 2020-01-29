import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { VadpModel } from '../vadp.model';
import { JobStatusTableComponent } from 'job/shared/job-status-table';
import { RunningTasksModel } from '../running-tasks.model';
import { VadpDiskModel } from '../vadp-disk.model';
import { FileSizePipe } from 'shared/pipes/file-size.pipe'

@Component({
  selector: 'vadp-task-info',
  styleUrls: ['./vadp-task-info.component.scss'],
  templateUrl: './vadp-task-info.component.html',
})

export class VadpTaskInfoComponent {
  @Input() model: VadpModel;
  @ViewChild(JobStatusTableComponent) jobTable: JobStatusTableComponent;
  private selectedVm: RunningTasksModel;
  private selectedDisk: VadpDiskModel;

  constructor() {
  }

  public reset(): void {
    this.selectedDisk = undefined;
    this.selectedVm = undefined;
  }

  private onVmSelect(): void {
    this.selectedDisk = undefined;
    if (this.selectedVm && this.selectedVm.hasLink('jobsession')) {
      this.jobTable.setjobTaskFromProxy(this.selectedVm);
      this.jobTable.loadData();
    }
  }
}


