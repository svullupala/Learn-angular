import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RestService } from 'core';
import { NodeService } from 'core';
import { BaseModel } from 'shared/models/base.model';
import { ResponseNodelModel } from 'shared/models/response-node.model';
import { InstanceModel } from '../shared/instance.model';
import { DatabaseGroupModel } from '../shared/databasegroup.model';
import { DatabaseModel } from '../shared/database.model';
import { SharedService } from 'shared/shared.service';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';
import { HypervisorBackupService } from 'hypervisor/backup/hypervisor-backup.service';
import { BaseApplicationModel } from 'applications/shared/base-application-model.model';

@Injectable()
export class ApplicationBackupService {

  private nodeAPI = 'ngp/application';

  constructor(private core: RestService, private node: NodeService) {
  }
  /**
   * Applies policies.
   * @param resources {Array<InstanceModel | DatabaseGroupModel | DatabaseModel>}
   * @param policies {Array<BaseModel>}
   * @returns {Observable<boolean>}
   */
  applyPolicies(resources: Array<any>, policies: Array<BaseModel>, subtype: string): Observable<boolean> {
    let me = this, payload = {
      subtype: subtype || '',
      version: '1.0',
      resources: me.getResourcesPayload(resources),
      slapolicies: me.getPoliciesPayload(policies)
    };
    return me.node.post(`${this.nodeAPI}?action=applySLAPolicies`,
      payload).map((response: Object) => {
      const res = SharedService.handleNodeResponse(response);
      return res && [200, 201].indexOf((<ResponseNodelModel>res).statusCode) !== -1;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Applies options.
   * @param resources {Array<InstanceModel | DatabaseGroupModel | DatabaseModel>}
   * @param options {Object}
   * @returns {Observable<boolean>}
   */
  applyOptions(resources: Array<any>, options: Object, subtype: string): Observable<boolean> {
    let me = this, payload = {
      resources: me.getResourcesPayload(resources),
      subtype: subtype || '',
      options: options
    };
    return me.node.post(`${this.nodeAPI}?action=applyOptions`,
      payload).map((response: Object) => {
      return !!response;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Rerun SLA policy/job.
   * @param resource {BaseApplicationModel}
   * @param subtype {String} oracle , sql , etc
   * @param slaName {string} optional
   * @returns {Observable<boolean>}
   */
  rerun(resource: BaseApplicationModel, subtype: string, slaName?: string): Observable<object> {
    let me = this;
    if (resource && typeof subtype === 'string') {
      return me.node.post(`${this.nodeAPI}?action=adhoc`,
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
    return me.node.post(`${this.nodeAPI}?action=adhoc`,
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

  getAppServerVms(url: string): Observable<any> {
    return this.core.getByUrl(url);
  }

  private getResourcesPayload(resources: Array<any>): Array<Object> {
    let result = [];
    resources.forEach(function (item) {
      result.push({
        href: item.getId(),
        id: item.id,
        metadataPath: item.metadataPath || ''
      });
    });
    return result;
  }

  private getPoliciesPayload(policies: Array<BaseModel>): Array<Object> {
    let result = [];
    policies.forEach(function (item) {
      result.push({
        href: item.getId(),
        id: item.id,
        name: item.name
      });
    });
    return result;
  }
}
