import { Component, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { RestService, SessionService } from 'core';
import { VadpProxyMonitorService } from './vadp-proxy-monitor.service';
import { Subject } from 'rxjs/Subject';
import { VadpProxyMonitorModel } from './vadp-proxy-monitor.model';
import { RegistrationFormQuestion } from 'shared/form-question/form-question';
import { BasicDynamicForm } from 'shared/basic-dynamic-form/basic-dynamic-form.component';
import { VadpModel } from './vadp.model';
import { AlertComponent, AlertType } from 'shared/components/msgbox/alert.component';
import { ErrorModel } from 'shared/models/error.model';
import { SharedService } from 'shared/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { VadpTaskInfoComponent } from './vadp-task-info/vadp-task-info.component';
import { JsonConvert } from 'json2typescript';
import { IconStringPair } from 'shared/components/base-details-component/base-details.component';
import { VadpProxyStatusTableComponent } from './vadp-status-table/vadp-proxy-status-table.component';
import { SitesModel } from '../site/sites.model';
import { SiteModel } from '../site/site.model';
import { SiteService } from '../site/site.service';
import { LinkModel } from 'shared/models/link.model';
import { VadpProxyDetailsComponent } from './vadp-proxy-details/vadp-proxy-details.component';
import { IdentityUserEnterSelectComponent } from 'identity/shared/identity-user-enter-select';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';

@Component({
  selector: 'vadp-proxy-monitor',
  styleUrls: ['./vadp-proxy-monitor.scss'],
  templateUrl: './vadp-proxy-monitor.component.html',
  providers: [SiteService]
})
export class VadpProxyMonitorComponent implements OnDestroy, OnInit {
  @ViewChild(BasicDynamicForm) form: BasicDynamicForm;
  @ViewChild(IdentityUserEnterSelectComponent) identityComponent: IdentityUserEnterSelectComponent;
  @ViewChild(VadpTaskInfoComponent) vadpTaskComponent: VadpTaskInfoComponent;
  @ViewChild(VadpProxyStatusTableComponent) vadpTable: VadpProxyStatusTableComponent;
  @ViewChild(VadpProxyDetailsComponent) vadpDetailsComponent: VadpProxyDetailsComponent;

  canPushInstall: boolean = false;

  public alert: AlertComponent;
  private sites: Array<SiteModel> = [];
  private siteId: string;
  private defaultSite: SiteModel;
  private tableMask: boolean = false;
  private registerProxy: boolean = false;
  private enableProxy: boolean = false;
  private vadpData: VadpProxyMonitorModel;
  private identityModel: IdentityUserEnterSelectModel;
  private vadpWithTaskInfo: VadpModel;
  private vadpsArr: Array<VadpModel>;
  private formValues: Array<RegistrationFormQuestion>;
  private errorHandler: ErrorHandlerComponent;
  private subs: Subject<void> = new Subject<void>();
  private canRegister: boolean = false;
  private iconList: Array<IconStringPair> = [];
  private textConfirmation: string;
  private textConfirmationDetails: string;

  constructor(private translate: TranslateService,
    private rest: RestService,
    private siteService: SiteService,
    private vadpService: VadpProxyMonitorService) {
  }

  ngOnInit() {
    this.translate.get([
      'common.textConfirm',
      'vadpProxyMonitor.textInstallConfirmation'])
      .subscribe((resource: Object) => {
        this.textConfirmation = resource['common.textConfirm'];
        this.textConfirmationDetails = resource['vadpProxyMonitor.textInstallConfirmation'];
      });
    this.identityModel = new IdentityUserEnterSelectModel();
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.formValues = this.vadpService.getForm();
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.iconList = [new IconStringPair('', 'vadpProxyMonitor.textVadpSelectDetails')];
    this.siteService.getAll(undefined, true).takeUntil(this.subs).subscribe(
      (res) => {
        let sitesDataset: SitesModel = JsonConvert.deserializeObject(res, SitesModel);
        this.sites = sitesDataset.sites;
        this.defaultSite = this.sites.find((site: SiteModel) => {
          return site.defaultSite === true;
        });
        this.siteId = this.defaultSite.id;
      },
      (err) => this.handleError(err)
    );
    this.getRecords();
  }

  getRecords(): void {
    this.maskTable();
    this.vadpService.getVMBackupProxies().takeUntil(this.subs).subscribe(
      vadpData => {
        this.vadpData = vadpData;
        this.vadpsArr = this.vadpData.vadps || [];
        this.canPushInstall = this.vadpData.getLink('pushInstall') !== undefined;
        this.vadpService.updateVadpsSub.next(this.vadpsArr);
        this.tableUnmask();
      },
      err => {
        this.tableUnmask();
        this.handleError(err);
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private executeActionCallback(): void {
    this.getRecords();
    this.vadpTable.resetSelection();
    this.onViewClear();
  }

  private resetForm(): void {
    if (this.form) {
      this.form.cancel();
      this.form.enableFormControl('hostAddress');
    }
    if (this.identityComponent) {
      this.identityComponent.reset();
    }
    this.siteId = this.defaultSite.id;
  }

  private isFormValid(): boolean {
    if (this.enableProxy) {
      return this.identityComponent && this.identityComponent.isValid();
    } else if (this.form && this.identityComponent) {
      return this.form.isValid() && this.identityComponent.isValid();
    }
    return false;
  }

  private onEnableProxy(): void {
    let me = this;
    me.form.patchValue({ hostAddress: me.vadpWithTaskInfo ? me.vadpWithTaskInfo.ipAddr : '' });
    me.form.disableFormControl('hostAddress');
    me.onRegisterProxyClick();
    me.enableProxy = true;
  }

  private onDisableProxy(model: VadpModel): void {
    let me = this;
    me.vadpService.unregisterProxy(model).takeUntil(me.subs);
  }

  private onRegisterProxy(): void {
    let me = this,
      payload: object = me.vadpService.getProxyRegisterPayload(me.form.getValue(),
        me.siteId, me.identityModel);
    if (me.enableProxy) {
      me.mask();
      me.vadpService.doNodeVadpAction(payload,
        'register').takeUntil(me.subs)
        .subscribe(
          (next) => {
            me.onCancelClick();
            me.resetForm();
            me.unmask();
          },
          (err) => {
            me.unmask();
            me.handleVadpPushInstallError(err, true);
          }
        );
    } else {
      me.confirm(function () {
        setTimeout(function () {
          me.mask();
          me.vadpService.doNodeVadpAction(payload,
            'installandregister').takeUntil(me.subs)
            .subscribe(
              (next) => {
                me.onCancelClick();
                me.resetForm();
                me.unmask();
              },
              (err) => {
                me.unmask();
                me.handleVadpPushInstallError(err, true);
              }
            );
        }, 1000);
      });
    }
  }

  private confirm(handler: Function) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.textConfirmation, me.textConfirmationDetails, AlertType.CONFIRMATION, handler);
    }
  }

  private handleVadpPushInstallError(err: any, node: boolean = false): void {
    let error: ErrorModel = this.errorHandler.handle(err, node, true),
      resultsOutput: object = error.results && error.results['output'],
      stdMsg: string = (resultsOutput && resultsOutput['stdout']) || '',
      tpl: string = '{0} {1}',
      message: string = SharedService.formatString(tpl, (error.description || ''), stdMsg);

    this.mask(error.title, message, 'ERROR');
  }

  private onRegisterProxyClick(): void {
    this.registerProxy = true;
    this.enableProxy = false;
    this.onViewClear();
    this.vadpTable.resetSelection();
  }

  private onCancelClick(): void {
    this.registerProxy = false;
    this.enableProxy = false;
    this.canRegister = false;
    this.onViewClear();
    this.vadpTable.resetSelection();
    this.resetForm();
  }

  private handleError(error: any, node: boolean = false, silence: boolean = false) {
    this.errorHandler.handle(error, node, silence);
    this.onViewClear();
    this.vadpTable.resetSelection();
  }

  private maskTable(): void {
    this.tableMask = true;
  }

  private tableUnmask(): void {
    this.tableMask = false;
  }

  private onExecuteAction(link: LinkModel): void {
    if (link.name === 'pushUpdate') {
      this.vadpDetailsComponent.onExecuteUpgrade(this.vadpWithTaskInfo);
    } else if (link.name === 'unregister') {
      this.vadpDetailsComponent.onUnregisterVadpProxy(this.vadpWithTaskInfo);
    } else {
      this.vadpDetailsComponent.onExecuteAction(this.vadpWithTaskInfo, link);
    }
  }

  private onViewTasks(items: Array<VadpModel>): void {
    let me = this,
      fakeUnregisterLink: LinkModel = new LinkModel(),
      vadp: VadpModel = items && items.length > 0 ? items[0] : undefined,
      observable: Observable<VadpModel>;
    me.canRegister = false;
    if (me.vadpTaskComponent)
      me.vadpTaskComponent.reset();
    if (vadp && vadp.isVadpAvailable()) {
      me.vadpWithTaskInfo = vadp;
      me.canRegister = true;
      return;
    }
    observable = vadp ? me.vadpService.getTasksInfo(vadp) : undefined;
    if (observable) {
      me.mask();
      observable.takeUntil(me.subs).subscribe(
        vadpWithTask => {
          me.vadpWithTaskInfo = vadpWithTask;
          // do this logic in order for kebab in details pane has push update link
          // from what I can tell theres no difference in links
          me.vadpWithTaskInfo.links = vadp.hasLink('pushUpdate') ? vadp.links : me.vadpWithTaskInfo.links;
          me.unmask();
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
    } else {
      me.onViewClear();
    }
  }

  private onViewClear(): void {
    this.vadpTaskComponent.reset();
    this.vadpWithTaskInfo = undefined;
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
}
