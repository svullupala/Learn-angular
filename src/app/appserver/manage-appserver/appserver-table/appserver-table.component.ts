import {Component, OnDestroy, OnInit, Input, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';

import {AppServerModel} from '../../appserver.model';
import {ManageAppServerService} from '../manage-appserver.service';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {SharedService} from 'shared/shared.service';
import {HttpErrorResponse} from '@angular/common/http';
import {LinkModel} from 'shared/models/link.model';
import {ConfigGroupsComponent} from 'shared/components/config-groups/config-groups.component';
import {ConfigGroupsTestTaskModel} from 'shared/models/config-groups.model';
import {MD5} from 'shared/util/md5';

@Component({
  selector: 'app-server-table',
  templateUrl: 'appserver-table.component.html',
  styleUrls: ['./appserver-table.component.scss']
})

export class AppServerTableComponent implements OnInit, OnDestroy {

  public error: ErrorHandlerComponent;
  public alert: AlertComponent;

  @Input() type: string;
  @ViewChild(ConfigGroupsComponent) configGroupsComponent: ConfigGroupsComponent;
  testResult: ConfigGroupsTestTaskModel;

  private hostAddressText: string;
  private nameText: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private unregistrationSucceedMsg: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private appServerList: AppServerModel[] = [];
  private updateAppserversSubscription: Subscription;
  private unregisterAppserverSubscription: Subscription;
  private translateSub: Subscription;
  private textTestResultTpl: string;
  private masked: boolean = false;
  private testAborted: boolean = false;

  constructor(private manageAppserversService: ManageAppServerService,
              private translate: TranslateService) {}

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  ngOnInit() {
    this.updateAppserversSubscription = this.manageAppserversService.
    updateAppserversSubject.subscribe(
      (appServers: AppServerModel[]) => this.appServerList = appServers
    );
    this.translateSub = this.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'scripts.textScriptServerName',
      'application.hostAddressText',
      'application.registrationSucceedMsg',
      'application.textConfirmUnregister',
      'application.unregistrationSucceedMsg',
      'application.textName',
      'application.textTestResultTpl'
    ])
      .subscribe((resource: Object) => {
        this.infoTitle = resource['common.infoTitle'];
        this.processingRequestMsg = resource['common.processingRequestMsg'];
        this.textConfirm = resource['common.textConfirm'];
        this.nameText = resource['application.textName'];
        this.hostAddressText =
          this.type === 'script' ? resource['scripts.textScriptServerName'] : resource['application.hostAddressText'];
        this.textConfirmUnregister = resource['application.textConfirmUnregister'];
        this.registrationSucceedMsg = resource['application.registrationSucceedMsg'];
        this.unregistrationSucceedMsg = resource['application.unregistrationSucceedMsg'];
        this.textTestResultTpl = resource['application.textTestResultTpl'];
      });
    this.error = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  ngOnDestroy() {
    this.updateAppserversSubscription.unsubscribe();
    this.translateSub.unsubscribe();
    if (this.unregisterAppserverSubscription) {
      this.unregisterAppserverSubscription.unsubscribe();
    }
  }

  onUnregisterAppserver(appServer: AppServerModel) {
    let me = this;
    this.alert.show(this.textConfirm, SharedService.formatString(me.textConfirmUnregister, appServer.name),
      AlertType.UNREGISTER, () => {
      me.unregisterAppserverSubscription = this.manageAppserversService.unregisterAppserver(appServer, this.type).subscribe(
        (res: Object) => {
          this.alert.hide();
          this.alert.show(this.infoTitle, this.unregistrationSucceedMsg);
          this.manageAppserversService.refreshAppservers();
        },
        (error: HttpErrorResponse) => {
          this.alert.hide();
          this.error.handle(error);
        }
      );
    });
  }

  onEditAppserver(appServer: AppServerModel) {
    this.manageAppserversService.editAppserver(appServer);
  }

  onRefresh(): void {
    this.manageAppserversService.refreshAppservers();
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.error)
      me.error.handle(err, node);
  }

  private onExecuteAction(item: AppServerModel, link: LinkModel): void {
    this.doAction(item, link.name);
  }

  private refreshDisplayFields(target: AppServerModel, updated: AppServerModel): void {
    target.name = updated.name;
    target.hostAddress = updated.hostAddress;
    target.links = updated.links;
  }

  private getActionPayload(name: string): Object {
    return name === 'test' ? { type: this.type === 'script' ? this.type : 'application'} : {};
  }

  private onAbortTestClick(): void {
    this.testAborted = true;
    this.unmask();
    this.alert.hide();
  }

  private presentTestResult(item: AppServerModel, result: ConfigGroupsTestTaskModel): void {
    if (this.configGroupsComponent) {
      this.testResult = result;
      this.alert.show(SharedService.formatString(this.textTestResultTpl, item.hostAddress),
        this.configGroupsComponent.template, AlertType.TEMPLATE, undefined, undefined,
        0, !result.testsComplete);
    }
  }

  private waitTestComplete(item: AppServerModel, task: ConfigGroupsTestTaskModel,
                           delay: number,
                           mask?: boolean): void {
    let me = this, observable: Observable<ConfigGroupsTestTaskModel>;

    if (me.testAborted) {
      me.unmask();
      return;
    }

    if (mask)
      me.mask();

    me.presentTestResult(item, task);

    observable = task.query();
    if (observable)
      observable.delay(delay).subscribe(
        record => {
          if (!record.testsComplete)
            me.waitTestComplete(item, record, 5000, false);
          else {
            me.unmask();
            if (!me.testAborted)
              me.presentTestResult(item, record);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
    else {
      me.unmask();
    }
  }

  private doAction(item: AppServerModel, name: string): void {
    let me = this, payload = me.getActionPayload(name), demo = false,
      observable: Observable<ConfigGroupsTestTaskModel | AppServerModel> = (name === 'test') ?
        item.doAction<ConfigGroupsTestTaskModel>(ConfigGroupsTestTaskModel, name, payload,
          me.manageAppserversService.proxy) :
        item.doAction<AppServerModel>(AppServerModel, name, payload, me.manageAppserversService.proxy);
    if (observable) {
      me.mask();
      observable.subscribe(
        record => {
          if (record) {
            me.unmask();
            if (name === 'test') {
              me.testAborted = false;
              me.waitTestComplete(item, <ConfigGroupsTestTaskModel>record, 500, true);
            } else
              me.refreshDisplayFields(item, <AppServerModel>record);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private getDropDownActionId(item: AppServerModel): string {
    return 'app-server-table-dropdown-action-' + MD5.encode(item.getId());
  }
}
