import { Injectable } from '@angular/core';
import { NodeService, RestService } from 'core';
import { RegistrationFormQuestion } from 'shared/form-question/form-question';
import { ApplicationRestoreItem } from './application-list-table/application-list-table.component';
import { Observable } from 'rxjs/Observable';
import { HttpErrorResponse } from '@angular/common/http';
import { FormDropdownQuestion } from 'shared/form-question/form-dropdown-question';
import { FormCheckboxQuestion } from 'shared/form-question/form-checkbox-question';
import { SharedService } from 'shared/shared.service';
import { SourceModel } from './node-restore-policy.model';
import { InstancesModel } from '../shared/instances.model';
import { Subject } from 'rxjs/Subject';
import * as _ from 'lodash';
import { SiteModel } from 'site/site.model';
import { FormTextQuestion } from 'shared/form-question/form-text-question';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ApplicationRestoreService {
  public static APPLICATION_QUERY_API: string = 'api/application/query';
  public static APPLICATION_JOB_CREATE_API: string = 'ngp/application?action=restore';
  public static iSCSIVal: string = 'iSCSI';
  public static fibreChannelVal: string = 'FC';
  public static DEVOP_VAL: string = 'devops';
  public static IA_VAL: string = 'IA';
  public static RESTORE_VAL: string = 'restore';
  public static SEED_VAL: string = 'seed';
  private static TENANT_USERNAME_SEARCH_API: string = '{0}api/application/search?applicationType={1}&from=hlo&pageSize=100&pageStartIndex=0';
  private static GET_APPLICATION_INSTANCE_OFFICE365: string = 'api/application/office365/instance?from=hlo'
  public restoreFiltersSub: Subject<string> = new Subject<string>();
  public getRestoreItemsSub: Subject<Array<ApplicationRestoreItem>> = new Subject<Array<ApplicationRestoreItem>>();
  public getSitesSub: Subject<Array<SiteModel>> = new Subject<Array<SiteModel>>();
  public filterInstancesSub: Subject<Array<ApplicationRestoreItem>> = new Subject<Array<ApplicationRestoreItem>>();

  private messageSource = new BehaviorSubject([]);
  currentMessage = this.messageSource.asObservable();

  constructor(private node: NodeService, private core: RestService) { }

  changeMessage(message: any) {
    this.messageSource.next(message)
  }

  public updateRestoreItems(items: Array<ApplicationRestoreItem>): void {
    this.getRestoreItemsSub.next(items);
  }

  public sendSites(sites: Array<SiteModel>): void {
    this.getSitesSub.next(sites);
  }

  public filterInstances(items: Array<ApplicationRestoreItem>): void {
    this.filterInstancesSub.next(items);
  }

  public filterRestore(value: string): void {
    this.restoreFiltersSub.next(value);
  }

  public getForm(applicationType?: string) {
    let formQuestions: RegistrationFormQuestion[];

    formQuestions = [
      new FormCheckboxQuestion({
        value: true,
        key: 'autocleanup',
        label: 'hypervisor.autoCleanupText'
      }),
      new FormCheckboxQuestion({
        value: applicationType === 'exch' ? false : true,
        key: 'allowsessoverwrite',
        label: 'application.textAllowSessionOverwrite'
      }),
      new FormCheckboxQuestion({
        value: true,
        key: 'continueonerror',
        label: 'application.textContinueWithRestore'
      })/*,
      new FormDropdownQuestion({
        value: 'enabled',
        key: 'makepermanent',
        label: 'application.textMakePermanent',
        options: [{
          label: 'application.textEnabled',
          value: 'enabled'
        }, {
          label: 'application.textDisabled',
          value: 'disabled'
        }, {
          label: 'application.textUser',
          value: 'user'
        }]
      })*/,
      // new FormDropdownQuestion({
      //   value: 'iSCSI',
      //   key: 'protocolpriority',
      //   label: 'hypervisor.protocolPriorityText',
      //   hidden: true,
      //   options: [{
      //     label: 'hypervisor.iSCSIText',
      //     value: 'iSCSI'
      //   }, {
      //     label: 'hypervisor.fibreChannelText',
      //     value: 'FC'
      //   }]
      // }),
      new FormTextQuestion({
        value: '',
        key: 'mountPathPrefix',
        label: 'application.textInstantAccessMountPoint',
        hidden: true,
        placeholder: (applicationType === 'oracle' || applicationType === 'db2') ? '/mnt/spp/' : (
          (applicationType === 'sql' || applicationType === 'exch') ? 'C:\\ProgramData\\SPP\\mnt\\' : ''
        ),
        type: 'text'
      })
    ];
    // if (applicationType === 'sql') {
    //   formQuestions.push(
    //   new FormDropdownQuestion({
    //     value: 'recovery',
    //     key: 'recoverymode',
    //     label: 'application.textRecoveryMode',
    //     options: [{
    //       label: 'application.textRecovery',
    //       value: 'recovery'
    //     }, {
    //       label: 'application.textNoRecovery',
    //       value: 'norecovery'
    //     }]
    //   }));
    // }

    return formQuestions;
  }

  public getDestinationPayload(view: string, destination: object, dbMappings: object,
    type: string, dbGroupDest: object, mode: string): object {
    let returnVal: object = {};

    returnVal = {
      target: destination
    };
    if (view && view === InstancesModel.DATABASE_GROUP_VIEW && mode === 'production') {
      returnVal['targetGroup'] = dbGroupDest;
    }
    if (!_.isEmpty(dbMappings) && type === ApplicationRestoreService.RESTORE_VAL) {
      returnVal['mapdatabase'] = dbMappings;
    }
    return returnVal;
  }

  public getOriginalDestinationPayload(dbMappings: object, type: string): object {
    let returnVal: object = {};
    if (!_.isEmpty(dbMappings) && type === ApplicationRestoreService.RESTORE_VAL) {
      returnVal = {
        mapdatabase: dbMappings
      };
    }
    return returnVal;
  }

  getSourcePayload(restoreItems: Array<ApplicationRestoreItem>, pitValue: any,
    disableVersion: boolean = false): Array<SourceModel> {
    let source = [];
    if (restoreItems && restoreItems.length > 0) {
      for (const item of restoreItems) {
        let sourceItem = new SourceModel();
        sourceItem.href = item.resource.url || '';
        sourceItem.metadata = {
          name: item.resource.name,
          osType: item.resource.osType,
          instanceVersion: item.instanceVersion,
          instanceId: item.instanceId,
          useLatest: item.version === undefined
        };
        sourceItem.resourceType = item.resource.resourceType || '';
        sourceItem.id = item.resource.id || '';
        sourceItem.include = true;
        sourceItem.pointInTime = typeof pitValue === 'number' ? pitValue : undefined;
        sourceItem.transactionId = typeof pitValue === 'string' ? pitValue : undefined;
        sourceItem.version = disableVersion ? null : item.version !== undefined ?
          {
            href: item.version.getLink('version').href,
            copy: {
              href: item.version.getId()
            },
            metadata: {
              useLatest: false,
              protectionTime: item.version.protectionTime
            }
          } :
          {
            href: item.resource.getUrl('latestversion'),
            metadata: {
              useLatest: true
            }
          };
        source.push(sourceItem);
      }
    }
    return source;
  }

  public createUpdateRestoreJob(payload: Object, editMode: boolean = false): Observable<any> {
    if (editMode) {
      return this.updateRestoreJob(payload);
    }
    return this.node.post(ApplicationRestoreService.APPLICATION_JOB_CREATE_API, payload)
      .catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  public updateRestoreJob(payload: Object): Observable<any> {
    let api: string = this.node.getBaseUrl() + ApplicationRestoreService.APPLICATION_JOB_CREATE_API;
    return this.node.putByUrl(api, payload).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  public getApplicationsForOffice365() {
    return this.core.getByUrl(this.core.getBaseUrl() + ApplicationRestoreService.GET_APPLICATION_INSTANCE_OFFICE365);
  }
  public getTenantUsernamesList(namePattern, providerID, applicationType) {
    let payload = {
      name: namePattern,
      resourceType: "folder",
      providerID: providerID
    }
    return this.core.postByUrl(SharedService.formatString(
      ApplicationRestoreService.TENANT_USERNAME_SEARCH_API, this.core.getBaseUrl(), applicationType), payload)
  }

}
