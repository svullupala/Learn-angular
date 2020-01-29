import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {RestService} from 'core';
import {NodeService} from 'core';
import {StorageModel} from './storage.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PoolModel} from './pool.model';
import {PartnersModel} from '../disk-manage/partner-manage/partners.model';
import {PartnerModel} from '../disk-manage/partner-manage/partner.model';
import {Subject} from 'rxjs/Subject';
import { JsonConvert } from 'json2typescript/index';
import { StoragesModel } from 'diskstorage/shared/storages.model';
import { LinkModel } from 'shared/models/link.model';
import { NetworkModel } from "diskstorage/disk-manage/network-manage/network.model";

@Injectable()
export class StorageManageService {

  private static coreAPI = 'api/storage';
  private static nodeAPI = 'ngp/storage';

  public getStorageItemSubs: Subject<void> = new Subject<void>();

  constructor(private core: RestService, private node: NodeService) {
  }

  public updateRestoreItems(): void {
    this.getStorageItemSubs.next();
  }

  /**
   * Register method.
   *
   * @param storage {Object} An object containing storage info needs to be registered.
   * @returns {Observable<T>}
   */
  register(storage: StorageModel): Observable<any> {
    return this.node.post(StorageManageService.nodeAPI, storage.getPersistentJson());
  }

  /**
   * Unregister method.
   *
   * @param storage {Object} An object containing storage info needs to be unregistered.
   * @returns {Observable<T>}
   */
  unregister(storage: StorageModel): Observable<any> {
    return this.core.deleteByUrl(storage.getUrl('delete'));
  }

  /**
   * Update method.
   *
   * @param storage {Object} An object containing storage info needs to be registered.
   * @returns {Observable<T>}
   */
  update(storage: StorageModel): Observable<any> {
    // return this.core.putByUrl(storage.getUrl('edit'), storage.getUpdateJson());
    return this.node.put(StorageManageService.nodeAPI, storage.id, storage.getUpdateJson());
  }

  getDisks(storage: StorageModel) {
    return this.core.getByUrl(storage.getUrl('managementDisk'));
  }

  getPools(storage: StorageModel) {
    return this.core.getByUrl(storage.getUrl('managementPool'));
  }

  getNetworks(storage: StorageModel) {
    return this.core.getByUrl(storage.getUrl('managementNetwork'));
  }

  getPartners(storage: StorageModel) {
    return this.core.getByUrl(storage.getUrl('managementPartner'));
  }

  addPartner(managePartner: PartnersModel, partnerId: string) {
    return this.core.postByUrl(managePartner.getUrl('add'), managePartner.getPartnerPostBody(partnerId));
  }

  editNetwork(network: NetworkModel) {
    return this.core.putByUrl(network.getUrl('edit'), network.getPostBody());
  }

  removePartner(partner: PartnerModel, partnerId: string) {
    return this.core.postByUrl(partner.getUrl('remove'), partner.getPartnerPostBody(partnerId));
  }

  setPoolOptions(pool: PoolModel) {
    return this.core.putByUrl(pool.getUrl('edit'), pool.getManagementOptionsJson());
  }

  expandPool(pool: PoolModel, diskList: Object) {
    return this.core.postByUrl(pool.getUrl('expandPool'), diskList);
  }

  initializeVSnap(storage: StorageModel) {
    return this.core.postByUrl(storage.getUrl('initialize'), storage.getInitJson());
  }

  initializeVSnapWithEncryption(storage: StorageModel) {
    return this.core.postByUrl(storage.getUrl('initializeWithEncryption'), storage.getInitJson());
  }

  rescanVSnapServerDisks(storage: StorageModel) {
    return this.core.postByUrl(storage.getUrl('rescan'), undefined, undefined, 'text');
  }

  refreshVsnap(storage: StorageModel) {
    return this.core.postByUrl(storage.getUrl('refresh'), undefined, undefined).map(
      (res) => {
        return JsonConvert.deserializeObject(res, StorageModel);
      }
    );
  }

  doAction(storage: StorageModel, link: LinkModel) {
    let actionLink: string = (link && storage) ? storage.getUrl(link.name) : undefined;
    if (actionLink) {
      return this.core.postByUrl(actionLink, undefined, undefined);
    }
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
    let api = StorageManageService.coreAPI;
    if (from && from.trim().length > 0)
      api += `?from=${from}`;
    return this.core.getAll(api, FilterModel.array2json(filters),
      SorterModel.array2json(sorters), pageStartIndex, pageSize);
  }

  /**
   * Gets the endpoint of ECX API.
   * @returns {string}
   */
  getEcxApiEndpoint(): string {
    return this.getEcxServiceEndpoint() + StorageManageService.coreAPI;
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

  /**
   * Get the latest version of storage
   * @param storage
   * @returns {Observable<any>}
   */
  refresh(storage: StorageModel) {
    return this.core.getByUrl(storage.getLink('self').href).map(
      (res)=> {
        return JsonConvert.deserializeObject(res, StorageModel);
      });
  }

  /**
   * Storage join of Active Directory
   * @param storage
   * @param joinActiveDirectoryModel
   * @returns {Observable<any>}
   */
  joinActiveDirectory(storage: StorageModel, joinActiveDirectoryModel) {
    return this.core.postByUrl(storage.getLink('joinActiveDirectory').href, joinActiveDirectoryModel);
  }

  /**
   * Storage leave Active Directory
   * @param storage
   * @param leaveActiveDirectoryModel
   * @returns {Observable<any>}
   */
  leaveActiveDirectory(storage: StorageModel, leaveActiveDirectoryModel) {
    return this.core.postByUrl(storage.getLink('leaveActiveDirectory').href, leaveActiveDirectoryModel);
  }
}
