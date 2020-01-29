import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

import {RestService} from 'core';
import {NodeService} from 'core';
import {HypervisorModel} from '../hypervisor.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';

@Injectable()
export class HypervisorManageService {

  private static coreAPI = 'api/hypervisor';
  private static nodeAPI = 'ngp/hypervisor';

  get proxy(): RestService {
    return this.core;
  }

  constructor(private core: RestService, private node: NodeService) {
  }

  /**
   * Register method.
   *
   * @param vcenter {Object} An object containing hypervisor info needs to be registered.
   * @returns {Observable<T>}
   */
  register(vcenter: HypervisorModel): Observable<Object> {
    return this.node.post(HypervisorManageService.nodeAPI, vcenter.getPersistentJson());
  }

  /**
   * Unregister method.
   *
   * @param vcenter {Object} An object containing hypervisor info needs to be unregistered.
   * @returns {Observable<T>}
   */
  unregister(vcenter: HypervisorModel): Observable<Object> {
    return this.core.deleteByUrl(vcenter.getUrl('delete'));
  }

  /**
   * Update method.
   *
   * @param vcenter {Object} An object containing hypervisor info needs to be registered.
   * @returns {Observable<T>}
   */
  update(vcenter: HypervisorModel): Observable<Object> {
    // Call NodeJS API PUT “ngp/hypervisor/<id>” to update hypervisor.
    return this.node.put(HypervisorManageService.nodeAPI, vcenter.id, vcenter.getUpdateJson());
  }

  /**
   * GetAll method.
   *
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param from {string} where the data comes from.
   * @returns {Observable<T>}
   */
  getAll(filters?: Array<FilterModel>, sorters?: Array<SorterModel>, from?: string,
         pageStartIndex?: number, pageSize?: number): Observable<Object> {
    let api = HypervisorManageService.coreAPI;
    if (from && from.trim().length > 0)
      api += `?from=${from}`;
    return this.core.getPage(api, FilterModel.array2json(filters), SorterModel.array2json(sorters), pageStartIndex,
      pageSize);
  }

  /**
   * GetAll method to get all ESX host.
   *
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param id {string} id from the selected user.
   * @returns {Observable<T>}
   */
  getAllESXHosts(id: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
         pageStartIndex?: number): Observable<Object> {
    let api = HypervisorManageService.coreAPI;
    if (id)
      api += `?hostuser=${id}`;
    return this.core.getPage(api, FilterModel.array2json(filters), SorterModel.array2json(sorters), pageStartIndex);
  }

  /**
   * Gets the endpoint of ECX API.
   * @returns {string}
   */
  getEcxApiEndpoint(): string {
    return this.getEcxServiceEndpoint() + HypervisorManageService.coreAPI;
  }

  /**
   * Gets the endpoint of ECX  HOST API.
   * @returns {string}
   */
  getEcxApiHostEndpoint(): string {
    return this.getEcxServiceEndpoint() + HypervisorManageService.coreAPI;
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  }

  /**
   * Gets the endpoint of NodeJS service.
   * @returns {string}
   */
  getNodeServiceEndpoint(): string {
    return this.node.getBaseUrl();
  }
}
