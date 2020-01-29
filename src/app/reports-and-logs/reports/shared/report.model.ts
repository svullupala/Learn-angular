import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {ReportParameterModel} from './report-parameter.model';
import {RestService} from 'core';
import {ActionSchemaModel} from './action-schema.model';
import {ReportTaskModel} from './report-task.model';
import {NodeService} from 'core';
import {SessionService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';

@JsonObject
export class ReportModel extends BaseModel {

  public static NODE_SCHEDULE_JOB_API = 'ngp/report?action=schedule';

  @JsonProperty('parentId', String, true)
  public parentId: string = undefined;

  @JsonProperty('custom', Boolean, true)
  public custom: boolean = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('category', String, true)
  public category: string = undefined;

  @JsonProperty('creationTime', Number, true)
  public creationTime: any = undefined;

  @JsonProperty('paramValues', undefined, true)
  public paramValues: any = undefined;

  @JsonProperty('trigger', undefined, true)
  public trigger: any = {};

  @JsonProperty('hasChildren', Boolean, true)
  public hasChildren: boolean = false;

  @JsonProperty('parentDisplayName', String, true)
  public parentDisplayName: string = undefined;

  @JsonProperty('parentName', String, true)
  public parentName: string = undefined;

  public customReports: Array<ReportModel> = undefined;

  public parameters: Array<ReportParameterModel> = [];

  public setTrigger: any = {};

  public notification: Array<string> = [];

  public getRunActionSchema(proxy?: RestService): Observable<ActionSchemaModel> {
    let me = this, observable: Observable<Object>, result: Observable<ActionSchemaModel>, link = me.getLink('run');
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.getByUrl(link.schema);
      result = observable.map((response: Object) => {
        const data = response;
        let record: ActionSchemaModel;
        try {
          record = <ActionSchemaModel> JsonConvert.deserializeObject(data, ActionSchemaModel);
          record.proxy = proxy;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  public run(payload: Object, proxy?: RestService): Observable<ReportTaskModel> {
    let me = this, observable: Observable<Object>, result: Observable<ReportTaskModel>, link = me.getLink('run');
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.postByUrl(link.href, payload);
      result = observable.map((response: Object) => {
        const data = response;
        let record: ReportTaskModel;
        try {
          record = <ReportTaskModel> JsonConvert.deserializeObject(data, ReportTaskModel);
          record.proxy = proxy;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  public scheduleReport(proxy: NodeService): Observable<any> {
    let me = this, observable: Observable<Object>, result: Observable<any>;
    if (proxy) {
      observable = proxy.post(ReportModel.NODE_SCHEDULE_JOB_API, me.getSchedulePayload());
      result = observable.catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  public getCustomReports(proxy: NodeService): Observable<any> {
    let me = this, observable: Observable<Object>, result: Observable<any>, link,
      sorters = [
        new SorterModel('category', 'ASC'),
        new SorterModel('name', 'ASC')
      ];
    link = me.getUrl('customReports');
    if (proxy && link) {
      observable = proxy.getByUrl(link, undefined, sorters);
      result = observable.catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    return this.getCustomPayload();
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    return this.getCustomPayload();
  }

  private getCustomPayload(): Object {
    let me = this, paramValues: { [key: string]: any } = {}, params = me.parameters || [];
    params.forEach(function (param) {
      paramValues[param.name] = param.value;
    });
    return {
      name: me.name,
      description: me.description,
      paramValues: paramValues,
      parentId: me.parentId
    };
  }

  private getSchedulePayload(): Object {
    let me = this, user, userGroups,
        userId = SessionService.getInstance().getUserId();
    return {
      userId:  userId,
      resources: [{name: this.displayName, id: this.id, rbacPath: this.rbacPath, href: this.url}],
      trigger: this.setTrigger,
      notification: this.notification
    };
  }
}
