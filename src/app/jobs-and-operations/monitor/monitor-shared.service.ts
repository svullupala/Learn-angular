import {Injectable} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { JobSessionModel } from 'job/shared/job-session.model';
import { RestService } from 'core';
import { Observable } from 'rxjs/Observable';
import { JsonConvert } from 'json2typescript';

@Injectable()
export class MonitorSharedService {
  public getJobSessionSub: Subject<JobSessionModel> = new Subject<JobSessionModel>();
  private jobSessionApiWithJobSessionId: string = 'api/endeavour/jobsession';

  get proxy(): RestService {
    return this.rest;
  }

  constructor(private rest: RestService) {}

  public getJobSession(jobSession: JobSessionModel): void {
    this.getJobSessionSub.next(jobSession);
  }

  public getSingleJobSession(jobSession: string): Observable<JobSessionModel> {
    if (jobSession) {
      return this.rest.get(this.jobSessionApiWithJobSessionId, jobSession).map(
        (session: Object) => {
          return JsonConvert.deserializeObject(session, JobSessionModel);
        }
      );
    }
  }
}
