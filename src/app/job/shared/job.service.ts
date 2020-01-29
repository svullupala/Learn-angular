import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {JobModel} from './job.model';
import {JobsModel} from './jobs.model';
import {JobSessionModel} from './job-session.model';
import {JobSessionsModel} from './job-sessions.model';
import {JobLogModel} from './job-log.model';
import {JobLogsModel} from './job-logs.model';
import {SorterModel} from 'shared/models/sorter.model';
import {DownloaderComponent} from 'shared/components/downloader/downloader.component';
import {NodeService} from 'core';
import {SharedService} from 'shared/shared.service';
import {Subject} from 'rxjs/Subject';
import {PolicyModel} from './policy.model';


@Injectable()
export class JobService {

  public static jobAPI = 'api/endeavour/job';
  public static jobSessionAPI = 'api/endeavour/jobsession';
  public static logAPI = 'api/endeavour/log/job';
  public static NODE_JOB_API = 'ngp/{0}/job?subtype={1}';
  public static NODE_DELETE_JOB = 'ngp/{0}/job?name={1}';
  public jobSessionTotalItems: number = 0;
  public policySubject = new Subject<JobModel>();

  get proxy(): RestService {
    return this.core;
  }

  constructor(private core: RestService, private node: NodeService) {
  }

  /**
   * sendPolicyDefinition method
   * Broadcast a message with the policy definition to all components that are subscribed to this subject.
   * @param policy {policy} The policy.
   */
  public sendPolicyDefinition(policy: JobModel): void {
    this.policySubject.next(policy);
  }

  /**
   * GetAll method (non-paginate).
   * @param api {String} The API.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  getAll(api: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
         pageSize?: number, pageStartIndex?: number): Observable<Object> {
    return this.core.getAll(api, FilterModel.array2json(filters),
      SorterModel.array2json(sorters), pageSize, pageStartIndex);
  }

  /**
   * GetPage method (paginate).
   * @param api {String} The API.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {Observable<Object>}
   */
  getPage(api: string,
          filters?: Array<FilterModel>, sorters?: Array<SorterModel>, pageSize?: number,
          pageStartIndex?: number): Observable<Object> {
    return this.core.getPage(api, FilterModel.array2json(filters),
      SorterModel.array2json(sorters), pageSize, pageStartIndex);
  }

  /**
   * GetByUrl method.
   * @param url {String} The URL.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  getByUrl(url: string,
           filters?: Array<FilterModel>,
           sorters?: Array<SorterModel>, pageSize?: number, pageStartIndex?: number): Observable<Object> {
    return this.core.getByUrl(url, FilterModel.array2json(filters),
      SorterModel.array2json(sorters), pageSize, pageStartIndex);
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  }

  /**
   * Gets jobs (paginate).
   *
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {Observable<JobsModel>}
   */
  getJobs(filters?: Array<FilterModel>,
          sorters?: Array<SorterModel>,
          pageSize?: number,
          pageStartIndex?: number): Observable<JobsModel> {
    let me = this;
    return me.getPage(JobService.jobAPI, filters, sorters, pageSize, pageStartIndex).map((response: Object) => {
      const data = response;
      let dataset: JobsModel;
      if (data['jobs'] !== undefined) {
        // Cast the JSON object to JobsModel instance.
        dataset = JsonConvert.deserializeObject(data, JobsModel);
      }
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Gets jobs (paginate) from nodeJs for CRUD purposes.
   * EX: ngp/{providerEndPoint}/job?subtype={providerType}
   * when params are provided the results = ngp/hypervisor/job/subtype?=vmware
   *
   * @param providerType {string} subtype.
   * @param providerEndPoint {string} provider endpoint to talk to.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {Observable<JobsModel>}
   */
  getJobsFromNode(providerType: string, providerEndPoint: string, filters?: Array<FilterModel>,
          sorters?: Array<SorterModel>,
          pageSize?: number,
          pageStartIndex?: number): Observable<JobsModel> {
    let me = this,
        api = SharedService.formatString(JobService.NODE_JOB_API, providerEndPoint, providerType);
    return me.node.getAll(api, filters,
      sorters, pageSize, pageStartIndex).map((response: Object) => {
      const data = response;
      let dataset: JobsModel;
      if (data && data['response']) {
        // Cast the JSON object to JobsModel instance.
        dataset = JsonConvert.deserializeObject(data['response'], JobsModel);
      } else if (data) {
        // Cast the JSON object to JobsModel instance.
        dataset = JsonConvert.deserializeObject(data, JobsModel);
      }
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Delete jobs using nodeJs.
   * EX: ngp/{providerEndPoint}/job?name={jobName}
   * when params are provided the results = DELETE ngp/hypervisor/job/name?=cool_job
   *
   * @param providerEndPoint {string} provider endpoint to talk to.
   * @param jobName {string} Job Name.
   * @returns {Object}
   */
  deleteJobsFromNode(providerEndPoint: string, jobName: string): Observable<JobsModel> {
    let me = this,
      // api =  me.node.getBaseUrl() + SharedService.formatString(JobService.NODE_DELETE_JOB, providerEndPoint, jobName);
      // this sucks and temp workaround. We encode url to account for white space for previously created jobs
      // 10.1.3 will remove since we account for white space and trim the string.
      api =  encodeURI(me.node.getBaseUrl() + 'ngp/' + providerEndPoint + '/job?name=' + jobName);
    return me.node.deleteByUrl(api).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Gets job sessions.
   *
   * @param job {JobModel} Optional job model.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Array<JobSessionModel>>}
   */
  getJobSessions(job?: JobModel, filters?: Array<FilterModel>,
                 sorters?: Array<SorterModel>,
                 pageSize?: number, pageStartIndex?: number): Observable<Array<JobSessionModel>> {
    let me = this, observable: Observable<Object>, result, link = job ?
      (job.getLink('jobsessions') || job.getLink('jobsession')) : null;

    observable = link ? me.getByUrl(link.href, filters, sorters, pageSize, pageStartIndex) :
      me.getAll(JobService.jobSessionAPI, filters, sorters, pageSize, pageStartIndex);
    result = observable.map((response: Object) => {
      const data = response;
      let dataset, records;
      if (data['sessions'] !== undefined) {
        // Cast the JSON object to JobSessionsModel instance.
        dataset = JsonConvert.deserializeObject(data, JobSessionsModel);
        records = <Array<JobSessionModel>> dataset.records;
        me.jobSessionTotalItems = dataset.total;
      } else {
        // Cast the JSON object to single JobSessionModel instance.
        let record = JsonConvert.deserializeObject(data, JobSessionModel);
        dataset = new JobSessionsModel();
        dataset.links = record.links ? {
          self: record.links.self
        } : {};
        dataset.page = 1;
        dataset.total = 1;
        dataset.sessions = [record];
        records = <Array<JobSessionModel>> dataset.records;
        me.jobSessionTotalItems = dataset.total;
      }
      return records;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));

    return result;
  }

  /**
   * Gets logs.
   *
   * @param session {JobSessionModel} Optional job session model.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Array<JobSessionModel>>}
   */
  getLogs(session?: JobSessionModel, filters?: Array<FilterModel>,
          sorters?: Array<SorterModel>, pageSize?: number, pageStartIndex?: number): Observable<Array<JobLogModel>> {
    let me = this, observable: Observable<Object>, result, link = session ? session.getLink('log') : null;

    observable = link ? me.getByUrl(link.href, filters, sorters) :
      me.getAll(JobService.logAPI, filters, sorters, pageSize, pageStartIndex);
    result = observable.map((response: Object) => {
      const data = response;
      let dataset, records;
      if (data['logs'] !== undefined) {
        // Cast the JSON object to JobLogsModel instance.
        dataset = JsonConvert.deserializeObject(data, JobLogsModel);
        records = <Array<JobLogModel>> dataset.records;
      }
      return records;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));

    return result;
  }


  /**
   * Download logs.
   *
   * @param session {JobSessionModel} job session model.
   * @param downloader {DownloaderComponent} The downloader component
   */
  downloadLogs(session: JobSessionModel, downloader: DownloaderComponent): void {
    let link = session.getLink('diagnostics');
    if (downloader && link) {
      downloader.download(link.href);
    }
  }

  /**
   * PostByUrl method.
   * @param url {String} The URL.
   * @returns {Observable<Object>}
   */
  postByUrl(url: string): Observable<Object> {
    return this.core.postByUrl(url, {});
  }
}
