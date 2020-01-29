import { Component } from '@angular/core';

@Component({
  selector: 'hypervisor-assign-policy-recent-jobs',
  templateUrl: './recent-jobs.component.html',
  styleUrls: ['./recent-jobs.component.scss']
})
export class RecentJobsComponent {
  recentJobs: any[] = new Array(2);

  constructor() {}
}
