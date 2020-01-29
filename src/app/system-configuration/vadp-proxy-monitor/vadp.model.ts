import { JsonObject, JsonProperty, JsonConvert } from 'json2typescript';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {HttpErrorResponse} from '@angular/common/http';
import {VadpSchemaModel} from './vadp-schema.model';
import {SharedService} from 'shared/shared.service';
import { TaskInfoModel } from './task-info.model';
import { BaseModel } from 'shared';

JsonConvert.ignorePrimitiveChecks = true;
@JsonObject
export class VadpModel extends BaseModel {

  @JsonProperty('app', String, true)
  public app: string = '';

  @JsonProperty('displayName', String, true)
  public displayName: string = '';

  @JsonProperty('healthCheckUrl', String, true)
  public healthCheckUrl: string = '';

  @JsonProperty('homePageUrl', String, true)
  public homePageUrl: string = '';

  @JsonProperty('hostName', String, true)
  public hostName: string = '';

  @JsonProperty('ipAddr', String, true)
  public ipAddr: string = '';

  @JsonProperty('identityId', String, true)
  public identityId: string = '';

  @JsonProperty('version', String, true)
  public version: string = '';

  @JsonProperty('port', Number, true)
  public port: number;

  @JsonProperty('rbacPath', String, true)
  public rbacPath: string = undefined;

  @JsonProperty('siteId', String, true)
  public siteId: string = '';

  @JsonProperty('siteName', String, true)
  public siteName: string = '';

  @JsonProperty('state', String, true)
  public state: string = '';

  @JsonProperty('stateDisplayName', String, true)
  public stateDisplayName: string = undefined;

  @JsonProperty('proxyOptions', Object, true)
  public proxyOptions: any = undefined;

  @JsonProperty('isLocal', Boolean, true)
  public isLocal: boolean = false;

  @JsonProperty('tasksInfo', TaskInfoModel, true)
  public tasksInfo: TaskInfoModel = undefined;

  @JsonProperty('corecount', Number, true)
  public corecount: number = undefined;

  @JsonProperty('availablememory', Number, true)
  public availablememory: number = undefined;

  @JsonProperty('demo', Boolean, true)
  public demo: boolean = false;

  public selectedSite: string;
  public metadata: object = {};

  public isVadpAvailable(): boolean {
    return this.hasLink('register');
  }

  public getRegisterVadpPayload(): object {
    return {
      ipAddr: this.ipAddr,
      siteId: this.selectedSite
    };
  }

  public getActionSchema(schemaName: string, proxy: RestService): Observable<VadpSchemaModel> {
    let me = this, observable: Observable<Object>, result: Observable<VadpSchemaModel>,
      link = me.getLink(schemaName);
    if (link && proxy) {
      observable = proxy.getByUrl(link.href);
      result = observable.map((response: any) => {
        const data = (response || {}).proxyOptions;
        let record: VadpSchemaModel;
        try {
          record = <VadpSchemaModel> JsonConvert.deserializeObject(data, VadpSchemaModel);
          record.proxy = proxy;
        } catch (e) {
        }
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Sends a POST request for the specified action to server side by the given generic type, model class, action name,
   * payload and proxy.
   *
   * @param {{new() => T}} classObject The model class.
   * @param {string} name The action name
   * @param {Object} payload Optional payload.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<T extends HasProxy>}
   */
  postAction<T>(classObject: { new(): T },
                               name: string, payload: Object,
                               proxy: RestService): Observable<T> {
    let me = this, observable: Observable<Object>, result: Observable<T>,
      link = me.getLink(name);
    if (link && proxy) {
      observable = proxy.postByUrl(link.href, payload);
      result = observable.map((body: Object) => {
        const data = body;
        let updated: T;
        try {
          updated = <T>JsonConvert.deserializeObject(data, classObject);
        } catch (e) {
        }
        return updated;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Sends a PUT request for the specified action to server side by the given generic type, model class, action name,
   * payload and proxy.
   *
   * @param {{new() => T}} classObject The model class.
   * @param {string} name The action name
   * @param {Object} payload The payload.
   * @param {RestService} proxy The data proxy service.
   * @returns {Observable<T>}
   */
  public putAction<T>(classObject: { new(): T },
                               name: string, payload: Object,
                               proxy: RestService): Observable<T> {
    let me = this, observable: Observable<Object>, result: Observable<T>,
      link = me.getLink(name);
    if (link && proxy) {
      observable = proxy.putByUrl(link.href, payload);
      result = observable.map((body: Object) => {
        const data = body;
        let updated: T;
        try {
          updated = <T>JsonConvert.deserializeObject(data, classObject);
        } catch (e) {
        }
        return updated;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Sends a POST request for the pushUpdate action to server side by the given payload and proxy.
   *
   * @param {Object} payload The payload.
   * @param {RestService} proxy The data proxy service.
   * @returns {Observable<boolean>}
   */
  pushUpdate(payload: Object, proxy: RestService): Observable<boolean> {
    let me = this, observable: Observable<boolean>, result: Observable<boolean>,
      link = me.getLink('pushUpdate');
    if (payload && proxy && link) {
      observable = proxy.postByUrl(link.href, payload);
      result = observable.map((body: Object) => {
        return true;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }
}
