import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {HasProxy, RestService} from 'core';
import {ReportInstanceModel} from './report-instance.model';

@JsonObject
export class ReportTaskModel implements HasProxy {
  proxy: RestService;

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('result', String, true)
  public result: string = undefined;

  @JsonProperty('initialTime', String, true)
  public initialTime: string = undefined;

  @JsonProperty('completeTime', String, true)
  public completeTime: string = undefined;

  @JsonProperty('location', String, true)
  public location: string = undefined;

  query(proxy?: RestService): Observable<ReportTaskModel> {
    let me = this, observable: Observable<Object>, result: Observable<ReportTaskModel>, url = me.getQueryUrl();
    proxy = proxy || me.proxy;
    if (url && url.length > 0 && proxy) {
      observable = proxy.getByUrl(url);
      result = observable.map((response: Object) => {
        const data = response;
        let record: ReportTaskModel;
        try {
          record = <ReportTaskModel> JsonConvert.deserializeObject(data, ReportTaskModel);
          record.proxy = proxy;
          record.location = me.location;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  getResult(proxy?: RestService): Observable<ReportInstanceModel> {
    let me = this, observable: Observable<Object>, result: Observable<ReportInstanceModel>, url = me.result;
    proxy = proxy || me.proxy;
    if (url && url.length > 0 && proxy) {
      observable = proxy.getByUrl(url);
      result = observable.map((response: Object) => {
        const data = response;
        let record: ReportInstanceModel;
        try {
          record = <ReportInstanceModel> JsonConvert.deserializeObject(data, ReportInstanceModel);
          record.proxy = proxy;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  private getQueryUrl(): string {
    let me = this, idx, location = me.location, url = location || '';
    if (location && location.length > 0) {
      idx = url.indexOf('?');
      if (idx === -1)
        url += '?';
      idx = url.lastIndexOf('&');
      if (idx !== -1 && idx < url.length - 1)
        url += '&';
      url += `id=${encodeURIComponent(location)}`;
    }
    return url;
  }
}
