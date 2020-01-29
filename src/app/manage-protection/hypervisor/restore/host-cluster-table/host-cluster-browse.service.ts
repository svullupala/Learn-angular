import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {isNumber} from 'util';

import {BaseHypervisorModel} from '../../shared/base-hypervisor.model';
import {SorterModel} from 'shared/models/sorter.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {HostsModel} from '../../shared/hosts.model';
import {HostModel} from '../../shared/host.model';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {ClustersModel} from '../../shared/clusters.model';
import {ClusterModel} from '../../shared/cluster.model';

@Injectable()
export class HostClusterBrowseService {
  public demo: boolean = false;
  public records: Array<BaseHypervisorModel> = [];

  public breadcrumbs: BreadcrumbModel[] = [];

  constructor(private core: RestService) {
  }

  /**
   * GetView method.
   * @param item {Object} An object containing vCenter or Content info.
   * @param name {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {{url: string, observable: Observable<DatasetModel<BaseHypervisorModel>>}}
   */
  getView(item: BaseHypervisorModel, name: string,
          filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
          pageStartIndex?: number): {
    url: string,
    observable: Observable<DatasetModel<BaseHypervisorModel>>
  } {
    let url = item.getUrl(name);
    return url ? {url: url, observable: this.getContent(url, filters, sorters, pageStartIndex)} : null;
  }


  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  }

  /**
   * Resets breadcrumbs.
   *
   * @param root {BreadcrumbModel} optional root breadcrumb.
   */
  resetBreadcrumbs(root?: BreadcrumbModel) {
    let me = this;
    if (me.breadcrumbs.length > 0)
      me.breadcrumbs.splice(0);
    if (root)
      me.breadcrumbs.push(root);
  }

  /**
   * Gets current breadcrumb.
   *
   * @returns {BreadcrumbModel | null}
   */
  currentBreadcrumb(): BreadcrumbModel | null {
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
  firstBreadcrumb(): BreadcrumbModel | null {
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
   * @param pageStartIndex {number} Optional page start index.
   * @returns {Observable<DatasetModel<BaseHypervisorModel>>}
   */
  getContent(url: string,
             filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
             pageStartIndex?: number): Observable<DatasetModel<BaseHypervisorModel>> {

    return this.getPageByUrl(url, filters, sorters, pageStartIndex).map((response: Object) => {
      const data = response;
      let dataset, records;
      if (data['hosts'] !== undefined) {
        // Cast the JSON object to HypervisorsModel instance.
        dataset = JsonConvert.deserializeObject(data, HostsModel);
        records = <Array<HostsModel>> dataset.records;
      } else if (data['clusters'] !== undefined) {
        // Cast the JSON object to clusters Model instance.
        dataset = JsonConvert.deserializeObject(data, ClustersModel);
        records = <Array<ClusterModel>> dataset.records;
      }
      this.records = records;
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Navigate method.
   * @param item {Object} An object containing vCenter or Content or VM info.
   * @param viewName {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {boolean | Observable<DatasetModel<BaseHypervisorModel>>}
   */
  navigate(item: BaseHypervisorModel, viewName: string,
           filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
           pageStartIndex?: number): boolean
    | Observable<DatasetModel<BaseHypervisorModel>> {

    let me = this, view = me.getView(item, viewName, filters, sorters, pageStartIndex);
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

  search(namePattern: string,
         hypervisorType?: string,
         from?: string,
         pageStartIndex?: number,
         filters?: Array<FilterModel>,
         pageSize: number = RestService.pageSize,
         resourceType: string = 'vm'): Observable<DatasetModel<BaseHypervisorModel>> {
    let me = this, api = `api/hypervisor/search?resourceType=${resourceType}`;
    if (from && from.trim().length > 0)
      api += `&from=${from}`;
    if (filters && filters.length > 0) {
      api += `&filter=${encodeURIComponent(JSON.stringify(FilterModel.array2json(filters)))}`;
    }
    if (isNumber(pageStartIndex))
      api += `&pageSize=${pageSize}&pageStartIndex=${pageStartIndex}`;

    return me.core.post(api, {
      name: namePattern,
      hypervisorType: hypervisorType
    }).map((response: Object) => {
      const data = response;
      let dataset, records;
      if (data['hosts'] !== undefined) {
        // Cast the JSON object to VmsModel instance.
        dataset = JsonConvert.deserializeObject(data, HostsModel);
        records = <Array<HostModel>> dataset.records;
      } else if (data['clusters'] !== undefined) {
        // Cast the JSON object to VmsModel instance.
        dataset = JsonConvert.deserializeObject(data, ClustersModel);
        records = <Array<ClusterModel>> dataset.records;
      } 
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * GetByUrl method.
   * @param url {String} The URL.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  private getPageByUrl(url: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
                       pageStartIndex?: number): Observable<Object> {
    return this.core.getPageByUrl(url, FilterModel.array2json(filters), SorterModel.array2json(sorters),
      pageStartIndex);
  }
}
