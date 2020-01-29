import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';
import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {JobSessionModel} from './job-session.model';
import {JobSchemaModel} from './job-schema.model';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';

@JsonObject
export class JobModel extends BaseModel {

  @JsonProperty('actions', undefined, true)
  public actions = undefined;

  @JsonProperty('tenantId', Number, true)
  public tenantId: number = 0;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('policyId', String, true)
  public policyId: string = undefined;

  @JsonProperty('policyName', String, true)
  public policyName: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('typeDisplayName', String, true)
  public typeDisplayName: string = undefined;

  @JsonProperty('subType', String, true)
  public subType: string = undefined;

  @JsonProperty('subTypeDisplayName', String, true)
  public subTypeDisplayName: string = undefined;

  @JsonProperty('serviceId', String, true)
  public serviceId: string = undefined;

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('statusDisplayName', String, true)
  public statusDisplayName: string = undefined;

  @JsonProperty('statistics', undefined, true)
  public statistics = undefined;

  @JsonProperty('spec', undefined, true)
  public spec = undefined;

  @JsonProperty('script', PostScriptsModel, true)
  public script = undefined;

  @JsonProperty('lastSessionStatus', String, true)
  public lastSessionStatus: string = undefined;

  @JsonProperty('lastSessionStatusDisplayName', String, true)
  public lastSessionStatusDisplayName: string = undefined;

  @JsonProperty('triggerIds', [String], true)
  public triggerIds: string[] = undefined;

  @JsonProperty('triggerData', [undefined], true)
  public triggerData: {
    triggerId?: string,
    triggerInfo?: {}
  } [] = undefined;

  @JsonProperty('trigger', undefined, true)
  public trigger = undefined;

  @JsonProperty('lastRunTime', Number, true)
  public lastRunTime: number = 0;

  @JsonProperty('nextFireTime', Number, true)
  public nextFireTime: number = 0;

  @JsonProperty('lastSessionDuration', Number, true)
  public lastSessionDuration: number = 0;

  @JsonProperty('lastrun', Object, true)
  public lastrun: {
    sessionId?: string,
    jobName?: string;
    type?: string,
    subType?: string,
    serviceId?: string,
    start?: number,
    end?: number,
    duration?: number,
    status?: string,
    results?: string,
    properties?: {},
    numTasks?: number,
    lastUpdate?: 1496995527206,
    percent?: 25,
    policySnapshot?: {}
  } = undefined;

  public sessions: Array<JobSessionModel> = [];

  public getActionSchema(actionName: string, proxy?: RestService): Observable<JobSchemaModel> {
    let me = this, observable: Observable<Object>, result: Observable<JobSchemaModel>, link = me.getLink(actionName);
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.getByUrl(link.schema);
      result = observable.map((response: Object) => {
        const data = response;
        let record: JobSchemaModel;
        try {
          record = <JobSchemaModel> JsonConvert.deserializeObject(data, JobSchemaModel);
          record.proxy = proxy;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  public hasSessions(): boolean {
    return !!(this.sessions && this.sessions.length > 0);
  }

  public get vmRelevant(): boolean {
    return ['protection', 'recovery', 'restore'].indexOf(this.type) !== -1;
  }
}
