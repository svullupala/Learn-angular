import {HttpErrorResponse, HttpParams} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import {LinkModel} from './link.model';
import {HateoasModel} from './hateoas.model';
import {RestService, HasProxy, HasProxyAndPersistentJson} from 'core';
import {FilterModel} from './filter.model';
import {SorterModel} from './sorter.model';
import {NvPairModel} from './nvpair.model';

export interface HasAPI {
  api(): string;
}

export interface HasProxyAndAPI extends HasProxy, HasAPI {
}

export interface HasNewOperator<T extends HasProxyAndAPI> {
  new(): T;
}

@JsonObject
export abstract class DatasetModel<T extends HasProxy> extends HateoasModel implements HasProxy {

  public page: number = undefined;

  @JsonProperty('total', Number, true)
  public total: number = 0;

  public proxy: RestService;

  /**
   * A static method to retrieve dataset from server-side by the given type, model class, proxy,
   * optional filters, sorters, pagination and extraParams parameters.
   *
   * @param classObject The model class.
   * @param proxy {RestService} The data proxy service.
   * @param filters {Array<FilterModel>} optional filters.
   * @param sorters {Array<SorterModel>} optional sorters.
   * @param pageStartIndex {number} optional pageStartIndex.
   * @param pageSize {number} optional pageSize, pass zero to disable pagination.
   * @param extraParams {Array<NvPairModel>} optional extra params which will append to the request URL.
   *        e.g. If need a URL like 'http://.../api/xxx?from=hlo', pass extra parameters as below.
   *        [ new NvPairModel('from', 'hlo') ]
   * @returns {Observable<U extends DatasetModel<T>>}
   */
  public static retrieve<T extends HasProxy,
    U extends DatasetModel<T>>(classObject: HasNewOperator<HasProxyAndAPI>,
                               proxy: RestService,
                               filters?: Array<FilterModel>,
                               sorters?: Array<SorterModel>,
                               pageStartIndex?: number,
                               pageSize?: number,
                               extraParams?: Array<NvPairModel>): Observable<U> {
    let observable: Observable<Object>, result: Observable<U>,
      api = classObject.prototype.api(), params = '';
    if (extraParams) {
      extraParams.forEach(function (param, idx) {
        params += (idx === 0) ? '?' : '&';
        params += `${param.name}=${encodeURIComponent(param.value)}`;
      });
      api += params;
    }
    observable = proxy.getPage(api, FilterModel.array2json(filters), SorterModel.array2json(sorters), pageStartIndex,
      pageSize);
    result = observable.map((body: Object) => {
      const data = body;
      let dataset: U;
      try {
        dataset = <U>JsonConvert.deserializeObject(data, classObject);
        dataset.proxy = proxy;
        (dataset.records || []).forEach(function (record) {
          record.proxy = proxy;
        });
      } catch (e) {
      }
      return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
    return result;
  }

  /**
   * A static method to create record to server-side by the given type, model class, model instance, link and proxy.
   *
   * @param {{new() => T}} classObject The model class.
   * @param {HasProxyAndPersistentJson} model The model instance.
   * @param {LinkModel} link The link model.
   * @param {RestService} proxy  Optional data proxy service.
   * @returns {Observable<T extends HasProxy>}
   */
  public static create<T extends HasProxy>(classObject: { new(): T },
                                           model: HasProxyAndPersistentJson,
                                           link: LinkModel,
                                           proxy: RestService): Observable<T> {
    let observable: Observable<Object>, result: Observable<T>;
    if (link && proxy) {
      observable = proxy.postByUrl(link.href, model.getPersistentJson());
      result = observable.map((body: Object) => {
        const data = body;
        let created: T;
        try {
          created = <T>JsonConvert.deserializeObject(data, classObject);
          created.proxy = proxy;
        } catch (e) {
        }
        return created;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  public get records(): Array<T> {
    return this.getRecords();
  }

  protected abstract getRecords(): Array<T>;

  /**
   * Gets record from server-side by the given generic type, model class, from-link name and optional proxy.
   *
   * @param classObject The model class.
   * @param fromLink The link name where the record will be retrieved from.
   * @param proxy The data proxy service.
   * @returns {Observable<T>}
   */
  getRecord<U extends HasProxy>(classObject: { new(): U },
                                fromLink: string,
                                proxy?: RestService): Observable<U> {
    let me = this, observable: Observable<Object>, result: Observable<U>, link = me.getLink(fromLink);
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.getByUrl(link.href);
      result = observable.map((body: Object) => {
        const data = body;
        let record: U;
        try {
          record = <U> JsonConvert.deserializeObject(data, classObject);
          record.proxy = proxy;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Gets dataset from server-side by the given generic type, model class, from-link name,
   * optional filters, sorters, pagination parameters and proxy.
   *
   * @param classObject The model class.
   * @param fromLink {string} The link name where the dataset will be retrieved from.
   * @param filters {Array<FilterModel>} optional filters.
   * @param sorters {Array<SorterModel>} optional sorters.
   * @param pageStartIndex {number} optional pageStartIndex.
   * @param pageSize {number} optional pageSize, pass zero to disable pagination.
   * @param proxy {RestService} optional data proxy service.
   * @returns {Observable<U extends DatasetModel<S>>}
   */
  getDataset<S extends HasProxy, U extends DatasetModel<S>>(classObject: { new(): U },
                                                            fromLink: string,
                                                            filters?: Array<FilterModel>,
                                                            sorters?: Array<SorterModel>,
                                                            pageStartIndex?: number,
                                                            pageSize?: number,
                                                            proxy?: RestService): Observable<U> {
    let me = this, result: Observable<U>, link = me.getLink(fromLink);
    if (link)
      result = me.getPageByUrl<S, U>(classObject, link.href, filters, sorters, pageStartIndex, pageSize, proxy);
    return result;
  }

  /**
   * Creates record to server-side by the given model class, model instance and
   * optional proxy.
   *
   * @param {{new() => T}} classObject The model class.
   * @param {HasProxyAndPersistentJson} model The model instance.
   * @param {RestService} proxy  Optional data proxy service.
   * @returns {Observable<T extends HasProxy>}
   */
  create(classObject: { new(): T },
         model: HasProxyAndPersistentJson,
         proxy?: RestService): Observable<T> {
    let me = this;
    return DatasetModel.create<T>(classObject, model, me.getLink('create'), proxy || me.proxy);
  }

  /**
   * Gets page from server-side by the given model class, page name ('firstPage', 'prevPage', 'nextPage'
   * and 'lastPage') and optional proxy.
   *
   * @param {{new() => DatasetModel<T extends HasProxy>}} classObject The model class.
   * @param {string} pageName The page name.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<U extends DatasetModel<T>>}
   */
  public getPage<U extends DatasetModel<T>>(classObject: { new(): U },
                                            pageName: string,
                                            proxy?: RestService): Observable<U> {
    return this.getPageByLink<U>(classObject, this.getLink(pageName), proxy);
  }

  /**
   * Gets page from server-side by self link, the given model class, pagination parameter -
   * pageStartIndex, optional pagination parameter - pageSize and proxy.
   *
   * @param {{new() => DatasetModel<T extends HasProxy>}} classObject The model class.
   * @param {number} pageStartIndex The pagination parameter - pageStartIndex.
   * @param {number} pageSize Optional page size.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<U extends DatasetModel<T>>}
   */
  public getPageBySelf<U extends DatasetModel<T>>(classObject: { new(): U },
                                                  pageStartIndex: number,
                                                  pageSize?: number,
                                                  proxy?: RestService): Observable<U> {
    let me = this, url = me.getId(), result: Observable<U>;
    result = me.getPageByUrl<T, U>(classObject, url, undefined, undefined, pageStartIndex, pageSize, proxy);
    return result;
  }

  /**
   * Gets page from server-side by the given model class, link and optional proxy.
   *
   * @param {{new() => DatasetModel<T extends HasProxy>}} classObject The model class.
   * @param {LinkModel} link The link.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<U extends DatasetModel<T>>}
   */
  public getPageByLink<U extends DatasetModel<T>>(classObject: { new(): U },
                                                  link: LinkModel,
                                                  proxy?: RestService): Observable<U> {
    let me = this, observable: Observable<Object>, result: Observable<U>;
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.getByUrl(link.href);
      result = observable.map((body: Object) => {
        const data = body;
        let dataset: U;
        try {
          dataset = <U>JsonConvert.deserializeObject(data, classObject);
          dataset.proxy = proxy;
          (dataset.records || []).forEach(function (record) {
            record.proxy = proxy;
          });
        } catch (e) {
        }
        me.proxy = proxy;
        return dataset;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Empties pagination parameters.
   * @param {string} url The given URL.
   * @returns {string} The overridden URL.
   */
  private emptyPaginationParams(url: string): string {
    let idx = url.indexOf('?'), hasQueryString = idx !== -1,
      queryString = hasQueryString ? url.substring(idx + 1) : '',
      params = new HttpParams({fromString: queryString}),
      hasStartIndex = params.has('pageStartIndex'),
      hasSize = params.has('pageSize'),
      hasSort = params.has('sort'),
      hasFilter = params.has('filter');
    if (hasStartIndex)
      params = params.delete('pageStartIndex');
    if (hasSize)
      params = params.delete('pageSize');

    if (hasSort)
      params = params.set('sort', decodeURIComponent(params.get('sort')));
    if (hasFilter)
      params = params.set('filter', decodeURIComponent(params.get('filter')));

    return hasQueryString ? (url.substring(0, idx + 1) + params.toString()) : url;
  }

  /**
   * Gets page from server-side by the given generic type, model class, from-link name,
   * optional filters, sorters, pagination parameters and proxy.
   *
   * @param {{new() => DatasetModel<T extends HasProxy>}} classObject The model class.
   * @param {string} url The URL where the dataset will be retrieved from.
   * @param {Array<FilterModel>} filters Optional filters.
   * @param {Array<SorterModel>} sorters Optional sorters.
   * @param {number} pageStartIndex Optional pageStartIndex.
   * @param {number} pageSize Optional pageSize, pass zero to disable pagination.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<U extends DatasetModel<S>>}
   */
  private getPageByUrl<S extends HasProxy, U extends DatasetModel<S>>(classObject: { new(): U },
                                                                      url: string,
                                                                      filters?: Array<FilterModel>,
                                                                      sorters?: Array<SorterModel>,
                                                                      pageStartIndex?: number,
                                                                      pageSize?: number,
                                                                      proxy?: RestService): Observable<U> {
    let me = this, observable: Observable<Object>, result: Observable<U>;
    proxy = proxy || me.proxy;
    if (url && url.length > 0 && proxy) {
      observable = proxy.getPageByUrl(me.emptyPaginationParams(url),
        FilterModel.array2json(filters), SorterModel.array2json(sorters),
        pageStartIndex, pageSize);
      result = observable.map((body: Object) => {
        const data = body;
        let dataset: U;
        try {
          dataset = <U>JsonConvert.deserializeObject(data, classObject);
          dataset.proxy = proxy;
          (dataset.records || []).forEach(function (record) {
            record.proxy = proxy;
          });
        } catch (e) {
        }
        me.proxy = proxy;
        return dataset;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }
}
