import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {SharedService} from 'shared/shared.service';
import {ResponseNodelModel} from 'shared/models/response-node.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {StorageSnapshotModel} from 'diskstorage/shared/storage-snapshot.model';
import {NodeService, RestService} from 'core';

@Injectable()
export class CatalogRestoreService {

  private static subtype = 'catalog';
  private static version = '1.0';
  private static coreAPI = 'api/catalog/system';
  private static nodeAPI = 'ngp/catalog/system';


  constructor(private core: RestService, private node: NodeService) {
  }

  /**
   * Applies policies.
   * @param resources {Array<SlapolicyModel>}
   * @returns {Observable<boolean>}
   */
  initiateRestore( resource: StorageSnapshotModel, mode: string): Observable<boolean> {
    let me = this, payload = {
      subtype: CatalogRestoreService.subtype,
      spec: this.getSpecPayload(resource, mode)
    };
    return me.node.post(`${CatalogRestoreService.nodeAPI}?action=restore`,
      payload).map((response: Object) => {
      const res = SharedService.handleNodeResponse(response);
      return res && [200, 201].indexOf((<ResponseNodelModel>res).statusCode) !== -1;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
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

  getSpecPayload(resource: StorageSnapshotModel, mode: string): Object {
    return {
      source: [{
        href: resource.getUrl('self')
      }],
      options: {
        mode: mode
      },
      subpolicy: [{
      }],
      script: {
      }
    };
  }
}
