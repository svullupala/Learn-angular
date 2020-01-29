import {AfterViewInit, Component, TemplateRef, ViewChild} from '@angular/core';
import {SharedService} from 'shared/shared.service';
import {AlertComponent, AlertType, DynamicTabEntry} from 'shared/components';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {Subject, Subscription} from 'rxjs';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {HypervisorRegistrationComponent} from './shared';
import {InventoryView} from 'inventory/inventory.model';
import {SessionService} from 'core';
import {
  HypervisorInventoryService,
  HypervisorInventoryWorkflow,
  HypervisorRegistrationSubjectModel, HypervisorStatSubjectModel
} from './shared/hypervisor-inventory.service';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {HypervisorAssignPolicySelectedTab} from './shared/assign-policy/hypervisor-assign-policy.interface';

@Component({
  selector: 'manage-hypervisors',
  templateUrl: './manage-hypervisors.component.html',
  styleUrls: ['./manage-hypervisors.component.scss']
})
export class ManageHypervisorsComponent extends RefreshSameUrl implements AfterViewInit {
  @ViewChild('vmware', {read: TemplateRef})
  public vmware: TemplateRef<any>;
  @ViewChild('hyperv', {read: TemplateRef})
  public hyperv: TemplateRef<any>;

  alert: AlertComponent;
  selectedAssignPolicyTab: HypervisorAssignPolicySelectedTab;
  runSettingsEditMode: boolean;

  public bsModalRef: BsModalRef;
  public assignPolicyTo: BaseHypervisorModel;
  private tabs: DynamicTabEntry[];
  private subs: Subject<void> = new Subject<void>();
  private textVmware: string;
  private textHyperv: string;
  private hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  private view: InventoryView = 'main';
  private previousView: InventoryView;
  private selectedItem: HypervisorModel;
  private subscriptions: Subscription[] = [];
  private canCreate: boolean = false;
  private hypervisorViews: { [key: string]: NvPairModel } = {};
  private readonly customClass: string = 'defaultClass popClass';

  constructor(
    protected globalState: GlobalState,
    protected route: ActivatedRoute,
    private translate: TranslateService,
    private modalService: BsModalService,
    private inventorySvc: HypervisorInventoryService,
  ) {
    super(globalState, route);
  }

  get hypervisorView(): NvPairModel {
    return this.hypervisorViews[this.hypervisorType];
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

  ngOnInit(): void {
    let me = this;
    super.ngOnInit();

    SharedService.maximizeContent(false, true);
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.tabs = [
      {key: 'vmware', title: me.textVmware, content: me.vmware, refresh: false, active: true},
      {key: 'hyperv', title: me.textHyperv, content: me.hyperv, refresh: false, active: false}
    ];
    me.tabs.forEach(function (item) {
      item.customClass = me.customClass;
    });

    me.translate
      .get(['menubar.submenu.textVMware', 'menubar.submenu.textHyperv'])
      .takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textVmware = resource['menubar.submenu.textVMware'];
        me.textHyperv = resource['menubar.submenu.textHyperv'];

        me.tabs[0].title = me.textVmware;
        me.tabs[1].title = me.textHyperv;
      });

    me.subscriptions.push(
      ...me.inventorySvc.subscribe<HypervisorRegistrationSubjectModel>('registration',
        undefined,
        value => {
          if (value.action === 'list')
            me.canCreate = value.target.hasLink('create');
        }),
      ...me.inventorySvc.subscribe<HypervisorStatSubjectModel>('stat',
        undefined,
        value => {
          if (value && value.workflow && value.action === 'activate-view')
            me.hypervisorViews[value.workflow] = value.target as NvPairModel;
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
      me.tabs[0].content = me.vmware;
      me.tabs[1].content = me.hyperv;
    }, 20);
  }

  onAddClick() {
    this.openRegistration();
  }

  onSwitchMode(activeTab: DynamicTabEntry) {
    if (activeTab && activeTab.key && this.hypervisorType !== activeTab.key)
      this.hypervisorType = activeTab.key;
  }

  onItemSelect(item: HypervisorModel): void {
    this.selectedItem = item;
    this.previousView = this.view;
    this.view = 'viewer';
  }

  onItemEdit(item: HypervisorModel): void {
    this.openRegistration(item);
  }

  onBackTo(): void {
    this.previousView = this.view;
    this.view = 'main';
  }

  onAssignPolicy(item: BaseHypervisorModel): void {
    this.assignPolicyTo = item;
    this.previousView = this.view;
    this.view = 'assign-policy';
    this.selectedAssignPolicyTab = 'policy';
    this.runSettingsEditMode = false;
  }

  onEditRunSettings(item: BaseHypervisorModel): void {
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

  protected openRegistration(item?: HypervisorModel): void {
    let me = this;
    me.bsModalRef = me.modalService.show(HypervisorRegistrationComponent, {backdrop: 'static', class: 'modal-lg'});
    me.bsModalRef.content.hypervisorType = me.hypervisorType;
    if (!item || item.phantom)
      me.bsModalRef.content.onAddInit(item);
    else
      me.bsModalRef.content.onEditInit(item);

    me.bsModalRef.content.registered.takeUntil(me.subs).subscribe(param => {
      me.inventorySvc.next<HypervisorRegistrationSubjectModel>('registration',
        {workflow: me.hypervisorType as HypervisorInventoryWorkflow, action: 'register', target: param});
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

  protected onRefreshSameUrl(): void {
    this.onBackTo();
  }

  private handleLayout(from: InventoryView, to: InventoryView): void {
    if (from === 'assign-policy' && to === 'main')
      SharedService.maximizeContent(true, false, true);
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }
}
