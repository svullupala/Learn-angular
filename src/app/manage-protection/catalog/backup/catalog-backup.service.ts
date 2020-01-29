import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';
import {NodeService} from 'core';
import {SharedService} from 'shared/shared.service';
import {ResponseNodelModel} from 'shared/models/response-node.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {BaseModel} from 'shared/models/base.model';

@Injectable()
export class CatalogBackupService {

  private static subtype = 'catalog';
  private static version = '1.0';
  private static coreAPI = 'api/endeavour/catalog/system';
  private static nodeAPI = 'ngp/catalog/system';


  constructor(private core: RestService, private node: NodeService) {
  }

  /**
   * Applies policies.
   * @param resources {Array<SlapolicyModel>}
   * @returns {Observable<boolean>}
   */
  applyPolicies( resources: Array<BaseModel>): Observable<boolean> {
    let me = this, payload = {
      subtype: CatalogBackupService.subtype,
      version: CatalogBackupService.version,
      slapolicies: me.getResourcesPayload(resources)
    };
    return me.node.post(`${CatalogBackupService.nodeAPI}?action=applySLAPolicies`,
      payload).map((response: Object) => {
      const res = SharedService.handleNodeResponse(response);
      return res && [200, 201].indexOf((<ResponseNodelModel>res).statusCode) !== -1;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  getCatalogSystem() {
    return this.core.getAll(`${CatalogBackupService.coreAPI}`);
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

  private getResourcesPayload(resources: Array<BaseModel>): Array<Object> {
    let result = [];
    resources.forEach(function (item) {
      result.push({
        href: item.getId(),
        id: item.id,
        name: item.name
      });
    });
    return result;
  }
}
