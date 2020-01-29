import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';
import {NodeService} from 'core';
import {BaseModel} from 'shared/models/base.model';
import {BaseHypervisorModel} from '../shared/base-hypervisor.model';
import {SharedService} from 'shared/shared.service';
import {ResponseNodelModel} from 'shared/models/response-node.model';
import {HypervisorModel} from '../shared/hypervisor.model';

@Injectable()
export class HypervisorBackupService {

  private static subtype = HypervisorModel.TYPE_VMWARE;
  private static version = '1.0';
  private static coreAPI = 'api/hypervisor';
  private static nodeAPI = 'ngp/hypervisor';


  constructor(private core: RestService, private node: NodeService) {
  }

  /**
   * Applies policies.
   * @param subtype {String} hyperv / vmware
   * @param resources {Array<BaseHypervisorModel>}
   * @param policies {Array<BaseModel>}
   * @returns {Observable<boolean>}
   */
  applyPolicies(subtype: string, resources: Array<BaseHypervisorModel>, policies: Array<BaseModel>): Observable<boolean> {
    let me = this, payload = {
      subtype: subtype,
      version: HypervisorBackupService.version,
      resources: me.getResourcesPayload(resources),
      slapolicies: me.getPoliciesPayload(policies)
    };
    return me.node.post(`${HypervisorBackupService.nodeAPI}?action=applySLAPolicies`,
      payload).map((response: Object) => {
      const res = SharedService.handleNodeResponse(response);
      return res && [200, 201].indexOf((<ResponseNodelModel>res).statusCode) !== -1;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Rerun SLA policy/job.
   * @param resource {BaseHypervisorModel}
   * @param subtype {String} hyperv / vmware
   * @param slaName {string} optional
   * @returns {Observable<boolean>}
   */
    rerun(resource: BaseHypervisorModel, subtype: string, slaName?: string): Observable<object> {
      let me = this;
      if (resource && typeof subtype === 'string') {
        return me.node.post(`${HypervisorBackupService.nodeAPI}?action=adhoc`,
          resource.getRerunPostBody(subtype, slaName)).map((response: Object) => {
          const res = SharedService.handleNodeResponse(response);
          return res && [200, 201].indexOf((<ResponseNodelModel>res).statusCode) !== -1;
        }).catch((error: HttpErrorResponse) => Observable.throw(error));
      }
    }

  /**
   * Rerun SLA policy subset.
   * @param payload AdHoc post body payload pre-constructed
   * @returns {Observable<boolean>}
   */
  runAdHoc(payload: any): Observable<object> {
    let me = this;
    return me.node.post(`${HypervisorBackupService.nodeAPI}?action=adhoc`,
      payload).map((response: Object) => {
      const res = SharedService.handleNodeResponse(response);
      return res && [200, 201].indexOf((<ResponseNodelModel>res).statusCode) !== -1;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Applies options.
   * @param resources {Array<BaseHypervisorModel>}
   * @param options {Object}
   * @returns {Observable<boolean>}
   */
  applyOptions(resources: Array<BaseHypervisorModel>, options: Object, subtype: string): Observable<boolean> {
    let me = this, payload = {
      subtype: subtype || '',
      version: HypervisorBackupService.version,
      resources: me.getResourcesPayload(resources),
      options: options
    };
    return me.node.post(`${HypervisorBackupService.nodeAPI}?action=applyOptions`,
      payload).map((response: Object) => {
      return !!response;
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

  private getResourcesPayload(resources: Array<BaseHypervisorModel>): Array<Object> {
    let result = [];
    resources.forEach(function (item) {
      result.push({
        href: item.getId(),
        id: item.id,
        metadataPath: item.metadataPath
      });
    });
    return result;
  }

  private getPoliciesPayload(policies: Array<BaseModel>): Array<Object> {
    let result = [];
    (policies || []).forEach(function (item) {
      result.push({
        href: item.getId(),
        id: item.id,
        name: item.name
      });
    });
    return result;
  }
}
