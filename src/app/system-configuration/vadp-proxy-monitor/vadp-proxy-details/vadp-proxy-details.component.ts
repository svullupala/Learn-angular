import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { VadpModel } from '../vadp.model';
import { Subject } from 'rxjs/Subject';
import { HttpErrorResponse } from '@angular/common/http';
import { LinkModel } from 'shared/models/link.model';
import { isObject } from 'util';
import { VadpParameterModel, VadpParameterNvPairModel } from '../vadp-parameter.model';
import { VadpSchemaModel } from '../vadp-schema.model';
import { ErrorModel } from 'shared/models/error.model';
import { SharedService } from 'shared/shared.service';
import { VadpProxyMonitorService } from '../vadp-proxy-monitor.service';
import { RestService } from 'core';
import { AlertType } from 'shared/components';
import { AlertComponent } from 'shared/components/msgbox/alert.component';
import { SessionService } from 'core';
import { Observable } from 'rxjs/Observable';
import { SiteModel } from '../../site/site.model';
import { VadpActionSchemaComponent } from '../vadp-action-schema';
import { IdentityUserModel } from 'identity/shared/identity-user.model';
import {IdentityUsersModel} from 'identity/shared/identity-users.model';
import {SorterModel} from 'shared/models/sorter.model';

@Component({
  selector: 'vadp-proxy-details',
  templateUrl: './vadp-proxy-details.component.html',
  styleUrls: ['./vadp-proxy-details.component.scss']
})

export class VadpProxyDetailsComponent implements OnInit, OnDestroy {
  @Input() vadp: VadpModel;
  @Input() sites: Array<SiteModel> = [];
  @Output() executeAction: EventEmitter<void> = new EventEmitter<void>();
  @Output() onError: EventEmitter<HttpErrorResponse | ErrorModel> = new EventEmitter<HttpErrorResponse>();
  @ViewChild(VadpActionSchemaComponent) vadpSchemaModel: VadpActionSchemaComponent;

  public alert: AlertComponent;
  private identities: Array<IdentityUserModel> = [];
  private subs: Subject<void> = new Subject<void>();
  private vadpSchema: VadpSchemaModel;
  private pendingItem: { model: VadpModel, action: string };
  private errorTitle: string;
  private textSchemaError: string;
  private textActionLabel: string;
  private textActionOptions: string;
  private textSetOptions: string;
  private textSite: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private textSelectUser: string;
  private textConfirmSuspend: string;
  private textPassword: string;
  private textUsername: string;
  private textPushUpdate: string;
  private textPushUpdateTpl: string;

  constructor(private translate: TranslateService,
              private rest: RestService,
              private vadpService: VadpProxyMonitorService) { }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.errorTitle',
      'common.textConfirm',
      'common.textUsername',
      'common.textPassword',
      'vadpProxyMonitor.textConfirmUnregister',
      'vadpProxyMonitor.textConfirmSuspend',
      'vadpProxyMonitor.textSchemaError',
      'vadpProxyMonitor.textSite',
      'vadpProxyMonitor.textSetOptions',
      'vadpProxyMonitor.textSelectUser',
      'vadpProxyMonitor.textPushUpdate',
      'vadpProxyMonitor.textPushUpdateTpl']).takeUntil(this.subs)
      .subscribe((resource: Object) => {
        me.errorTitle = resource['common.errorTitle'];
        me.textSchemaError = resource['vadpProxyMonitor.textSchemaError'];
        me.textSetOptions = resource['vadpProxyMonitor.textSetOptions'];
        me.textSite = resource['vadpProxyMonitor.textSite'];
        me.textSelectUser = resource['vadpProxyMonitor.textSelectUser'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmUnregister = resource['vadpProxyMonitor.textConfirmUnregister'];
        me.textConfirmSuspend = resource['vadpProxyMonitor.textConfirmSuspend'];
        me.textUsername = resource['common.textUsername'];
        me.textPassword = resource['common.textPassword'];
        me.textPushUpdate = resource['vadpProxyMonitor.textPushUpdate'];
        me.textPushUpdateTpl = resource['vadpProxyMonitor.textPushUpdateTpl'];
      });

    this.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  public onExecuteAction(item: VadpModel, link: LinkModel): void {
    let me = this, schemaName = this.getActionSchemaName(item, link);
    if (schemaName) {
      me.reloadIdentities(() => {
        me.loadActionSchema(link.name, schemaName, item);
      });
    } else {
      this.doAction(item, link.name);
    }
  }

  public onExecuteUpgrade(item: VadpModel): void {
    let me = this;
    me.reloadIdentities(() => {
      me.loadUpgradeSchema(item);
    });
  }

  public onUnregisterVadpProxy(item: VadpModel): void {
    const me = this;
    me.confirm(this.textConfirmUnregister, function() {
        me.vadpService.unregisterProxy(item).takeUntil(me.subs)
          .subscribe(
            res => me.executeAction.emit(),
            err => me.onError.emit(err)
          );
      }
    );
  }

  private confirm(msg: string, handler: Function) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.textConfirm, msg, AlertType.CONFIRMATION, handler);
    }
  }

  private getActionSchemaName(item: VadpModel, link: LinkModel): string {
    return (link.name === 'proxyoptions' && item.hasLink('options')) ? 'options' : undefined;
  }

  private newSiteVadpParameter(item: VadpModel): VadpParameterModel {
    let me = this, sites = me.sites || [], model = new VadpParameterModel();
    model.name = 'siteId';
    model.promptText = me.textSite;
    model.type = 'list';
    model.required = false;
    model.allowMultipleValues = false;
    model.values = [];
    sites.forEach(function (site) {
      model.values.push(new VadpParameterNvPairModel(site.name, site.id));
    });
    model.selectedValue = item.siteId;
    return model;
  }

  private newIdentityVadpParameter(item: VadpModel): VadpParameterModel {
    let me = this, identities = me.identities || [], model = new VadpParameterModel();
    model.name = 'identityId';
    model.promptText = me.textSelectUser;
    model.type = 'list';
    model.required = false;
    model.allowMultipleValues = false;
    model.values = [];
    identities.forEach((identity) => {
      model.values.push(new VadpParameterNvPairModel(identity.name, identity.id));
    });
    model.selectedValue = item.identityId;
    return model;
  }

  // private newCredentialVadpParameters(item: VadpModel): VadpParameterModel[] {
  //   let me = this, sites = me.sites || [], result: VadpParameterModel[] = [],
  //     model = new VadpParameterModel();
  //   model.name = 'username';
  //   model.promptText = me.textUsername;
  //   model.type = 'string';
  //   model.required = true;
  //   model.allowMultipleValues = false;
  //   result.push(model);
  //
  //   model = new VadpParameterModel();
  //   model.name = 'password';
  //   model.promptText = me.textPassword;
  //   model.type = 'string';
  //   model.required = true;
  //   model.allowMultipleValues = false;
  //   model.password = true;
  //   result.push(model);
  //   return result;
  // }

  private loadActionSchema(actionName: string, schemaName: string, item: VadpModel): void {
    let me = this,
      observable = item.getActionSchema(schemaName, me.rest);
    if (observable) {
      observable.takeUntil(this.subs).subscribe(
        record => {
          let link = item.getLink('self');
          if (record) {
            record.options = [me.newSiteVadpParameter(item),
              me.newIdentityVadpParameter(item)].concat(record.options || []);
            me.vadpSchema = record;
            me.pendingItem = {
              model: item,
              action: (actionName === 'proxyoptions' ? (link ? link.name : schemaName) : actionName)
            };
            me.textActionLabel = undefined;
            me.textActionOptions = actionName === 'proxyoptions' ? me.textSetOptions : undefined;
            me.vadpSchemaModel.setModel(me.vadpSchema);
            me.vadpSchemaModel.initParams();
            me.vadpSchemaModel.show();
          } else {
            // Emit application error.
            me.onError.emit(new ErrorModel(me.errorTitle,
              SharedService.formatString(me.textSchemaError, item.hostName || item.ipAddr)));
          }
        },
        err => me.onError.emit(err)
      );
    }
  }

  private loadUpgradeSchema(item: VadpModel): void {
    let me = this, link = item.getLink('pushUpdate'),
      record = new VadpSchemaModel();
    record.options = [me.newIdentityVadpParameter(item)];
    me.vadpSchema = record;
    me.pendingItem = {
      model: item,
      action: (link ? link.name : '')
    };
    me.textActionLabel = me.textPushUpdate;
    me.textActionOptions = SharedService.formatString(me.textPushUpdateTpl,
      item.ipAddr || item.hostName);
    me.vadpSchemaModel.setModel(me.vadpSchema);
    me.vadpSchemaModel.initParams();
    me.vadpSchemaModel.show();
  }

  private doAction(item: VadpModel, name: string, params?: Array<VadpParameterModel>, putMethod?: boolean): void {
    let me = this, payload = me.getActionPayload(item, name, params), observable;

    if (putMethod) {
      observable = item.putAction<VadpModel>(VadpModel, name, payload, me.rest);
      me.onAfterDoAction(observable);
    } else {
      if (name === 'suspend') {
        me.confirm(this.textConfirmSuspend, function () {
          observable = item.postAction<VadpModel>(VadpModel, name, payload, me.rest);
          me.onAfterDoAction(observable);
        });
      } else if (name === 'pushUpdate') {
        observable = item.pushUpdate(payload, me.rest);
        me.onAfterDoAction(observable);
      } else {
        observable = item.postAction<VadpModel>(VadpModel, name, payload, me.rest);
        me.onAfterDoAction(observable);
      }
    }
  }

  private onAfterDoAction(observable: Observable<any>, name?: string) {
    let me = this;
    me.mask();
    observable.takeUntil(me.subs).subscribe(
      updated => {
        me.unmask();
        me.executeAction.emit();
      },
      err => {
        me.unmask();
        me.onError.emit(err);
      }
    );
  }

  private getActionPayload(vdap: VadpModel, name: string, params?: Array<VadpParameterModel>): Object {
    let payload, isPushUpdate = name === 'pushUpdate';
    if (params) {
      payload = isPushUpdate ? {
        hostAddress: vdap.ipAddr
      } : {options: {options: []}};

      params.forEach(function (item) {
        let entryVal, values = [];
        if (item.allowMultipleValues) {
          (item.value || []).forEach(function (value: VadpParameterNvPairModel | any) {
            if (value instanceof VadpParameterNvPairModel)
              values.push(value.value);
            else
              values.push(value);
          });
          entryVal = values;
        } else {
          entryVal = isObject(item.value) ? item.value.value : item.value;
        }
        if (isPushUpdate) {
          payload[item.key] = entryVal;
        } else { // Is Set Options.
          if (item.key === 'siteId')
            payload.siteId = entryVal;
          else if (item.key === 'identityId')
            payload.identityId = entryVal;
          else {
            payload.options.options.push({
              name: item.key,
              selectedValue: entryVal
            });
          }
        }
      });
    }
    return payload;
  }

  private onVadpSave(params: Array<VadpParameterModel>): void {
    let me = this, item = me.pendingItem;
    if (item) {
      me.doAction(item.model, item.action, params, item.action !== 'pushUpdate');
      me.resetSchemaRelated();
    }
  }

  private resetSchemaRelated(): void {
    this.vadpSchema = undefined;
    this.pendingItem = undefined;
  }

  private onAbort(): void {
    this.resetSchemaRelated();
  }

  private mask(title: string = '', message: string = '', alertType: string = 'MASK') {
    let me = this;
    if (me.alert) {
      me.alert.show(title, message, AlertType[alertType]);
    }
  }

  private unmask() {
    let me = this;
    if (me.alert)
      me.alert.hide();
  }

  private reloadIdentities(callback: Function): void {
    let me = this, observable: Observable<IdentityUsersModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];
    me.mask();
    observable = IdentityUsersModel.retrieve<IdentityUserModel, IdentityUsersModel>(IdentityUsersModel, me.rest,
      undefined, sorters, 0, 0);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.identities = dataset.records;
          me.unmask();
          callback.call(me);
        },
        err => {
          me.unmask();
          me.onError.emit(err);
        }
      );
    } else {
      me.mask();
    }
  }
}
