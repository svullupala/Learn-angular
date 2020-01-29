import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {isNumber} from 'util';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {RestService} from 'core';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {FilterModel} from 'shared/models/filter.model';
import {BaseModel} from 'shared/models/base.model';
import {SorterModel} from 'shared/models/sorter.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {StorageModel} from './storage.model';
import {StorageSnapshotsModel} from './storage-snapshots.model';
import {StorageSnapshotModel} from './storage-snapshot.model';
import {StoragesModel} from './storages.model';

@Injectable()
export class StorageBrowseService {
  public records: Array<StorageModel> = [];

  public breadcrumbs: BreadcrumbModel[] = [];

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
   * @returns {{url: string, observable: Observable<DatasetModel<BaseModel>>}}
   */
  getView(item: StorageModel, name: string,
          filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
          pageStartIndex?: number): {
    url: string,
    observable: Observable<DatasetModel<StorageModel>>
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
   * @returns {Observable<DatasetModel<BaseModel>>}
   */
  getContent(url: string,
             filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
             pageStartIndex?: number): Observable<DatasetModel<StorageModel>> {

    return this.getPageByUrl(url, filters, sorters, pageStartIndex).map((response: Object) => {
      const data = response;
      let dataset, records;

      if (data['snapshots'] !== undefined) {
        dataset = JsonConvert.deserializeObject(data, StorageSnapshotsModel);
        records = <Array<StorageSnapshotModel>> dataset.records;
      }
      this.records = records;
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Navigate method.
   * @param item {Object} Storage or lower level object.
   * @param viewName {String} The view name.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {boolean | Observable<DatasetModel<BaseModel>>}
   */
  navigate(item: StorageModel, viewName: string,
           filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
           pageStartIndex?: number): boolean
    | Observable<DatasetModel<StorageModel>> {

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

  /**
   * Search method - Maybe broken
   *
   * @param namePattern {string} The name pattern.
   * @param from {string} where the data comes from.
   * @param pageStartIndex {number} Optional page start index.
   * @returns {Observable<DatasetModel<BaseHypervisorModel>>}
   */
  search(namePattern: string,
         from?: string,
         pageStartIndex?: number,
         filters?: Array<FilterModel>,
         pageSize: number = RestService.pageSize): Observable<DatasetModel<StorageModel>> {
    let api = 'api/storage/search?resourceType=storage';
    if (from && from.trim().length > 0)
      api += `&from=${from}`;
    if (filters && filters.length > 0) {
      api += `&filter=${encodeURIComponent(JSON.stringify(FilterModel.array2json(filters)))}`;
    }
    if (isNumber(pageStartIndex)) {
      api += `&pageSize=${pageSize}&pageStartIndex=${pageStartIndex}`;
    }
    return this.core.post(api, {
      name: namePattern,
    }).map((response: Object) => {
      const data = response;
      let dataset, records;
      if (data['storages'] !== undefined) {
        dataset = JsonConvert.deserializeObject(data, StoragesModel);
        records = <Array<StorageModel>> dataset.records;
      }
      this.records = records;
      return dataset;
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
   * @returns {Observable<Object>}
   */
  private getPageByUrl(url: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
                       pageStartIndex?: number): Observable<Object> {
    return this.core.getPageByUrl(url, FilterModel.array2json(filters), SorterModel.array2json(sorters),
      pageStartIndex);
  }
}
