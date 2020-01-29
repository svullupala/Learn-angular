import {BaseModel} from 'shared/models/base.model';
import {Observable} from 'rxjs';
import {RestService} from 'core';
import {JsonObject, JsonProperty} from 'json2typescript';
import {JobLogsModel} from './job-logs.model';
import {JobSchemaModel} from './job-schema.model';
import {HttpErrorResponse} from '@angular/common/http';
import {SharedService} from 'shared/shared.service';
import { JsonConvert } from 'json2typescript';
import * as _ from 'lodash';
import { isString } from 'util';

@JsonObject
export class JobSessionModel extends BaseModel {

  // static definition of the expire link
  public static EXPIRE: string = 'expire';
  public static EXPIREALL: string = 'expireall';

  @JsonProperty('actions', undefined, true)
  public actions: any = undefined;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('typeDisplayName', String, true)
  public typeDisplayName: string = undefined;

  @JsonProperty('subType', String, true)
  public subType: string = undefined;

  @JsonProperty('subTypeDisplayName', String, true)
  public subTypeDisplayName: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('jobName', String, true)
  public jobName: string = undefined;

  @JsonProperty('jobId', String, true)
  public jobId: string = undefined;

  @JsonProperty('serviceId', String, true)
  public serviceId: string = undefined;

  @JsonProperty('percent', Number, true)
  public percent: number = 0;

  @JsonProperty('start', undefined, true)
  public start: any = undefined;

  @JsonProperty('end', undefined, true)
  public end: any = undefined;

  @JsonProperty('expirationTime', undefined, true)
  public expirationTime: any = undefined;

  @JsonProperty('duration', undefined, true)
  public duration: any = undefined;

  @JsonProperty('properties', undefined , true)
  public properties: any = undefined;

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('statusDisplayName', String, true)
  public statusDisplay: string = undefined;

  @JsonProperty('subPolicyType', String, true)
  public subPolicyType: string = undefined;

  @JsonProperty('lastUpdate', Number, true)
  public lastUpdate: number = 0;

  public logDs: JobLogsModel;

  public getVmList(): string {
    let me = this,
        vmList: string = '',
        statistics = [];

    if (me.properties && me.properties.statistics) {
      statistics = me.properties.statistics;
      if (statistics.length > 0) {
        for (let i = 0; i < statistics.length; i++) {
          vmList = statistics[i].names && statistics[i].names.join(', ');
        }
      }
    }
    return vmList;
  }

  getStatValue(type: string, key: string): number {
    let me = this,
        target;

    // if type is not defined (from job-table), examine serviceId to determine if we need to look at "vm" or "database".
    if (type === undefined || type === '') {
      type = me.serviceId.indexOf('application') === -1 ? 'vm' : 'database';
    }

    if (me.properties && me.properties.statistics) {
      target = me.properties.statistics && me.properties.statistics.find(function (item) {
        return item.resourceType === type;
      });
    }
    return target ? target[key] : 0;
  }

  public hasLogs(): boolean {
    return !!(this.logDs && this.logDs.total > 0);
  }

  public hasActionLinksExceptExpire(): boolean {
    return this.getActionLinksExceptExpire().length > 0;
  }

  public getActionLinksExceptExpire(): object[] {
    let links = [], actionLinks = this.getActionLinks();
    if (actionLinks) {
      for (let eachLink of actionLinks) {
        if (eachLink.name !== JobSessionModel.EXPIRE
          && eachLink.name !== JobSessionModel.EXPIREALL) {
          links.push(eachLink);
        }
      }
    }
    return links;
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


  public hasPostRestoreInfo(): boolean {
   if (!_.isEmpty(this.properties)) {
     return this.properties.postRestoreInfo && !_.isEmpty(this.properties.postRestoreInfo);
   }
    return false;
  }

  public hasPostRestoreMessage(): boolean {
    return this.hasPostRestoreInfo() && this.properties.postRestoreInfo.message;
  }

  public hasPostRestoreCommand(): boolean {
    return this.hasPostRestoreInfo() && this.properties.postRestoreInfo.command;
  }

  public get mountPoints(): string {
    let retVal: Array<string> = new Array(), current: any, appServerMountPoints; 
    if (this.hasPostRestoreInfo()) {
      appServerMountPoints = this.properties.postRestoreInfo.appServerMountPoints;
      if (appServerMountPoints && Array.isArray(appServerMountPoints)) {
        for (let item of appServerMountPoints) {
          current = this.getAppServerMountPointString(item.appServerName, item.mountPoints);
          if (current) {
            retVal.push(current);
          }
        } 
      }
    }
  
    return (retVal.length === 0) ? this.postRestoreInfoMountPoints : retVal.join('; ');
  }

  private getAppServerMountPointString(appServerName: string, mountPoints: any): string {
    if (mountPoints && appServerName && Array.isArray(mountPoints)) {
      return SharedService.formatString('[{0}]{1}', appServerName, mountPoints.join(', '));
    }
  
    return undefined;
  }

  public get postRestoreInfoApplicationServers(): string {
    if (this.hasPostRestoreInfo()) {
      return Array.isArray(this.properties.postRestoreInfo.appServerNames)
        ? this.properties.postRestoreInfo.appServerNames.join(', ')
        : '';
    }
    return '';
  }

  public get postRestoreInfoMountPoints(): string {
    if (this.hasPostRestoreInfo()) {
      return Array.isArray(this.properties.postRestoreInfo.mountPoints)
        ? this.properties.postRestoreInfo.mountPoints.join(', ')
        : '';
    }
    return '';
  }

  public get postRestoreInfoMessage(): string {
    if (this.hasPostRestoreInfo()) {
      return isString(this.properties.postRestoreInfo.message) ? this.properties.postRestoreInfo.message : '';
    }
    return '';
  }

  public get postRestoreInfoCommand(): string {
    if (this.hasPostRestoreInfo()) {
      return isString(this.properties.postRestoreInfo.command) ? this.properties.postRestoreInfo.command : '';
    }
    return '';
  }

  public get hasStatistics(): boolean {
    return typeof this.properties === 'object' && this.properties !== null
      && Array.isArray(this.properties.statistics) && this.properties.statistics.length > 0;
  }

  public get stats(): object {
    return this.hasStatistics ? this.properties.statistics[0] : {};
  }

  public get failedResources(): number {
    return typeof this.stats['failed'] === 'number' ? this.stats['failed'] : 0;
  }

  public get successfulResources(): number {
    return typeof this.stats['success'] === 'number' ? this.stats['success'] : 0;
  }

  public get totalResources(): number {
    return typeof this.stats['total'] === 'number' ? this.stats['total'] : 0;
  }
}
