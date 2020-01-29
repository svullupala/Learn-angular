import {HttpErrorResponse} from '@angular/common/http';
import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {ReportModel} from './report.model';
import {NodeService} from 'core';
import {Observable} from 'rxjs/Observable';
import {SessionService} from 'core';
import {ReportsModel} from './reports.model';
import {FilterModel} from 'shared/models/filter.model';

@JsonObject
export class ReportCategoryModel extends BaseModel {

  public static NODE_GET_SCHEDULE_JOB_API = 'ngp/report?userId=';

  @JsonProperty('id', String, true)
  public id: string = undefined;

  public cannedReports: Array<ReportModel> = [];

  public getCannedReports(proxy: NodeService): Observable<any> {
    let me = this, observable: Observable<Object>,
      userId = SessionService.getInstance().getUserId(),
      filter = [new FilterModel('category', me.name).json(), new FilterModel('custom', false).json()],
      result: Observable<any>;
    if (proxy) {
      observable = proxy.getAll(ReportCategoryModel.NODE_GET_SCHEDULE_JOB_API + userId, filter);
      result = observable.map((response: Object) => {
        let dataset: any = response,
            reports;
          try {
            reports = JsonConvert.deserializeObject(dataset.response[0], ReportsModel);
          } catch (e) {}
          return reports;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }
}
