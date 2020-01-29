import {AfterViewInit, Component, TemplateRef, ViewChild} from '@angular/core';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {AlertComponent, AlertType, DynamicTabEntry} from 'shared/components';
import {Subject, Subscription} from 'rxjs';
import {InventoryView} from 'inventory/inventory.model';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';
import {ApplicationRegistrationComponent} from './shared';
import {SessionService} from 'core';
import {
  ApplicationInventoryService,
  ApplicationInventoryWorkflow,
  ApplicationRegistrationSubjectModel, ApplicationRegistrationTarget, ApplicationStatSubjectModel
} from './shared/application-inventory.service';
import {NvPairModel} from 'shared/models/nvpair.model';
import {AppServerModel} from 'appserver/appserver.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {ApplicationsAssignPolicySelectedTab} from './shared/assign-policy/applications-assign-policy.interface';

@Component({
  selector: 'manage-applications',
  templateUrl: './manage-applications.component.html',
  styleUrls: ['./manage-applications.component.scss'],
  providers: []
})
export class ManageApplicationsComponent extends RefreshSameUrl implements AfterViewInit {


  @ViewChild('db2', {read: TemplateRef})
  public db2: TemplateRef<any>;

  @ViewChild('exch', {read: TemplateRef})
  public exch: TemplateRef<any>;

  @ViewChild('office365', {read: TemplateRef})
  public office365: TemplateRef<any>;

  @ViewChild('mongo', {read: TemplateRef})
  public mongo: TemplateRef<any>;

  @ViewChild('oracle', {read: TemplateRef})
  public oracle: TemplateRef<any>;

  @ViewChild('sql', {read: TemplateRef})
  public sql: TemplateRef<any>;

  selectedAssignPolicyTab: ApplicationsAssignPolicySelectedTab;
  runSettingsEditMode: boolean;

  public bsModalRef: BsModalRef;
  public alert: AlertComponent;
  public assignPolicyTo: BaseApplicationModel;
  private tabs: DynamicTabEntry[];
  private subs: Subject<void> = new Subject<void>();
  private textDb2: string;
  private textExch: string;
  private textExchonline: string;
  private textMongo: string;
  private textOracle: string;
  private textSql: string;
  private applicationType: string = 'db2';
  private view: InventoryView = 'main';
  private previousView: InventoryView;
  private selectedItem: AppServerModel;
  private subscriptions: Subscription[] = [];
  private canCreate: boolean = false;
  private applicationViews: { [key: string]: NvPairModel } = {};
  private readonly customClass: string = 'defaultClass popClass';

  get applicationView(): NvPairModel {
    return this.applicationViews[this.applicationType];
  }

  get isMainView(): boolean {
    return this.view === 'main';
  }

  get isViewerView(): boolean {
    return this.view === 'viewer';
  }

  get isAssignPolicyView(): boolean {
    return this.view === 'assign-policy';
  }

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService,
              private modalService: BsModalService,
              private inventorySvc: ApplicationInventoryService) {
    super(globalState, route);
  }

  ngOnInit(): void {
    let me = this;
    super.ngOnInit();

    SharedService.maximizeContent(false, true);
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.tabs = [
      {key: 'db2', title: me.textDb2, content: me.db2, refresh: false, active: true},
      {key: 'exch', title: me.textExch, content: me.exch, refresh: false, active: false},
      {key: 'office365', title: me.textExchonline, content: me.office365, refresh: false, active: false},
      {key: 'mongo', title: me.textMongo, content: me.mongo, refresh: false, active: false},
      {key: 'oracle', title: me.textOracle, content: me.oracle, refresh: false, active: false},
      {key: 'sql', title: me.textSql, content: me.sql, refresh: false, active: false}
    ];
    me.tabs.forEach(function (item) {
      item.customClass = me.customClass;
    });

    me.translate.get([
      'menubar.submenu.textDB2',
      'menubar.submenu.textExchange',
      'menubar.submenu.textExchangeOnline',
      'menubar.submenu.textMongoDb',
      'menubar.submenu.textOracle',
      'menubar.submenu.textSQL']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textDb2 = resource['menubar.submenu.textDB2'];
        me.textExch = resource['menubar.submenu.textExchange'];
        me.textExchonline = resource['menubar.submenu.textExchangeOnline'];
        me.textMongo = resource['menubar.submenu.textMongoDb'];
        me.textOracle = resource['menubar.submenu.textOracle'];
        me.textSql = resource['menubar.submenu.textSQL'];

        me.tabs[0].title = me.textDb2;
        me.tabs[1].title = me.textExch;
        me.tabs[2].title = me.textExchonline;
        me.tabs[3].title = me.textMongo;
        me.tabs[4].title = me.textOracle;
        me.tabs[5].title = me.textSql;
      });

    me.subscriptions.push(
      ...me.inventorySvc.subscribe<ApplicationRegistrationSubjectModel>('registration',
        undefined,
        value => {
          if (value.action === 'list')
            me.canCreate = value.target.hasLink('create');
        }),
      ...me.inventorySvc.subscribe<ApplicationStatSubjectModel>('stat',
        undefined,
        value => {
          if (value && value.workflow && value.action === 'activate-view')
            me.applicationViews[value.workflow] = value.target as NvPairModel;
        })
    );
  }

  ngOnDestroy(): void {
    let me = this;
    super.ngOnDestroy();
    SharedService.maximizeContent(true);
    me.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    me.subs.next();
    me.subs.complete();
    me.subs.unsubscribe();
  }

  ngAfterViewInit(): void {
    let me = this;
    setTimeout(() => {
      me.tabs[0].content = me.db2;
      me.tabs[1].content = me.exch;
      me.tabs[2].content = me.office365;
      me.tabs[3].content = me.mongo;
      me.tabs[4].content = me.oracle;
      me.tabs[5].content = me.sql;
    }, 20);
  }

  onAddClick() {
    this.openRegistration();
  }

  protected openRegistration(item?: ApplicationRegistrationTarget): void {
    let me = this;
    me.bsModalRef = me.modalService.show(ApplicationRegistrationComponent, {backdrop: 'static', class: 'modal-lg'});
    me.bsModalRef.content.applicationType = me.applicationType;
    me.bsModalRef.content.hideOptions = false;
    me.bsModalRef.content.canDiscover = me.canDoDiscover;
    me.bsModalRef.content.showOsType = false;
    if (!item || item.appServer.phantom)
      me.bsModalRef.content.onAddInit(item);
    else
      me.bsModalRef.content.onEditInit(item.appServer);

    me.bsModalRef.content.registered.takeUntil(me.subs).subscribe(param => {
      me.inventorySvc.next<ApplicationRegistrationSubjectModel>('registration',
        {workflow: me.applicationType as ApplicationInventoryWorkflow, action: 'register', target: param});
    });
    me.bsModalRef.content.errorOccurred.takeUntil(me.subs).subscribe(param => {
      let model = param.model, error = param.error;
      me.alert.show(error.title, error.description, AlertType.ERROR,
        undefined, undefined, 0, false, false, param.raw);
      let subscriber = me.alert.hideEvent.subscribe(() => {
        subscriber.unsubscribe();
        me.openRegistration(model);
      });
    });
  }

  onSwitchMode(activeTab: DynamicTabEntry) {
    if (activeTab && activeTab.key && this.applicationType !== activeTab.key)
      this.applicationType = activeTab.key;
  }

  get canDoDiscover(): boolean {
    return this.applicationType === 'oracle' || this.applicationType === 'mongo';
  }


  onItemSelect(item: AppServerModel): void {
    this.selectedItem = item;
    this.previousView = this.view;
    this.view = 'viewer';
  }

  onItemEdit(item: AppServerModel): void {
    this.openRegistration({appServer: item});
  }

  onBackTo(): void {
    this.previousView = this.view;
    this.view = 'main';
  }

  onAssignPolicy(item: BaseApplicationModel): void {
    this.assignPolicyTo = item;
    this.previousView = this.view;
    this.view = 'assign-policy';
    this.selectedAssignPolicyTab = 'policy';
    this.runSettingsEditMode = false;
  }

  onEditRunSettings(item: BaseApplicationModel): void {
    this.assignPolicyTo = item;
    this.previousView = this.view;
    this.view = 'assign-policy';
    this.selectedAssignPolicyTab = 'runSettings';
    this.runSettingsEditMode = true;
  }

  onCloseAssignPolicyView(): void {
    this.handleLayout(this.view, this.previousView);
    this.assignPolicyTo = null;
    this.view = this.previousView;
  }

  protected onRefreshSameUrl(): void {
    this.onBackTo();
  }

  private handleLayout(from: InventoryView, to: InventoryView): void {
    if (from === 'assign-policy' && to === 'main')
      SharedService.maximizeContent(true, false, true);
  }
}
