import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {HasAPI, HasNewOperator, HasProxyAndAPI} from 'shared/models/dataset.model';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {NvPairModel} from 'shared/models/nvpair.model';

@JsonObject
export class JobSessionStatsModel extends BaseModel implements HasAPI {

  @JsonProperty('start', Number, true)
  public start: number = 0;

  @JsonProperty('end', Number, true)
  public end: number = 0;

  @JsonProperty('successful', Number, true)
  public successful: number = 0;

  @JsonProperty('failed', Number, true)
  public failed: number = 0;

  @JsonProperty('warning', Number, true)
  public warning: number = 0;

  @JsonProperty('running', Number, true)
  public running: number = 0;

  @JsonProperty('totalRuns', Number, true)
  public totalRuns: number = 0;

  @JsonProperty('successPercent', Number, true)
  public successPercent: number = 0;

  @JsonProperty('WAITING', Number, true)
  public WAITING: number = 0;

  @JsonProperty('RUNNING', Number, true)
  public RUNNING: number = 0;

  @JsonProperty('CANCELLED', Number, true)
  public CANCELLED: number = 0;

  @JsonProperty('STOPPED', Number, true)
  public STOPPED: number = 0;

  @JsonProperty('ABORTED', Number, true)
  public ABORTED: number = 0;

  @JsonProperty('FAILED', Number, true)
  public FAILED: number = 0;

  @JsonProperty('PARTIAL', Number, true)
  public PARTIAL: number = 0;

  @JsonProperty('COMPLETED', Number, true)
  public COMPLETED: number = 0;

  @JsonProperty('OTHER', Number, true)
  public OTHER: number = 0;

  /**
   * A static method to retrieve stats data from server-side by the given type, model class, proxy,
   * optional filters and extraParams parameters.
   *
   * @param classObject The model class.
   * @param proxy {RestService} The data proxy service.
   * @param filters {Array<FilterModel>} optional filters.
   * @param extraParams {Array<NvPairModel>} optional extra params which will append to the request URL.
   *        e.g. If need a URL like 'http://.../api/xxx?from=hlo', pass extra parameters as below.
   *        [ new NvPairModel('from', 'hlo') ]
   * @returns {Observable<JobSessionStatsModel>}
   */
  public static retrieve(classObject: HasNewOperator<HasProxyAndAPI>,
                         proxy: RestService,
                         filters?: Array<FilterModel>,
                         extraParams?: Array<NvPairModel>): Observable<JobSessionStatsModel> {
    let observable: Observable<Object>, result: Observable<JobSessionStatsModel>,
      api = classObject.prototype.api(), params = '';
    if (extraParams) {
      extraParams.forEach(function (param, idx) {
        params += (idx === 0) ? '?' : '&';
        params += `${param.name}=${encodeURIComponent(param.value)}`;
      });
      api += params;
    }
    observable = proxy.getAll(api, FilterModel.array2json(filters));
    result = observable.map((body: Object) => {
      const data = body;
      let record: JobSessionStatsModel;
      try {
        record = <JobSessionStatsModel>JsonConvert.deserializeObject(data, classObject);
        record.proxy = proxy;
      } catch (e) {
      }
      return record;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
    return result;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/jobsession/stats';
  }
}
