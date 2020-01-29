import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {RestService} from 'core';
import {Subject} from 'rxjs/Subject';
import {JsonConvert} from 'json2typescript';
import {RegistrationFormQuestion} from 'shared/form-question/form-question';
import {FormCheckboxQuestion} from 'shared/form-question/form-checkbox-question';
import {BreadcrumbModel} from 'shared/models/breadcrumb.model';
import {RestoreItem} from './restore-item.model';
import {NodeService} from 'core';
import {Observable} from 'rxjs/Observable';
import { SiteModel } from 'site/site.model';
import { HostUserModel } from './host-cluster-table/host-cluster-table.component';
import {FormTextQuestion} from 'shared/form-question/form-text-question';
import {HypervisorRestoreOptionsModel} from 'hypervisor/shared/hypervisor-restore-options.model';
import { JobModel } from 'job/shared/job.model';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class HypervisorRestoreService {

  public static HYPERVISOR_QUERY_API: string = 'api/hypervisor/query';
  public static HYPERVISOR_JOB_CREATE_API: string = 'ngp/hypervisor?action=restore';
  public static iSCSIVal: string = 'iSCSI';
  public static fibreChannelVal: string = 'FC';
  public static IA_VAL: string = 'IA';
  public static IV_VAL: string = 'IV';
  public static LDIV_VAL: string = 'LDIV';
  public static RESTORE_VAL: string = 'restore';
  public restoreFiltersSub: Subject<string> = new Subject<string>();
  public updateSub = new Subject<any>();
  public updateDestinationHostClusterSub = new BehaviorSubject<any>('');
  public updateDestinationEsxHostSub: Subject<any> = new BehaviorSubject<any>('');
  public getSitesSub: Subject<Array<SiteModel>> = new Subject<Array<SiteModel>>();
  public breadcrumbs: BreadcrumbModel[] = [];

  constructor(private node: NodeService, private core: RestService) {}

  get proxy(): RestService {
    return this.core;
  }

  public update(records: any): void {
    this.updateSub.next(records);
  }

  public updateDestinationHostClusterSelection(selection: any): void {
    this.updateDestinationHostClusterSub.next(selection);
  }

  public updateDestinationEsxSelection(selection: HostUserModel): void {
    this.updateDestinationEsxHostSub.next(selection);
  }

  public sendSites(sites: Array<SiteModel>): void {
    this.getSitesSub.next(sites);
  }

  public filterRestore(value: string): void {
    this.restoreFiltersSub.next(value);
  }

  public getIAForm(isHyperV?: boolean, model?: HypervisorRestoreOptionsModel,
                   restoreType?: string, disableAWS?: boolean) {
    let formQuestions: RegistrationFormQuestion[];

    formQuestions = [
      // new FormDropdownQuestion({
      //   value: 'iSCSI',
      //   key: 'protocolpriority',
      //   label: 'hypervisor.protocolPriorityText',
      //   options: [{
      //     label: 'hypervisor.iSCSIText',
      //     value: 'iSCSI'
      //   }, {
      //     label: 'hypervisor.fibreChannelText',
      //     value: 'FC'
      //   }]
      // }),
      new FormCheckboxQuestion({
          value: model ? model.IR : false,
          key: 'IR',
          label: 'hypervisor.iaPermanentText'
      }),
      new FormCheckboxQuestion({
          value: model ? model.continueonerror : false,
          key: 'continueonerror',
          label: 'hypervisor.continueOnSourceText'
      }),
      new FormCheckboxQuestion({
          value: model ? model.autocleanup : true,
          key: 'autocleanup',
          label: 'hypervisor.autoCleanupText'
      }),
      new FormCheckboxQuestion({
          value: model ? model.allowsessoverwrite : true,
          key: 'allowsessoverwrite',
          label: 'hypervisor.allowOverwriteText'
      // }),
      // new FormTextQuestion({
      //   value: model ? model.vmNameSuffix : '',
      //   key: 'vmNameSuffix',
      //   label: 'hypervisor.textVmNameSuffix',
      //   type: 'text'
      // }),
      // new FormTextQuestion({
      //   value: model ? model.vmNamePrefix : '',
      //   key: 'vmNamePrefix',
      //   label: 'hypervisor.textVmNamePrefix',
      //   type: 'text'
      })
    ];
    if (!isHyperV) {
      formQuestions.push(
        new FormCheckboxQuestion({
          value: model ? model.streaming : restoreType !== 'test',
          key: 'streaming',
          label: 'hypervisor.textStreaming',
          disabled: restoreType === 'test' || disableAWS
        })
      );
    }
    return formQuestions;
  }

  public getIVForm(isHyperV?: boolean, model?: HypervisorRestoreOptionsModel,
                   restoreType?: string, disableAWS?: boolean) {
    let formQuestions: RegistrationFormQuestion[];

    formQuestions = [
      // new FormDropdownQuestion({
      //   value: 'iSCSI',
      //   key: 'protocolpriority',
      //   label: 'hypervisor.protocolPriorityText',
      //   options: [{
      //     label: 'hypervisor.iSCSIText',
      //     value: 'iSCSI'
      //   }, {
      //     label: 'hypervisor.fibreChannelText',
      //     value: 'FC'
      //   }]
      // }),
      new FormCheckboxQuestion({
        value: model ? model.poweron : false,
        key: 'poweron',
        label: 'hypervisor.powerOnText'
      }),
      new FormCheckboxQuestion({
        value: model ? model.allowvmoverwrite : false,
        key: 'allowvmoverwrite',
        label: 'hypervisor.overwriteVM'
      }),
      new FormCheckboxQuestion({
        value: model ? model.continueonerror : true,
        key: 'continueonerror',
        label: 'hypervisor.continueOnSourceText'
      }),
      new FormCheckboxQuestion({
        value: model ? model.autocleanup : true,
        key: 'autocleanup',
        label: 'hypervisor.autoCleanupText'
      }),
      new FormCheckboxQuestion({
        value: model ? model.allowsessoverwrite : true,
        key: 'allowsessoverwrite',
        label: 'hypervisor.allowOverwriteText'
      })
    ];
    if (!isHyperV) {
      formQuestions.push(
        new FormCheckboxQuestion({
          value: model ? model.restorevmtag : true,
          key: 'restorevmtag',
          label: 'hypervisor.textRestoreVmTag'
        })
      );
      formQuestions.push(
        new FormCheckboxQuestion({
          value: model ? model.streaming : restoreType !== 'test',
          key: 'streaming',
          label: 'hypervisor.textStreaming',
          disabled: restoreType === 'test' || disableAWS
        })
      );
    }
    if (restoreType !== 'recovery'){
      formQuestions.push(
        new FormTextQuestion({
          value: model ? model.vmNameSuffix : '',
          key: 'vmNameSuffix',
          label: 'hypervisor.textVmNameSuffix',
          type: 'text'
        }),
        new FormTextQuestion({
          value: model ? model.vmNamePrefix : '',
          key: 'vmNamePrefix',
          label: 'hypervisor.textVmNamePrefix',
          type: 'text'
        })
      );
    }
    return formQuestions;
  }

  getDefaultOptionsForm(workflowType: string, isHyperV?: boolean): RegistrationFormQuestion[] {
    let formValues: RegistrationFormQuestion[];
    if (workflowType !== HypervisorRestoreService.IA_VAL) {
      formValues = this.getIVForm(isHyperV);
    } else {
      formValues = this.getIAForm();
    }
    return formValues;
  }

  getOptionsForm(model: HypervisorRestoreOptionsModel,
                 workflowType: string, isHyperV?: boolean,
                 restoreType?: string, disableAWS?: boolean): RegistrationFormQuestion[] {
    let formValues: RegistrationFormQuestion[];
    if (workflowType !== HypervisorRestoreService.IA_VAL) {
      formValues = this.getIVForm(isHyperV, model, restoreType, disableAWS);
    } else {
      formValues = this.getIAForm(isHyperV, model, restoreType, disableAWS);
    }
    return formValues;
  }

  getDefaultOptionsModel(workflowType: string, isHyperV?: boolean): HypervisorRestoreOptionsModel {
    let model = new HypervisorRestoreOptionsModel();
    if (workflowType !== HypervisorRestoreService.IA_VAL) {
      model.restorevmtag = !isHyperV ? true : undefined;
    } else {
      model.IR = false;
    }
    return model;
  }

  getSourcePayload(restoreItems: Array<RestoreItem>, useLatest: string): Array<any> {
    let source = [];
    if (restoreItems && restoreItems.length > 0) {
      for (const item of restoreItems) {
        let sourceItem = {
          href: item.resource.url || '',
          metadata: {
            name: item.resource.name
          },
          resourceType: item.resource.resourceType || '',
          id: item.resource.id || '',
          include: true,
          version: item.snapshot !== undefined ?
            {
              href: item.snapshot.getLink('version').href,
              copy: {
                href: item.snapshot.getId()
              },
              metadata: {
                useLatest: false,
                protectionTime: item.snapshot.protectionTime
              }
            } :
            {
              href: item.resource.getUrl('latestversion'),
              metadata: {
                useLatest: true,
                name: useLatest
              }
            }
        };
        source.push(sourceItem);
      }
    }
    return source;
  }

  getDefaultPayload(workflowType: string,
                    subType: string,
                    restoreItems: Array<RestoreItem>,
                    useLatest: string,
                    isSpp: boolean = false, siteObj?: object) {
    if (workflowType && subType && restoreItems) {
      if (workflowType === 'IA') {
        return this.getDefaultIAPayload(subType, restoreItems, useLatest, siteObj);
      }
      return this.getDefaultIVPayload(subType, restoreItems, useLatest, isSpp, siteObj);
    }
  }

  getDefaultIAPayload(subType: string, restoreItems: Array<RestoreItem>,
                      useLatest: string, siteObj: object) {
    let payload,
      source = this.getSourcePayload(restoreItems, useLatest);

    payload = {

      subType: subType || '',
      spec: {
        source: source,
        subpolicy: [{
          type: 'IA',
          destination: {},
          source: siteObj,
          option: {
            protocolpriority: 'iSCSI',
            IR: false,
            continueonerror: false,
            autocleanup: true,
            allowsessoverwrite: true
          }
        }]
      },
      script: {}
    };
    return payload;
  }

  getDefaultIVPayload(subType: string, restoreItems: Array<RestoreItem>,
                      useLatest: string, isSpp: boolean = false, siteObj: object) {
    let payload,
      source = this.getSourcePayload(restoreItems, useLatest);

    payload = {
      subType: subType || '',
      spec: {
        source: source,
        subpolicy: [{
          type: 'IV',
          destination: {systemDefined: true},
          source: siteObj,
          option: {
            protocolpriority: 'iSCSI',
            poweron: false,
            continueonerror: true,
            autocleanup: true,
            allowsessoverwrite: true,
            mode: isSpp ? 'clone' : 'test',
            vmscripts: false,
            restorevmtag: true,
            update_vmx: true
          }
        }]
      },
      script: {}
    };
    return payload;
  }

  getIVPayload(workflowType: string, subType: string, restoreItems: Array<RestoreItem>, destination: Object,
               mapvirtualnetwork: Object, mapRRPdatastore: Object, mapsubnet: Object,
               vmfolderpath: string, options: Object, scripts: object,
               useLatest: string, siteObj: object, alternateVsnap: object): any {
    let payload,
      source = this.getSourcePayload(restoreItems, useLatest);

    payload = {
      subType: subType || '',
      spec: {
        source: source,
        subpolicy: [{
          type: workflowType || 'IV',
          destination: destination || {},
          source: siteObj,
          option: options || {}
        }]
      },
      script: scripts || {}
    };
    payload.spec.subpolicy[0].destination.mapvirtualnetwork = mapvirtualnetwork || {};
    payload.spec.subpolicy[0].destination.mapRRPdatastore = mapRRPdatastore || {};
    payload.spec.subpolicy[0].destination.mapsubnet = mapsubnet || {};
    if (vmfolderpath !== undefined) {
      payload.spec.subpolicy[0].destination.vmfolderpath = vmfolderpath || '';
    }
    if (alternateVsnap !== undefined) {
      payload.spec.subpolicy[0].destination.storageserver = alternateVsnap || '';
    }
    return payload;
  }

  getIAPayload(subType: string, restoreItems: Array<RestoreItem>, destination: Object,
               mapvdisk: Object, options: Object, scripts: object,
               useLatest: string, siteObj: object, alternateVsnap: object): any {
    let payload,
      source = this.getSourcePayload(restoreItems, useLatest);

    payload = {
      subType: subType || '',
      spec: {
        source: source,
        subpolicy: [{
          type: 'IA',
          destination: destination || {},
          source: siteObj,
          option: options || {}
        }]
      },
      script: scripts || {}
    };
    if (mapvdisk) {
      payload.spec.subpolicy[0].destination.mapvdisk = mapvdisk;
    }
    if (alternateVsnap !== undefined) {
      payload.spec.subpolicy[0].destination.storageserver = alternateVsnap || '';
    }
    return payload;
  }

  setPayloadFromPolicySpec(policy: JobModel): any {
    let payload;
    if (policy && policy instanceof JobModel) {
      payload = {
        subType: policy.subType,
        name: policy.name,
        spec: policy.spec
      };
    }
    return payload;
  }

  addSchedule(payload: any, name: string, trigger: Object): any {
    let newPayload = payload || {};
    if (newPayload && name && trigger) {
      newPayload.name = name;
      newPayload.trigger = trigger || {};
      return newPayload;
    }
  }

  createRestoreJob(payload: Object): Observable<any> {
    return this.node.post(HypervisorRestoreService.HYPERVISOR_JOB_CREATE_API, payload);
  }

  updateRestoreJob(payload: Object): Observable<any> {
    let api: string = this.node.getBaseUrl() + HypervisorRestoreService.HYPERVISOR_JOB_CREATE_API;
    return this.node.putByUrl(api, payload);
  }

  /**
   * Querys and gets a list of items with certain association.
   *
   * @param resources {Array<any>} Array of resources.
   * @param resourceType {string} resource type.
   * @returns {Observable<Array<any>>}
   */
  queryAssociatedWith(resources: Array<RestoreItem>, resourceType: string): Observable<any> {
    let payload = {},
        hrefArr: Array<string> = [];
    if (resources && resources.length > 0 && resourceType) {
      for (let i = 0; i < resources.length; i++) {
        let href: string = resources[i].snapshot !== undefined ? resources[i].snapshot.url
          : resources[i].resource.getUrl('latestversion');
        hrefArr.push(href);
      }
      payload = {
        associatedWith: hrefArr,
        resourceType: resourceType
      };
      return this.core.post(HypervisorRestoreService.HYPERVISOR_QUERY_API, payload)
        .catch((error: HttpErrorResponse) => Observable.throw(error));
    }
  }
}
