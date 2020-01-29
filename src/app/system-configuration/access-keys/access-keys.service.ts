import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {KeyModel} from './key.model';

@Injectable()
export class AccessKeysService {

  private static coreAPI = 'api/identity/key';

  constructor(private core: RestService) {
  }

  /**
   * Create method.
   *
   * @param key {KeyModel} Key model containing info needs to be created.
   * @param payload {Object} Optional payload object to use instead of default.
   * @returns {Observable<T>}
   */
  create(key: KeyModel, payload?: object): Observable<Object> {
    return this.core.post(AccessKeysService.coreAPI, payload || key.getPersistentJson());
  }

  /**
   * Delete method.
   *
   * @param key {KeyModel} Policy model containing info needs to be deleted.
   * @returns {Observable<T>}
   */
  delete(key: KeyModel): Observable<Object> {
    return this.core.deleteByUrl(key.getUrl('delete'));
  }

  /**
   * Update method.
   *
   * @param policy {SlapolicyModel} An object containing vCenter info needs to be registered.
   * @param payload {Object} Optional payload object to use instead of default.
   * @returns {Observable<T>}
   */
  update(key: KeyModel, payload?: object): Observable<Object> {
    return this.core.put(AccessKeysService.coreAPI, key.id, payload || key.getPersistentJson());
  }

  /**
   * GetAll method.
   *
   * @param filters {Array<FilterModel>} Optional filters.
   * @returns {Observable<T>}
   */
  getAll(): Observable<Object> {
    let target = [];
    return this.core.getAll(AccessKeysService.coreAPI, target);
  }

  /**
   * Get keys
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  getKeys(sorters?: Array<SorterModel>, filters?: Array<FilterModel>): Observable<Object> {
    return this.core.getPage(AccessKeysService.coreAPI, filters, SorterModel.array2json(sorters));
  }

  /**
   * Gets the endpoint of ECX API.
   * @returns {string}
   */
  getEcxApiEndpoint(): string {
    return this.getEcxServiceEndpoint() + AccessKeysService.coreAPI;
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  }
}
