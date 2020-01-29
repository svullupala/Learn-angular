import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { JsonConvert } from 'json2typescript';
import { CloudsModel } from './clouds.model';
import { CloudModel } from './cloud.model';
import { CloudSchemaModel } from './cloud-schema.model';
import { FilterModel } from 'shared/models/filter.model';
import { SorterModel } from 'shared/models/sorter.model';
import { NodeService, RestService } from 'core';
import { BucketsModel } from './buckets.model';
import { BucketModel } from './bucket.model';
import { SharedService } from 'shared/shared.service';
import {HypervisorManageService} from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';

@Injectable()
export class CloudService {

  public cloudApi: string = 'api/cloud';
  public cloudSchemaApi: string = 'api/cloud/schema?type=s3';
  public cloudNodeApi: string = 'ngp/cloud';
  public cloudCoreApi: string = 'api/cloud';
  public cloudSpSchemaApi: string = 'api/cloud/schema?type=s3&provider=sp';
  public cloudGetBucketsApi: string = 'api/cloud?action=getBuckets';

  constructor(private rest: RestService, private node: NodeService) {
  }

  get proxy(): RestService {
    return this.rest;
  }

  public getCloudServers(filters?: Array<FilterModel>): Observable<any> {
    let sorters: SorterModel = new SorterModel('name', 'ASC');
    return this.rest.getAll(this.cloudApi,
      filters, [sorters], RestService.pageSize, 0).map(
      (response: Object) => {
        return JsonConvert.deserializeObject(response, CloudsModel);
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  public unregisterCloud(cloud: CloudModel): Observable<any> {
    if (cloud.hasLink('delete'))
      return this.rest.deleteByUrl(cloud.getUrl('delete'));
  }

  public getCloudSchemaTypes(): Observable<CloudSchemaModel> {
    return this.rest.getAll(this.cloudSchemaApi).map(
      (response: Object) => {
        return JsonConvert.deserializeObject(response, CloudSchemaModel);
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  public getCloudSchema(cloudSchemaModel: CloudSchemaModel, type: string): Observable<CloudSchemaModel> {
    if (cloudSchemaModel.hasLink(type)) {
      return this.rest.getByUrl(cloudSchemaModel.getUrl(type)).map(
        (response: Object) => {
          return JsonConvert.deserializeObject(response, CloudSchemaModel);
        }
      ).catch((error: Response) => Observable.throw(error));
    }
  }

  public getSpCloudSchema(): Observable<CloudSchemaModel> {
    return this.rest.getPage(this.cloudSpSchemaApi).map(
        (response: Object) => {
          return JsonConvert.deserializeObject(response, CloudSchemaModel);
        }).catch((error: Response) => Observable.throw(error));
  }

  public registerCloudProvider(model: CloudSchemaModel): Observable<any> {
    let res: any,
        api: string = SharedService.formatString(this.cloudNodeApi);
    return this.node.post(api, model.getSchemaJson()).map(
      (response: Object) => {
        res = response['response'] || response;
        return JsonConvert.deserializeObject(res, CloudModel);
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  public registerEC2Provider(postBody: object): Observable<any> {
    let res: any,
        api: string = SharedService.formatString(this.cloudNodeApi);
    return this.node.post(api, postBody).map(
      (response: Object) => {
        res = response['response'] || response;
        return JsonConvert.deserializeObject(res, CloudModel);
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  public updateCloudProvider(cloud: CloudModel, putBody: object): Observable<any> {
    if (cloud) {
      return this.node.put(this.cloudNodeApi, cloud.id, putBody).
      catch((error: Response) => Observable.throw(error));
    }
  }

  public getBuckets(model: CloudSchemaModel): Observable<any> {
    if (model) {
      return this.rest.post(this.cloudGetBucketsApi, model.getBucketJson()).map(
        (response: Object) => {
          return JsonConvert.deserializeObject(response, BucketsModel);
        }
      ).catch((error: Response) => Observable.throw(error));
    }
  }

  getAll(filters?: Array<FilterModel>, sorters?: Array<SorterModel>, from?: string,
         pageStartIndex?: number, pageSize?: number): Observable<Object> {
    let api = SharedService.formatString(this.cloudCoreApi);
    if (from && from.trim().length > 0)
      api += `?from=${from}`;
    return this.rest.getPage(api, FilterModel.array2json(filters), SorterModel.array2json(sorters), pageStartIndex,
      pageSize);
  }
}
