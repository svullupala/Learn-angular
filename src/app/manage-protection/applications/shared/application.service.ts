import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { JsonConvert } from 'json2typescript';

import { RestService } from 'core';
import { NodeService } from 'core';
import { SorterModel } from 'shared/models/sorter.model';
import { SharedService } from 'shared/shared.service';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { InstanceModel } from './instance.model';
import { FilterModel } from 'shared/models/filter.model';
import { DatabaseModel } from './database.model';
import { DatabaseGroupModel } from './databasegroup.model';
import { DatabasesModel } from './databases.model';
import { InstancesModel } from './instances.model';
import { DatabaseGroupsModel } from './databasegroups.model';
import { BaseApplicationModel } from './base-application-model.model';
import { VersionsModel } from './versions.model';
import { VersionModel } from './version.model';
import { isNumber } from "util";
import {ApplicationContentsModel} from 'applications/shared/application-contents.model';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class ApplicationService {

  public breadcrumbs: BreadcrumbModel[] = [];
  public records: Array<BaseApplicationModel> = [];
  public isDbLevel: boolean = false;
  public isDbSearch: boolean = false;
  private relativeUrl: string;
  private instanceSearchApi = 'api/application/search?resourceType=instance&applicationType={0}&from={1}';
  private dbSearchApi = 'api/application/search?applicationType={0}&from={1}';
  private recPointListURL: string = this.rest.getBaseUrl() + 'api/application/{0}/copy?from=recovery&resourceType={1}';
  private textTenants: string;
  private textClusters: string;

  get proxy(): RestService {
    return this.rest;
  }

  constructor(private rest: RestService, private node: NodeService,
              private translateService: TranslateService) {


    this.translateService.get([
      'application.textTenants',
      'application.textClusters',
    ]).subscribe((resource: Object) => {
      this.textTenants = resource['application.textTenants'];
      this.textClusters = resource['application.textClusters'];
    });
  }

  public getApplications(applicationType: string, getDbGroup: boolean,
                         filters: Array<FilterModel>, mode: string = 'hlo',
                         pageStartIndex?: number, pageSize?: number,
                         sorters?: Array<SorterModel>): Observable<any> {
    let sorterArr: SorterModel[] = sorters || [new SorterModel('name', 'ASC')];
    this.relativeUrl = this.getInstanceEndpoint(applicationType, getDbGroup, mode);
    return this.rest.getAll(this.relativeUrl, FilterModel.array2json(filters), sorterArr, pageSize, pageStartIndex).map(
      (response: Object) => {
        let data = response, dataset;
        this.isDbLevel = false;
        this.isDbSearch = false;
        if (data['instances']) {
          dataset = JsonConvert.deserializeObject(data, InstancesModel);
        } else if (data['databasegroups']) {
          dataset = JsonConvert.deserializeObject(data, DatabaseGroupsModel);
        } else if (data['contents']) {
          dataset = JsonConvert.deserializeObject(data, ApplicationContentsModel);
        }
        return dataset;
      }
    ).catch((error: any) => { console.error(error.message); return Observable.throw(error); });
  }

  public dbSearch(applicationType: string, mode: string, payload: object, filters: Array<FilterModel>,
                  pageStartIndex: number = 0, pageSize: number = RestService.pageSize,
                  resourceTypes?: [string],
                  providerNodeId?: string, sorters?: Array<SorterModel>): Observable<DatabasesModel> {
    let filtersJsonString: string = filters && filters.length > 0
                                    ? `&filter=${JSON.stringify(FilterModel.array2json(filters))}` : '',
        api: string = `${SharedService.formatString(this.dbSearchApi,
                        applicationType, mode)}${encodeURI(filtersJsonString)}`;
    if (isNumber(pageStartIndex))
      api += `&pageSize=${pageSize}&pageStartIndex=${pageStartIndex}`;

    if (sorters && sorters.length > 0) {
      api += `&sort=${encodeURIComponent(JSON.stringify(SorterModel.array2json(sorters)))}`;
    }

    if (resourceTypes && resourceTypes.length > 0){
      payload['resourceTypes'] = resourceTypes;
    } else {
      payload['resourceTypes'] = ['database'];
    }
    if (providerNodeId)
      payload['providerNodeId'] = providerNodeId;

    return this.rest.post(api, payload).map(
      (response: Object) => {
        let data = response, dataset;
        this.isDbSearch = true;
        this.resetBreadcrumbs(this.firstBreadcrumb(), applicationType);
        if (data['databases'] !== undefined) {
          // Cast the JSON object to Database model.
          dataset = JsonConvert.deserializeObject(data, DatabasesModel);
          this.isDbLevel = true;
        } else if (data['contents'] !== undefined) {
          this.isDbLevel = true;
          dataset = JsonConvert.deserializeObject(data, ApplicationContentsModel);
        }
        return dataset;
      }
    ).catch((error: any) => { console.error(error.message); return Observable.throw(error); });
  }

  public instanceSearch(applicationType: string, mode: string, payload: object, filters: Array<FilterModel>,
                  pageStartIndex: number = 0,
                  pageSize: number = RestService.pageSize): Observable<DatabasesModel> {
    let filtersJsonString: string = filters && filters.length > 0
                                    ? `&filter=${JSON.stringify(FilterModel.array2json(filters))}` : '',
        api: string = `${SharedService.formatString(this.instanceSearchApi,
                        applicationType, mode)}${encodeURI(filtersJsonString)}`;
    if (isNumber(pageStartIndex))
      api += `&pageSize=${pageSize}&pageStartIndex=${pageStartIndex}`;
    return this.rest.post(api, payload).map(
      (response: Object) => {
        let data = response, dataset;
        this.isDbSearch = true;
        this.resetBreadcrumbs(this.firstBreadcrumb(), applicationType);
        if (data['databases'] !== undefined) {
          // Cast the JSON object to Database model.
          dataset = JsonConvert.deserializeObject(data, DatabasesModel);
          this.isDbLevel = true;
        } else if (data['contents'] !== undefined) {
          this.isDbLevel = true;

          dataset = JsonConvert.deserializeObject(data, ApplicationContentsModel);
        }
        return dataset;
      }
    ).catch((error: any) => { return Observable.throw(error); });
  }

  /**
   * GetView method.
   * @param item {Object} The application instance object or database group.
   * @param name {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {{url: string, observable: Observable<Array<DatabaseModel>>}}
   */
  public getView(item: InstanceModel | DatabaseGroupModel, name: string,
          filters?: Array<FilterModel>, sorters?: Array<SorterModel>): {
    url: string,
    observable: Observable<Array<DatabaseModel>>
  } {
    let url = item.getUrl(name);
    return url ? {url: url, observable: this.getContent(url, filters, sorters)} : null;
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  public getEcxServiceEndpoint(): string {
    return this.rest.getBaseUrl();
  }

  /**
   * Gets the endpoint of ECX API.
   * @returns {string}
   */
  getEcxApiEndpoint(applicationType?: string, getDbGroup?: boolean, mode?: string): string {
    let url: string;
    if (this.relativeUrl !== undefined) {
      return this.getEcxServiceEndpoint() + this.relativeUrl;
    }
    if (typeof applicationType === 'string' && typeof getDbGroup === 'boolean') {
      url = this.getInstanceEndpoint(applicationType, getDbGroup, mode);
      return this.getEcxServiceEndpoint() + url;
    }
    return url;
  }

  getInstanceEndpoint(applicationType: string, getDbGroup: boolean = false, mode: string): string {
    let url: string = !getDbGroup
      ? SharedService.formatString(InstancesModel.INSTANCE_API_ENDPOINT, applicationType, mode)
      : SharedService.formatString(DatabaseGroupsModel.DATABASEGROUP_API_ENDPOINT, applicationType, mode);
    return url;
  }

  /**
   * Resets breadcrumbs.
   *
   * @param root {BreadcrumbModel} optional root breadcrumb.
   * @param changeInstancesText
   */
  public resetBreadcrumbs(root?: BreadcrumbModel, applicationType?: string) {
    let me = this;
    if (me.breadcrumbs.length > 0)
      me.breadcrumbs.splice(0);
    if (root) {
      if (applicationType === 'office365') {
        root.title = me.textTenants;
      } else if (applicationType === 'k8s') {
        root.title = me.textClusters;
      }
      me.breadcrumbs.push(root);
    }
  }

  /**
   * Gets current breadcrumb.
   *
   * @returns {BreadcrumbModel | null}
   */
  public currentBreadcrumb(): BreadcrumbModel | null {
    let me = this;
    if (me.breadcrumbs.length > 0)
      return me.breadcrumbs[me.breadcrumbs.length - 1];
    return null;
  }

  /**
   * Gets the first breadcrumb.
   *
   * @returns {BreadcrumbModel | null}
   */
  public firstBreadcrumb(): BreadcrumbModel | null {
    let me = this;
    if (me.breadcrumbs.length > 0)
      return me.breadcrumbs[0];
    return null;
  }

  /**
   * Gets content.
   *
   * @param url The URL indicates where load content from.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Array<DatabaseModel>>}
   */
  public getContent(url: string,
             filters?: Array<FilterModel>, sorters?: Array<SorterModel>): Observable<any> {

    // SPP-326: Handle an unexpected case - duplicate filter parameter.
    let originFlt = this.extractFilterFromUrl(url),
      duplicateFlt = !!(originFlt && filters && filters.length > 0),
      targetFlt = duplicateFlt ? this.mergeFilter(originFlt, filters) : filters,
      targetUrl = duplicateFlt ? this.deleteParamInUrl(url, 'filter') : url;

    return this.getByUrl(targetUrl, targetFlt, sorters).map((response: Object) => {
      const data = response;
      let dataset, records;
      this.isDbSearch = false;
      if (data['databases'] !== undefined) {
        // Cast the JSON object to Database model.
        dataset = JsonConvert.deserializeObject(data, DatabasesModel);
        this.isDbLevel = true;
      } else if (data['instances'] !== undefined) {
        // Cast the JSON object to Instance model.
        dataset = JsonConvert.deserializeObject(data, InstancesModel);
        this.isDbLevel = false;
      } else if (data['contents'] !== undefined) {
        this.isDbLevel = true;
        dataset = JsonConvert.deserializeObject(data, ApplicationContentsModel);
      }
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Navigate method.
   * @param item {Object} An object containing vCenter or Content or VM info.
   * @param viewName {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @returns {boolean | Observable<Array<InstanceModel | DatabaseGroupModel | DatabaseModel>>}
   */
  public navigate(item: InstanceModel | DatabaseGroupModel, viewName: string,
           filters?: Array<FilterModel>, sorters?: Array<SorterModel>): boolean
    | Observable<Array<InstanceModel | DatabaseGroupModel | DatabaseModel>> {

    let me = this, view = me.getView(item, viewName, filters, sorters);
    if (view) {
      return view.observable.do(() => {
          let index = me.breadcrumbs.findIndex(function (crumb) {
            return crumb.url === view.url;
          });
          if (index === -1) {
            let crumb = new BreadcrumbModel(item.name, view.url, item);
            me.breadcrumbs.push(crumb);
          } else {
            if (index < me.breadcrumbs.length - 1)
              me.breadcrumbs.splice(index + 1);
          }
        }
      );
    }
    return false;
  }

  public getFullPath(item): string {
    let me = this, path = '';
    me.breadcrumbs.forEach(function (crumb) {
      if (crumb.resource)
        path += `/${crumb.resource.id}:${crumb.resource.name}`;
    });
    path += `/${item.id}:${item.name}`;
    return path;
  }

  /**
   * Gets versions.
   *
   * @param resource {DatabaseModel} the database resource model.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Array<SnapshotModel>>}
   */
  public getVersions(resource: DatabaseModel, filters?: Array<FilterModel>,
              sorters?: Array<SorterModel>): Observable<Array<VersionModel>> {
    let me = this, observable: Observable<Object>, result, link = resource.getLink('copies');
    if (link) {
      observable = me.getByUrl(link.href, filters, sorters);
      result = observable.map((response: Object) => {
        const data = response;
        let dataset, records;
        if (data['copies'] !== undefined) {
          dataset = JsonConvert.deserializeObject(data, VersionsModel);
          records = <Array<VersionModel>> dataset.records;
        }
        return records;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  public getVersion(resource: VersionModel): Observable<VersionModel> {
    let me = this, observable: Observable<Object>, result, link = resource.getLink('version');
    if (link) {
      observable = me.getByUrl(link.href);
      result = observable.map((response: Object) => {
        return JsonConvert.deserializeObject(response, VersionModel);
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  getLatestSnapshots(applicationType: String, resourceType: String, payload: object): Observable<Object> {
    let url = SharedService.formatString(this.recPointListURL, applicationType, resourceType);
    return this.rest.postByUrl(url, payload);
  }

  /**
   * GetByUrl method.
   * @param url {String} The URL.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  private getByUrl(url: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>): Observable<Object> {
    return this.rest.getByUrl(url, FilterModel.array2json(filters), SorterModel.array2json(sorters));
  }

  private extractFilterFromUrl(url: string): FilterModel[] {
    let idx = url.indexOf('?'), hasQueryString = idx !== -1,
      queryString = hasQueryString ? url.substring(idx + 1) : '',
      params = new HttpParams({fromString: queryString}),
      hasFilter = params.has('filter'),
      filter,
      result: FilterModel[];
    if (hasFilter) {
      result = [];
      filter = JSON.parse(decodeURIComponent(params.get('filter')));
      if (Array.isArray(filter)) {
        filter.forEach(function (item) {
          if (item.property) {
            result.push(new FilterModel(item.property, item.value, item.op));
          }
        });
      }
    }
    return result;
  }

  private deleteParamInUrl(url: string, param: string): string {
    let idx = url.indexOf('?'), hasQueryString = idx !== -1,
      queryString = hasQueryString ? url.substring(idx + 1) : '',
      params = new HttpParams({fromString: queryString}),
      hasFilter = params.has('filter');
    if (hasFilter)
      params = params.delete(param);
    return hasQueryString ? (url.substring(0, idx + 1) + params.toString()) : url;
  }

  private mergeFilter(flt1: FilterModel[], flt2: FilterModel[]): FilterModel[] {
    let result: FilterModel[] = [];
    (flt1 || []).forEach(function (item1) {
      let target = (flt2 || []).find(function (item2) {
        return item2.property === item1.property;
      });
      result.push(target || item1);
    });

    (flt2 || []).forEach(function (item2) {
      let target = (flt1 || []).find(function (item1) {
        return item1.property === item2.property;
      });
      if (!target)
        result.push(item2);
    });
    return result;
  }
}
