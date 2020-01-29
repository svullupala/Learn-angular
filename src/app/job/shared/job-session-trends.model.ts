import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI, HasNewOperator, HasProxyAndAPI} from 'shared/models/dataset.model';
import {HasProxy, RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class JobSessionTrendsSummaryStatModel {

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('first', Number, true)
  public first: number = 0;

  @JsonProperty('last', Number, true)
  public last: number = 0;

  @JsonProperty('count', Number, true)
  public count: number = 0;
}

@JsonObject
export class JobSessionTrendsSummaryModel {
  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('start', Number, true)
  public start: number = 0;

  @JsonProperty('end', Number, true)
  public end: number = 0;

  @JsonProperty('segmentNum', Number, true)
  public segmentNum: number = 0;

  @JsonProperty('incrementNum', Number, true)
  public incrementNum: number = 0;

  @JsonProperty('totalCount', Number, true)
  public totalCount: number = 0;

  @JsonProperty('stats', [JobSessionTrendsSummaryStatModel], true)
  public stats: Array<JobSessionTrendsSummaryStatModel> = [];
}

@JsonObject
export class JobSessionTrendsResultModel extends BaseModel {
  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('start', Number, true)
  public start: number = 0;

  @JsonProperty('end', Number, true)
  public end: number = 0;

  @JsonProperty('segmentNum', Number, true)
  public segmentNum: number = 0;

  @JsonProperty('incrementNum', Number, true)
  public incrementNum: number = 0;

  @JsonProperty('totalCount', Number, true)
  public totalCount: number = 0;

  @JsonProperty('stats', [JobSessionTrendsSummaryStatModel], true)
  public stats: Array<JobSessionTrendsSummaryStatModel> = [];
  proxy: RestService;
}

@JsonObject
export class JobSessionTrendsModel implements HasAPI, HasProxy {


  @JsonProperty('summary', JobSessionTrendsSummaryModel, true)
  public summary: JobSessionTrendsSummaryModel = undefined;

  @JsonProperty('results', [JobSessionTrendsResultModel])
  public results: Array<JobSessionTrendsResultModel> = [];

  @JsonProperty('total', Number, true)
  public total: number = 0;

  public proxy: RestService;

  /**
   * A static method to retrieve trends data from server-side by the given model class, proxy,
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
  public static retrieveTrends(classObject: HasNewOperator<HasProxyAndAPI>,
                               proxy: RestService,
                               filters?: Array<FilterModel>,
                               extraParams?: Array<NvPairModel>): Observable<JobSessionTrendsModel> {
    let observable: Observable<Object>, result: Observable<JobSessionTrendsModel>,
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
        let data = body;
        let record: JobSessionTrendsModel;
        try {
          record = <JobSessionTrendsModel>JsonConvert.deserializeObject(data, classObject);
          record.proxy = proxy;
        } catch (e) {
        }
        return record;
      }
    ).catch((error: HttpErrorResponse) => Observable.throw(error));
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
    return 'api/endeavour/jobsession/trends';
  }
}
