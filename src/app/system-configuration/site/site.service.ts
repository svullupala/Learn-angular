import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { RestService } from 'core';
import { FilterModel } from 'shared/models/filter.model';
import { SorterModel } from 'shared/models/sorter.model';
import { SiteModel } from './site.model';
import { SharedService } from 'shared/shared.service';

@Injectable()
export class SiteService {

  private static coreAPI = 'api/site';
  private static hasStorageParam = 'hasStorage=true';
  private static excludeDemoParam = 'excludeDemo=true';

  constructor(private core: RestService) {
  }

  /**
   * Create method.
   *
   * @param site {SiteModel} Site model containing info needs to be created.
   * @returns {Observable<T>}
   */
  create(site: SiteModel): Observable<Object> {
    return this.core.post(SiteService.coreAPI, site.getPersistentJson());
  }

  /**
   * Delete method.
   *
   * @param site {SiteModel} Policy model containing info needs to be deleted.
   * @returns {Observable<T>}
   */
  delete(site: SiteModel): Observable<Object> {
    return this.core.deleteByUrl(site.getUrl('delete'));
  }

  /**
   * Update method.
   *
   * @param policy {SlapolicyModel} An object containing vCenter info needs to be registered.
   * @returns {Observable<T>}
   */
  update(site: SiteModel): Observable<Object> {
    return this.core.put(SiteService.coreAPI, site.id, site.getPersistentJson());
  }

  /**
   * GetAll method.
   *
   * @param hasStorage {boolean} true if return sites that have storage assigned
   * @returns {Observable<T>}
   */
  getAll(hasStorage?: boolean, excludeDemo?: boolean): Observable<Object> {

    let target = [], params = [];

    if (hasStorage && hasStorage === true) {
      params.push(SiteService.hasStorageParam);
    }

    if (excludeDemo && excludeDemo === true) {
      params.push(SiteService.excludeDemoParam);
    }

    if (params.length != 0) {
      return this.core.getAll(SharedService.formatString('{0}?{1}', SiteService.coreAPI, params.join('&')), target);
    }

    return this.core.getAll(SiteService.coreAPI, target);
      
  } 

  /**
   * Get sites
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} The page start index.
   * @returns {Observable<Object>}
   */
  getSites(sorters?: Array<SorterModel>,
                 pageStartIndex?: number): Observable<Object> {
    return this.core.getPage(SiteService.coreAPI, undefined, SorterModel.array2json(sorters),
      pageStartIndex);
  }

  /**
   * Gets the endpoint of ECX API.
   * @returns {string}
   */
  getEcxApiEndpoint(): string {
    return this.getEcxServiceEndpoint() + SiteService.coreAPI;
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  }
}
