import {HttpErrorResponse, HttpParams} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import {HateoasModel} from './hateoas.model';
import {RestService, HasProxy, HasPersistentJson, HasUpdateJson} from 'core';
import {NodeService} from 'core';
import {FilterModel} from './filter.model';
import {SorterModel} from './sorter.model';
import {DatasetModel} from './dataset.model';
import {NvPairModel} from './nvpair.model';

export interface HasIcon {
  icon: string;
  tooltip?: string;
}

export interface HasDynaIcon extends HasIcon {
  iconPointer: number | string;
}

@JsonObject
export abstract class BaseModel extends HateoasModel implements HasProxy, HasPersistentJson, HasUpdateJson {

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('typeDisplayName', String, true)
  public typeDisplayName: string = undefined;

  @JsonProperty('resourceType', String, true)
  public resourceType: string = undefined;

  @JsonProperty('triggerIds', String, true)
  public triggerIds: string[] = undefined;

  @JsonProperty('rbacPath', String, true)
  public rbacPath: string = undefined;

  public metadata: Object = {};

  public proxy: RestService;
  public nodeProxy: NodeService;

  /**
   * True when the record does not yet exist in a server-side database.
   * Any record which has a real database pk set as its id property is NOT a phantom -- it's real.
   * @returns {boolean}
   */
  public get phantom(): boolean {
    return !this.id || this.id.length < 1;
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    return {};
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    return {};
  }

  /**
   * Returns true if the given model equals this model.
   * @param another The given model
   * @returns {boolean}
   */
  public equals(another: BaseModel): boolean {
    return this.identity(another.getId());
  }

  /**
   * Returns true if the given URL matches this model.
   * NOTE: this method based on an assumption - If we know the host name can be really coming from the same server,
   * testing the /api/... part of the URL should be good enough.
   *
   * @param {string} url
   * @returns {boolean}
   */
  public identity(url: string): boolean {
    let id = this.getId(), idx1 = (id || '').indexOf('/api/'), idx2 = (url || '').indexOf('/api/');
    if (idx1 !== -1 && idx2 !== -1)
      return id.substring(idx1) === url.substring(idx2);
    return id === url;
  }

  /**
   * Gets record from server-side by the given generic type, model class, from-link name and optional proxy.
   *
   * @param classObject The model class.
   * @param fromLink The link name where the record will be retrieved from.
   * @param proxy The data proxy service.
   * @returns {Observable<T>}
   */
  getRecord<T extends HasProxy>(classObject: { new(): T },
                                fromLink: string,
                                proxy?: RestService): Observable<T> {
    let me = this, observable: Observable<Object>, result: Observable<T>, link = me.getLink(fromLink);
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.getByUrl(link.href);
      result = observable.map((body: Object) => {
        const data = body;
        let record: T;
        try {
          record = <T> JsonConvert.deserializeObject(data, classObject);
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
   * optional filters, sorters, pagination parameters and  proxy.
   *
   * @param classObject The model class.
   * @param fromLink {string} The link name where the daeaset will be retrieved from.
   * @param filters {Array<FilterModel>} optional filters.
   * @param sorters {Array<SorterModel>} optional sorters.
   * @param pageStartIndex {number} optional pageStartIndex.
   * @param pageSize {number} optional pageSize, pass zero to disable pagination.
   * @param extraParams {Array<NvPairModel>} optional extra params which will append to the request URL.
   *        e.g. If need a URL like 'http://.../api/xxx?from=hlo', pass extra parameters as below.
   *        [ new NvPairModel('from', 'hlo') ]
   * @param proxy {RestService} optional data proxy service.
   * @returns {Observable<U extends DatasetModel<T>>}
   */
  getDataset<T extends HasProxy, U extends DatasetModel<T>>(classObject: { new(): U },
                                                            fromLink: string,
                                                            filters?: Array<FilterModel>,
                                                            sorters?: Array<SorterModel>,
                                                            pageStartIndex?: number,
                                                            pageSize?: number,
                                                            extraParams?: Array<NvPairModel>,
                                                            proxy?: RestService): Observable<U> {
    let me = this, url: string, observable: Observable<Object>, result: Observable<U>,
      link = me.getLink(fromLink), filterMerged = false;
    proxy = proxy || me.proxy;
    if (link && proxy) {

      url = (extraParams && extraParams.length > 0) ? me.setExtraParams(link.href, extraParams) : link.href;

      if (me.needMergingFilter(url, filters)) {
        url = me.mergeFilter(url, filters);
        filterMerged = true;
      }

      observable = proxy.getPageByUrl(url, filterMerged ? undefined : FilterModel.array2json(filters),
        SorterModel.array2json(sorters),
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

  /**
   * Updates record to server-side by the given generic type, model class and
   * optional proxy.
   *
   * @param classObject The model class.
   * @param proxy {RestService} optional data proxy service.
   * @returns {Observable<T>}
   */
  update<T extends HasProxy>(classObject: { new(): T },
                             proxy?: RestService): Observable<T> {
    let me = this, observable: Observable<Object>, result: Observable<T>, link = me.getLink('edit');
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.putByUrl(link.href, me.getUpdateJson());
      result = observable.map((body: Object) => {
        const data = body;
        let record: T;
        try {
          record = <T>JsonConvert.deserializeObject(data, classObject);
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
   * Removes record from server-side by the optional proxy.
   *
   * @param proxy {RestService | NodeService} optional data proxy service.
   * @returns {Observable<boolean>}
   */
  remove(proxy?: RestService | NodeService): Observable<boolean> {
    let me = this, observable: Observable<Object>, result: Observable<boolean>, link = me.getLink('delete'),
    node = proxy && proxy instanceof NodeService;
    proxy = proxy || (node ? me.nodeProxy : me.proxy);
    if (link && proxy) {
      observable = proxy.deleteByUrl(link.href);
      result = observable.map((response: Object) => {
        if (node)
          me.nodeProxy = <NodeService> proxy;
        else
          me.proxy = <RestService> proxy;
        return true;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Sends a request for the specified action to server side by the given generic type, model class, action name,
   * optional payload and proxy.
   *
   * @param {{new() => T}} classObject The model class.
   * @param {string} name The action name
   * @param {Object} payload Optional payload.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<T extends HasProxy>}
   */
  doAction<T extends HasProxy>(classObject: { new(): T },
                               name: string, payload?: Object,
                               proxy?: RestService): Observable<T> {
    let me = this, observable: Observable<Object>, result: Observable<T>,
      link = me.getLink(name);
    proxy = proxy || me.proxy;
    if (link && proxy) {
      observable = proxy.postByUrl(link.href, payload);
      result = observable.map((body: Object) => {
        const data = body;
        let updated: T;
        try {
          updated = <T>JsonConvert.deserializeObject(data, classObject);
          updated.proxy = proxy;
        } catch (e) {
        }
        return updated;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  /**
   * Sets extra parameters.
   * @param {string} url The given URL.
   * @param extraParams {Array<NvPairModel>} optional extra params which will append to the request URL.
   *        e.g. If need a URL like 'http://.../api/xxx?from=hlo', pass extra parameters as below.
   *        [ new NvPairModel('from', 'hlo') ]
   * @returns {string} The overridden URL.
   */
  private setExtraParams(url: string, extraParams: Array<NvPairModel>): string {
    let idx = url.indexOf('?'), hasQueryString = idx !== -1,
      queryString = hasQueryString ? url.substring(idx + 1) : '',
      params = new HttpParams({fromString: queryString});

    extraParams.forEach(function (param) {
      params = params.set(param.name, param.value);
    });
    return (hasQueryString ? url.substring(0, idx + 1) : url) + params.toString();
  }

  private getUri(url: string): string {
    let idx = url.indexOf('?'), hasQueryString = idx !== -1,
      uri = hasQueryString ? url.substring(0, idx + 1) : url;
    return uri;
  }

  private createHttpParams(url: string): HttpParams {
    let idx = url.indexOf('?'), hasQueryString = idx !== -1,
      queryString = hasQueryString ? url.substring(idx + 1) : '';
    return new HttpParams({fromString: queryString});
  }

  private hasFilterParam(url: string): boolean {
    let params = this.createHttpParams(url);
    return params.has('filter');
  }

  private needMergingFilter(url: string, filters: FilterModel[]): boolean {
    let hasOriginalFilterParam = this.hasFilterParam(url),
      hasNewFilterParam = filters && filters.length > 0;
    return hasOriginalFilterParam && hasNewFilterParam;
  }

  private extractFilter(params: HttpParams): FilterModel[] {
    let result: FilterModel[],
      decoded = decodeURIComponent(params.get('filter')), filter = JSON.parse(decoded);
    if (Array.isArray(filter)) {
      result = [];
      filter.forEach(function (item) {
        result.push(new FilterModel(item.property, item.value, item.op));
      });
    }
    return result;
  }

  private mergeFilter(url: string, filters: FilterModel[]): string {
    let me = this, idx = url.indexOf('?'), hasQueryString = idx !== -1,
      params = this.createHttpParams(url),
      hasSort = params.has('sort'),
      hasFilter = params.has('filter'),
      filtersValue,
      originFilters,
      targetFilters;
    if (hasSort)
      params = params.set('sort', decodeURIComponent(params.get('sort')));
    if (hasFilter) {
      originFilters = me.extractFilter(params);
      targetFilters = (originFilters || []).concat(filters);
      filtersValue = JSON.stringify(FilterModel.array2json(targetFilters));
      params = params.set('filter', filtersValue);
    }
    return hasQueryString ? (url.substring(0, idx + 1) + params.toString()) : url;
  }
}
