import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {RestService} from 'core';
import {HypervisorModel} from './hypervisor.model';
import {VmModel} from './vm.model';
import {HypervisorsModel} from './hypervisors.model';
import {VmsModel} from './vms.model';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {FilterModel} from 'shared/models/filter.model';
import {BaseModel} from 'shared/models/base.model';
import {VolumeModel} from './volume.model';
import {VolumesModel} from './volumes.model';
import {BaseHypervisorModel} from './base-hypervisor.model';
import {SorterModel} from 'shared/models/sorter.model';
import {HypervisorContentModel} from './hypervisor-content.model';
import {HypervisorContentsModel} from './hypervisor-contents.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {isNumber} from 'util';
import {VdisksModel} from './vdisks.model';
import {TagModel} from './tag.model';
import {TagsModel} from './tags.model';
import {CategoryModel} from './category.model';
import {CategoriesModel} from './categories.model';
import {DatacentersModel} from 'hypervisor/shared/datacenters.model';
import {DatacenterModel} from 'hypervisor/shared/datacenter.model';
import {HostsModel} from 'hypervisor/shared/hosts.model';
import {HostModel} from 'hypervisor/shared/host.model';
import {ClustersModel} from 'hypervisor/shared/clusters.model';
import {ClusterModel} from 'hypervisor/shared/cluster.model';

@Injectable()
export class HypervisorBrowseService {

  public records: Array<BaseHypervisorModel> = [];

  public breadcrumbs: BreadcrumbModel[] = [];

  public inVmLevel: boolean = false;

  get proxy(): RestService {
    return this.core;
  }

  constructor(private core: RestService) {
  }

  /**
   * GetView method.
   * @param item {Object} An object containing vCenter or Content info.
   * @param name {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @param pageSize {number} Optional page size.
   * @returns {{url: string, observable: Observable<DatasetModel<BaseHypervisorModel>>}}
   */
  getView(item: BaseHypervisorModel, name: string,
          filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
          pageStartIndex?: number,
          pageSize?: number): {
    url: string,
    observable: Observable<DatasetModel<BaseHypervisorModel>>
  } {
    let url = item.getUrl(name);
    return url ? {url: url, observable: this.getContent(url, filters, sorters, pageStartIndex, pageSize)} : null;
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
   * @param pageSize {number} Optional page size.
   * @returns {Observable<DatasetModel<BaseHypervisorModel>>}
   */
  getContent(url: string,
             filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
             pageStartIndex?: number,
             pageSize?: number): Observable<DatasetModel<BaseHypervisorModel>> {
    let me = this;
    return me.getPageByUrl(url, filters, sorters, pageStartIndex, pageSize).map((response: Object) => {
      return me.processDataset(response);
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Navigate method.
   * @param item {Object} An object containing vCenter or Content or VM info.
   * @param viewName {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @param pageSize {number} Optional page size.
   * @returns {boolean | Observable<DatasetModel<BaseHypervisorModel>>}
   */
  navigate(item: BaseHypervisorModel, viewName: string,
           filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
           pageStartIndex?: number,
           pageSize?: number): boolean
    | Observable<DatasetModel<BaseHypervisorModel>> {

    let me = this, view = me.getView(item, viewName, filters, sorters, pageStartIndex, pageSize);
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

  /**
   * Search method.
   *
   * @param namePattern {string} The name pattern.
   * @param hypervisorType {string} The hypervisor type.
   * @param from {string} where the data comes from.
   * @param pageStartIndex {number} Optional page start index.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param pageSize {number} Optional page size, defaults to RestService.pageSize.
   * @param resourceType {string} Optional resourceType, can be "vm", "folder" or "volume", defaults to "vm"
   * @param hypervisorKey {string} Optional hypervisor key.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<DatasetModel<BaseHypervisorModel>>}
   */
  search(namePattern: string,
         hypervisorType?: string,
         from?: string,
         pageStartIndex?: number,
         filters?: Array<FilterModel>,
         pageSize: number = RestService.pageSize,
         resourceType: string = 'vm',
         hypervisorKey?: string, sorters?: Array<SorterModel>
         ): Observable<DatasetModel<BaseHypervisorModel>> {
    let me = this, payload: any, api = `api/hypervisor/search?resourceType=${resourceType}`;
    if (from && from.trim().length > 0)
      api += `&from=${from}`;
    if (filters && filters.length > 0) {
      api += `&filter=${encodeURIComponent(JSON.stringify(FilterModel.array2json(filters)))}`;
    }
    if (sorters && sorters.length > 0) {
      api += `&sort=${encodeURIComponent(JSON.stringify(SorterModel.array2json(sorters)))}`;
    }
    if (isNumber(pageStartIndex))
      api += `&pageSize=${pageSize}&pageStartIndex=${pageStartIndex}`;

    payload = {
      name: namePattern,
      hypervisorType: hypervisorType
    };
    if (hypervisorKey)
      payload.hypervisorKey = hypervisorKey;

    return me.core.post(api, payload).map((response: Object) => {
      return me.processDataset(response);
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  getFullPath(item: BaseModel): string {
    let me = this, path = '';
    me.breadcrumbs.forEach(function (crumb) {
      if (crumb.resource)
        path += `/${crumb.resource.id}:${crumb.resource.name}`;
    });
    path += `/${item.id}:${item.name}`;
    return path;
  }

  /**
   * GetByUrl method.
   * @param url {String} The URL.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} Optional page start index.
   * @param pageSize {number} Optional page size.
   * @returns {Observable<Object>}
   */
  private getPageByUrl(url: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
                       pageStartIndex?: number,
                       pageSize?: number): Observable<Object> {
    return this.core.getPageByUrl(url, FilterModel.array2json(filters), SorterModel.array2json(sorters),
      pageStartIndex, pageSize);
  }

  private processDataset(data: object): Object {
    let me = this, dataset, records;
    me.inVmLevel = false;
    this.resetBreadcrumbs(this.firstBreadcrumb());
    // Cast JSON object to the appropriate model instance
    if (data['hypervisors'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, HypervisorsModel);
      records = <Array<HypervisorModel>> dataset.records;
    } else if (data['vms'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, VmsModel);
      records = <Array<VmModel>> dataset.records;
      me.inVmLevel = true;
    } else if (data['volumes'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, VolumesModel);
      records = <Array<VolumeModel>> dataset.records;
    } else if (data['contents'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, HypervisorContentsModel);
      records = <Array<HypervisorContentModel>> dataset.records;
    } else if (data['vdisks'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, VdisksModel);
      records = <Array<HypervisorContentModel>> dataset.records;
    } else if (data['tags'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, TagsModel);
      records = <Array<TagModel>> dataset.records;
    } else if (data['categories'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, CategoriesModel);
      records = <Array<CategoryModel>> dataset.records;
    } else if (data['datacenters'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, DatacentersModel);
      records = <Array<DatacenterModel>>dataset.records;
    } else if (data['hosts'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, HostsModel);
      records = <Array<HostModel>> dataset.records;
    } else if (data['clusters'] !== undefined) {
      dataset = JsonConvert.deserializeObject(data, ClustersModel);
      records = <Array<ClusterModel>> dataset.records;
    }
    me.records = records || [];
    return dataset;
  }
}
