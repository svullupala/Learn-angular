import { Injectable } from '@angular/core';
import { JsonConvert } from 'json2typescript';
import { HttpErrorResponse } from '@angular/common/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';

import { RestService } from 'core';
import { VadpProxyMonitorModel } from './vadp-proxy-monitor.model';
import { SharedService } from 'shared/shared.service';
import { RegistrationFormQuestion } from 'shared/form-question/form-question';
import { FormTextQuestion } from 'shared/form-question/form-text-question';
import { VadpModel } from './vadp.model';
import { Subject } from 'rxjs/Subject';
import {NodeService} from 'core';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';

@Injectable()
export class VadpProxyMonitorService {
  public updateVadpsSub: Subject<Array<VadpModel>> = new Subject<Array<VadpModel>>();

  private api: string = 'api/vadp';
  private actionVadpApi = 'api/vadp?action={0}';
  private actionNodeVadpApi = 'ngp/vadp?action={0}';

  constructor(private rest: RestService, private node: NodeService) { }

  public getVMBackupProxies(pageStartIndex: number = 0) {
    return this.rest.getAll(this.api, undefined, null, RestService.pageSize, pageStartIndex)
      .map((res: Response) => {
        return JsonConvert.deserializeObject(res, VadpProxyMonitorModel);
      }).catch(this.handleError);
  }

  public unregisterProxy(item: VadpModel) {
    let id: string = item && String(item.id);
    if (id) {
      return this.rest.delete(this.api, id);
    }
  }

  public registerProxy(item: VadpModel) {
    let link: string = item && item.getUrl('register');
    if (link) {
      return this.rest.postByUrl(link, item.getRegisterVadpPayload());
    }
  }

  public getTasksInfo(item: VadpModel): Observable<VadpModel> {
    let link: string = item && item.getUrl('tasksinfo');
    if (link) {
      return this.rest.getByUrl(link).map((res) => {
        return JsonConvert.deserializeObject(res, VadpModel);
      });
    }
  }

  public doVadpAction(payload: object, action: string): Observable<any> {
    let api: string = action && SharedService.formatString(this.actionVadpApi, action);
    if (api && payload) {
      return this.rest.post(api, payload).catch(this.handleError);
    }
  }

  public doNodeVadpAction(payload: object, action: string): Observable<any> {
    let api: string = action && SharedService.formatString(this.actionNodeVadpApi, action);
    if (api && payload) {
      return this.node.post(api, payload).catch(this.handleError);
    }
  }

  public updateVadps(vadps: Array<VadpModel>): void {
    this.updateVadpsSub.next(vadps);
  }

  public getForm(): Array<RegistrationFormQuestion> {
    let formQuestions: RegistrationFormQuestion[];

    formQuestions = [
      new FormTextQuestion({
        required: true,
        value: '',
        key: 'hostAddress',
        label: 'hypervisor.textHostAddress'
      })
    ];
    return formQuestions;
  }

  public getProxyRegisterPayload(pushInstallPayload: object,
                                 siteId: string, identity: IdentityUserEnterSelectModel): object {
    return {
      pushinstall: pushInstallPayload,
      identityId: identity.useExisting
        ? identity.user.id
        : {username: identity.username, password: identity.password},
      registration: {
        siteId: siteId
      }
    };
  }

  private handleError(error: HttpErrorResponse) {
    console.error(error);
    return Observable.throw(error);
  }
}
