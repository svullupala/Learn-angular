import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { JsonConvert } from 'json2typescript';

import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {CertificateModel} from './certificate.model';
import { CertificateSelectModel } from 'cloud/cloud-certificate/certificate-select-model';

@Injectable()
export class CertificatesService {

  private static coreAPI = 'api/security/certificate';

  constructor(private core: RestService) {
  }

  /**
   * Create method.
   *
   * @param certificate {CertificateModel | CertificateSelectModel}
   * Certificate model containing info needs to be created.
   * @returns {Observable<T>}
   */
  create(certificate: CertificateModel | CertificateSelectModel): Observable<CertificateModel
    | CertificateSelectModel> {
    return this.core.post(CertificatesService.coreAPI, certificate.getPersistentJson()).map(
      (data) => {
        return JsonConvert.deserializeObject(data, CertificateModel);
      }
    );
  }

  /**
   * Delete method.
   *
   * @param certificate {CertificateModel} Policy model containing info needs to be deleted.
   * @returns {Observable<T>}
   */
  delete(certificate: CertificateModel): Observable<Object> {
    return this.core.deleteByUrl(certificate.getUrl('delete'));
  }

  /**
   * Update method.
   *
   * @param policy {SlapolicyModel} An object containing vCenter info needs to be registered.
   * @returns {Observable<T>}
   */
  update(certificate: CertificateModel): Observable<Object> {
    return this.core.put(CertificatesService.coreAPI, certificate.id, certificate.getPersistentJson());
  }

  /**
   * GetAll method.
   *
   * @param filters {Array<FilterModel>} Optional filters.
   * @returns {Observable<T>}
   */
  getAll(): Observable<Object> {
    let target = [];
    return this.core.getAll(CertificatesService.coreAPI, target);
  }

  /**
   * Get certificates
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} The page start index.
   * @returns {Observable<Object>}
   */
  getCertificates(sorters?: Array<SorterModel>,
          pageStartIndex?: number): Observable<Object> {
    return this.core.getPage(CertificatesService.coreAPI, undefined, SorterModel.array2json(sorters),
      pageStartIndex);
  }

  /**
   * Gets the endpoint of ECX API.
   * @returns {string}
   */
  getEcxApiEndpoint(): string {
    return this.getEcxServiceEndpoint() + CertificatesService.coreAPI;
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  }
}
