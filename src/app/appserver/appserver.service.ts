import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { JsonConvert } from 'json2typescript';
import { RestService } from 'core';
import { AppServerModel } from './appserver.model';
import { SorterModel } from 'shared/models/sorter.model';
import { NodeService } from 'core';
import { AppServersModel } from './appservers.model';
import { AppServerConfig } from './appserver-config.item';
import {FilterModel} from 'shared/models/filter.model';
import { PostScriptsModel } from 'shared/components/post-scripts/post-scripts.model';
import { DummyService } from '../dummy/dummy.service';
import { DiscoveryInstancesModel } from 'appserver/discovery-instances.model';
import {ExchOnlineInstancesModel} from 'appserver/exchonline-instances.model';

@Injectable()
export class AppServerService {
  private config: AppServerConfig;

  get proxy(): RestService {
    return this.rest;
  }

  constructor(@Optional() config: AppServerConfig, private rest: RestService,
              private node: NodeService, private dummy: DummyService) {
    this.config = (config) ? config : undefined;
  }

  public getCoreUrl(): string {
    if (this.config !== undefined && this.config.coreEndpoint !== undefined) {
      return this.config.coreEndpoint;
    } else {
      return AppServerModel.CORE_APP_SERVER_API_ENDPOINT;
    }
  }

  public getNodeUrl(): string {
    if (this.config !== undefined && this.config.nodeEndpoint !== undefined) {
      return this.config.nodeEndpoint;
    } else {
      return AppServerModel.NODE_APP_SERVER_API_ENDPOINT;
    }
  }

  public getAppservers(filters?: Array<FilterModel>, pageSizeIndex?: number): Observable<any> {
    let sorters: SorterModel = new SorterModel('name', 'ASC');
    return this.node.getAll(this.getNodeUrl(),
      filters, [sorters], RestService.pageSize, pageSizeIndex || 0).map(
      (response: Object) => {
          let data = response,
              dataset = JsonConvert.deserializeObject(data, AppServersModel);
          return dataset;
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  public getScriptservers(filters?: Array<FilterModel>, pageSizeIndex?: number): Observable<any> {
    let sorters: SorterModel = new SorterModel('name', 'ASC');
    return this.rest.getAll(PostScriptsModel.SCRIPT_SERVER_URL,
      filters, [sorters], RestService.pageSize, pageSizeIndex || 0).map(
      (response: Object) => {
        let data = response,
          dataset = JsonConvert.deserializeObject(data, AppServersModel);
        return dataset;
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  public unregisterAppserver(appServer: AppServerModel, type: string): Observable<any> {
    let deleteType: string = type === 'script' ? '?script=true' : '?application=true';
    let deleteUrl = appServer.getLink('delete').href + deleteType;

    if(deleteUrl.includes('https'))
    var finalUrl = deleteUrl.replace('/api', '/ngp');
    else
    var finalUrl = deleteUrl.replace(':8082/api', ':8083/ngp')

    return this.node.deleteByUrl(finalUrl);
  }

  public registerAppserver(postPayload: Object): Observable<any> {
    if (postPayload) {
      return this.node.post(this.getNodeUrl(), postPayload).map(
        (response: Object) => {
          return response;
        }
      ).catch((error: Response) => Observable.throw(error));
    }
  }

  public updateAppserver(id: string, putPayload: Object): Observable<any> {
    if (id && putPayload) {
      return this.node.put(this.getNodeUrl(), id, putPayload).map(
        (response: Object) => {
            return response;
        }
      ).catch((error: Response) => Observable.throw(error));
    }
  }

  public getInstances(payload: Object): Observable<any> {
    if (payload) {
      return this.rest.post(AppServerModel.CORE_APP_SERVER_API_DISCOVERY_ENDPOINT, payload).map(
        (response: Object) => {
          return JsonConvert.deserializeObject(response, DiscoveryInstancesModel);
        }
      ).catch((error: Response) => Observable.throw(error));
    }
  }

  public getRegisteredInstances(payload: Object): Observable<any> {
    let provider: string;
    if (payload) {
      provider = payload['provider'];
      return this.node.post(AppServerModel.NODE_APP_SERVER_API_FIND_DISCOVERY_ENDPOINT, payload).map(
        (response: Object) => {
          if (provider === 'office365')
            return JsonConvert.deserializeObject(response, ExchOnlineInstancesModel);
          else
            return JsonConvert.deserializeObject(response, DiscoveryInstancesModel);
        }
      ).catch((error: Response) => Observable.throw(error));
    }
  }
}
