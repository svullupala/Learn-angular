import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {JobSessionModel} from 'job/shared/job-session.model';
import {StatisticsModel} from './statistics.model';
import {RestService} from 'core';
import {JobSchemaModel} from 'job/shared/job-schema.model';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';

@JsonObject
export class SlapolicyModel extends BaseModel {

  public sessions: Array<JobSessionModel> = undefined;

  @JsonProperty('spec', Object, true)
  public spec: Object = undefined;

  @JsonProperty('script', PostScriptsModel, true)
  public script: PostScriptsModel = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('type', String, true)
  public slaType: string = undefined;

  @JsonProperty('statistics', [StatisticsModel], true)
  public statistics: Array<StatisticsModel> = [];

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('statusDisplayName', String, true)
  public statusDisplayName: string = undefined;

  @JsonProperty('nextFireTime', Number, true)
  public nextFireTime: number = 0;

  public hasSessions(): boolean {
    return !!(this.sessions && this.sessions.length > 0);
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    return {
      name: this.name,
      description: this.description,
      type: this.slaType,
      version: this.version,
      spec: this.spec,
      script: this.script
    };
  }

  getStatValue(type: string, key: string): number {
    let me = this,
      target = me.statistics && me.statistics.find(function(item) {
        return item.resourceType === type;
      });
    return target ? target[key] : 0;
  }

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
}
