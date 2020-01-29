import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';
import { SharedService } from 'shared/shared.service';
import { ScrollTabEntry, ScrollTabsetComponent } from 'shared/components/sroll-tabset';
import { HypervisorBackupOptionsModel } from 'hypervisor/shared/hypervisor-backup-options.model';
import { HypervisorBackupOptionsRegistry } from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-registry';
import { HypervisorBackupOptionsService } from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options.service';
import { HypervisorBrowseService } from 'hypervisor/shared/hypervisor-browse.service';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';
import { IdentityUserEnterSelectV2Component } from 'identity/shared/identity-user-enter-select-v2';
import { SiteModel } from 'site/site.model';
import { SiteService } from 'site/site.service';
import { SitesModel } from 'site/sites.model';
import { JsonConvert } from 'json2typescript/src/json2typescript/json-convert';
import { VadpProxyMonitorService } from 'vadp/vadp-proxy-monitor.service';
import { VadpModel } from 'vadp/vadp.model';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { HypervisorBackupService } from 'hypervisor/backup/hypervisor-backup.service';
import { SessionService } from 'core';

@Component({
  selector: 'hypervisor-assign-policy-run-settings',
  templateUrl: './run-settings.component.html',
  styleUrls: ['./run-settings.component.scss'],
  providers: [VadpProxyMonitorService]
})
export class RunSettingsComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() assignPolicyTo: BaseHypervisorModel;
  @Input() model: HypervisorBackupOptionsModel = new HypervisorBackupOptionsModel();
  @Input() isActive: boolean = false;
  @Input() hypervisorType: string;
  @Input() editMode: boolean = false;

  @ViewChild('tabRunningBackup', { read: TemplateRef }) tabRunningBackup: TemplateRef<any>;
  @ViewChild('tabTakingSnapshot', { read: TemplateRef }) tabTakingSnapshot: TemplateRef<any>;
  @ViewChild('tabAgentInstructions', { read: TemplateRef }) tabAgentInstructions: TemplateRef<any>;
  @ViewChild('tabUserAccess', { read: TemplateRef }) tabUserAccess: TemplateRef<any>;
  @ViewChild('tabDevelopingVADP', { read: TemplateRef }) tabDevelopingVADP: TemplateRef<any>;
  @ViewChild(ScrollTabsetComponent) scrollTabsetComponent: ScrollTabsetComponent;
  @ViewChild(IdentityUserEnterSelectV2Component)
  identityUserComponent: IdentityUserEnterSelectV2Component;

  scrollTabs: ScrollTabEntry[] = [];
  vadpSelection: 'site' | 'proxy' = 'site';
  sites: Array<SiteModel> = [];
  selectedProxies: Array<any>;
  dropdownList: Array<any> = [];
  mask: boolean = false;
  optionsLoaded: boolean = false;
  private options: HypervisorBackupOptionsModel;
  private optionsRegistry: HypervisorBackupOptionsRegistry;
  private userInfo: IdentityUserEnterSelectModel;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private vadps: Array<VadpModel> = [];
  private selectedSite: string;
  private textCustomizeHowJobsWillRun: string;
  private tabTranslations: { [key: string]: string };
  private textInfoTitle: string;
  private textWarningTitle: string;
  private textSelectCredentials: string;

  constructor(
    private translateService: TranslateService,
    private optionsService: HypervisorBackupOptionsService,
    private browseService: HypervisorBrowseService,
    private backupService: HypervisorBackupService,
    private siteService: SiteService,
    private vadpService: VadpProxyMonitorService
  ) {}

  ngOnInit(): void {
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];

    this.setTranslations();
    this.setSites();
    this.setVMBackupProxies();

    this.optionsRegistry = this.optionsService.getRegistry(this.hypervisorType);
    this.options = new this.optionsRegistry.modelClazz();
    this.setOptions(this.options);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['isActive'] && changes['isActive'].currentValue) {
      setTimeout(() => {
        this.onActivate();
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollTabs = this.prepareTabs();
      this.loadOptions();
    });
  }

  get formattedInfoText(): string {
    return SharedService.formatString(this.textCustomizeHowJobsWillRun, this.assignPolicyTo.name);
  }

  enableEditMode(): void {
    this.editMode = true;
  }

  disableEditMode(): void {
    this.editMode = false;
  }

  onCancel(): void {
    this.disableEditMode();
  }

  onSave(): void {
    this.saveOptions();
  }

  onLoadUsers(): void {
    this.setUserInfo(this.options);
  }

  private setTranslations(): void {
    this.translateService
      .get([
        'common.infoTitle',
        'common.warningTitle',
        'hypervisor.textSelectCredentials',
        'inventory.textCustomizeHowJobsWillRun',
        'inventory.textRunningBackup',
        'inventory.textTakingSnapshot',
        'inventory.textAgentInstructions',
        'inventory.textUserAccessTab',
        'inventory.textSelectingVADP'
      ])
      .subscribe(trans => {
        this.textCustomizeHowJobsWillRun = trans['inventory.textCustomizeHowJobsWillRun'];
        this.textInfoTitle = trans['common.infoTitle'];
        this.textWarningTitle = trans['common.warningTitle'];
        this.textSelectCredentials = trans['hypervisor.textSelectCredentials'];
        this.tabTranslations = {
          textRunningBackup: trans['inventory.textRunningBackup'],
          textTakingSnapshot: trans['inventory.textTakingSnapshot'],
          textAgentInstructions: trans['inventory.textAgentInstructions'],
          textUserAccessTab: trans['inventory.textUserAccessTab'],
          textSelectingVADP: trans['inventory.textSelectingVADP']
        };
      });
  }

  private prepareTabs(): ScrollTabEntry[] {
    return [
      {
        key: 'tabRunningBackup',
        title: this.tabTranslations.textRunningBackup,
        active: true,
        content: this.tabRunningBackup
      },
      {
        key: 'tabTakingSnapshot',
        title: this.tabTranslations.textTakingSnapshot,
        content: this.tabTakingSnapshot
      },
      {
        key: 'tabAgentInstructions',
        title: this.tabTranslations.textAgentInstructions,
        content: this.tabAgentInstructions
      },
      {
        key: 'tabUserAccess',
        title: this.tabTranslations.textUserAccessTab,
        content: this.tabUserAccess
      },
      {
        key: 'tabDevelopingVADP',
        title: this.tabTranslations.textSelectingVADP,
        content: this.tabDevelopingVADP
      }
    ];
  }

  private onActivate(): void {
    if (this.scrollTabsetComponent) {
      this.scrollTabsetComponent.refreshTabs();
    }
  }

  private setSites(): void {
    this.siteService.getAll().subscribe(
      res => {
        const sitesDataset: SitesModel = JsonConvert.deserializeObject(res, SitesModel);
        this.sites = sitesDataset.sites;
      },
      err => this.errorHandler.handle(err)
    );
  }

  private setVMBackupProxies(): void {
    this.vadpService.getVMBackupProxies().subscribe(
      vadpData => {
        this.vadps = vadpData.vadps;
        this.dropdownList = this.setVADPProxyDropdownList(this.vadps);
      },
      err => {
        this.errorHandler.handle(err);
      }
    );
  }

  private getProxiesDropdownOptions(): any {
    return {
      singleSelection: true,
      enableSearchFilter: false,
      enableCheckAll: false,
      disabled: this.vadpSelection !== 'proxy'
    };
  }

  private setUserInfo(options?: HypervisorBackupOptionsModel): void {
    this.userInfo = new IdentityUserEnterSelectModel();
    if (options && !options.isEmpty()) {
      this.userInfo.useExisting = options.hasUser();
      this.userInfo.userHref = options.hasUser() ? options.user.href : '';
      this.userInfo.user = options.hasUser()
        ? this.identityUserComponent.getUser(this.userInfo.userHref)
        : undefined;
      this.userInfo.username = options.username || '';
      this.userInfo.password = options.password || '';
    }
    if (this.userInfo.userHref.indexOf('key') !== -1) {
      this.identityUserComponent.setKey(this.userInfo.userHref);
    } else if (this.identityUserComponent) {
      this.identityUserComponent.setValue(this.userInfo);
    }
  }

  private setOptions(options?: HypervisorBackupOptionsModel): void {
    this.vadpSelection = 'site';
    if (options && !options.isEmpty()) {
      this.options = options;
      this.model.makeApplicationConsistent = options.makeApplicationConsistent;
      this.model.fallbackToUnquiescedSnapshot = options.fallbackToUnquiescedSnapshot;
      this.model.snapshotRetries = options.snapshotRetries;
      this.model.priority = options.priority;
      this.model.fullcopymethod = options.fullcopymethod;
      this.model.proxySelection = options.proxySelection || '';
      this.model.skipReadonlyDS = options.skipReadonlyDS;
      this.model.FHExcludedPath = options.FHExcludedPath;
      this.model.includeVMsOnMultDatastores = options.includeVMsOnMultDatastores;
      this.model.skipIAMounts = options.skipIAMounts;
      this.model.enableFH = options.enableFH;
      this.model.enableLogTruncate = options.enableLogTruncate;
    } else {
      // Set default options.
      this.model.makeApplicationConsistent = true;
      this.model.fallbackToUnquiescedSnapshot = true;
      this.model.snapshotRetries = 1;
      this.model.priority = 5;
      this.model.fullcopymethod = 'vadp';
      this.model.proxySelection = '';
      this.selectedProxies = undefined;
      this.model.skipReadonlyDS = true;
      this.model.FHExcludedPath = undefined;
      this.model.includeVMsOnMultDatastores = true;
      this.model.skipIAMounts = true;
      this.model.enableFH = false;
      this.model.enableLogTruncate = false;
    }
    this.setUserInfo(options);
    if (this.model.proxySelection === '') {
      this.vadpSelection = 'site';
      this.selectedSite = '';
    } else if (this.model.proxySelection.indexOf('site') !== -1) {
      this.selectedSite = this.model.proxySelection;
    } else if (this.model.proxySelection.indexOf('vadp') !== -1) {
      this.vadpSelection = 'proxy';
      this.selectedProxies = this.setSelectedProxiesList(this.vadps);
    }
  }

  private getOptions(): Object {
    const userInfo = this.userInfo;
    return {
      makeApplicationConsistent: this.model.makeApplicationConsistent,
      fallbackToUnquiescedSnapshot: this.model.fallbackToUnquiescedSnapshot,
      snapshotRetries: this.model.snapshotRetries,
      priority: this.model.priority,
      fullcopymethod: this.model.fullcopymethod,
      proxySelection:
        this.vadpSelection === 'proxy' ? this.model.proxySelection : this.selectedSite,
      skipReadonlyDS: this.model.skipReadonlyDS,
      FHExcludedPath: this.model.FHExcludedPath === '' ? undefined : this.model.FHExcludedPath,
      includeVMsOnMultDatastores: undefined,
      skipIAMounts: this.model.skipIAMounts,
      enableFH: this.model.enableFH,
      enableLogTruncate: this.model.enableLogTruncate,
      username:
        userInfo.useSsh && userInfo.sshKey.keyHref
          ? userInfo.sshKey.keyHref
          : userInfo.useExisting
          ? userInfo.userHref
          : userInfo.username || undefined,
      password: !userInfo.useSsh
        ? !userInfo.useExisting
          ? userInfo.password
          : undefined
        : undefined
    };
  }

  private loadOptions(): void {
    this.mask = true;
    this.assignPolicyTo
      .getRecord<HypervisorBackupOptionsModel>(
        HypervisorBackupOptionsModel,
        'options',
        this.browseService.proxy
      )
      .subscribe(
        record => {
          this.optionsLoaded = true;
          this.mask = false;
          this.setOptions(record);
        },
        err => this.errorHandler.handle(err, false)
      );
  }

  private saveOptions(): void {
    const options = this.getOptions() as HypervisorBackupOptionsModel;

    if (options.username === undefined || options.username === '') {
      this.info(this.textSelectCredentials, this.textWarningTitle, AlertType.WARNING);
      return;
    }

    // Apply options.
    this.mask = true;
    this.backupService.applyOptions([this.assignPolicyTo], options, this.hypervisorType).subscribe(
      () => {
        this.disableEditMode();
        this.mask = false;
      },
      err => {
        this.errorHandler.handle(err, true);
        this.mask = false;
      }
    );
  }

  private setVADPProxyDropdownList(vadps: Array<VadpModel>): Array<Object> {
    let dropdownList: Array<Object> = [];
    if (vadps && vadps.length > 0) {
      for (let i = 0; i < vadps.length; i++) {
        if (vadps[i].isVadpAvailable() === false) {
          dropdownList.push({ id: vadps[i].url, itemName: vadps[i].displayName });
        }
      }
    }
    return dropdownList;
  }

  private onVADPProxySelect(item: Object): void {
    this.model.proxySelection = item['id'];
  }

  private onVADPProxyDeselect(item: Object): void {
    this.model.proxySelection = '';
  }

  private setSelectedProxiesList(vadpProxyList: Array<VadpModel>): Array<Object> {
    let selectedProxies: Array<Object> = [];
    if (vadpProxyList && vadpProxyList.length > 0) {
      for (let i = 0; i < vadpProxyList.length; i++) {
        let proxy: URL, selection: URL;
        try {
          proxy = new URL(vadpProxyList[i].url);
          selection = new URL(this.model.proxySelection);
          if (proxy.pathname === selection.pathname) {
            selectedProxies.push({
              id: vadpProxyList[i].url,
              itemName: vadpProxyList[i].displayName
            });
            break;
          }
        } catch (err) {
          this.errorHandler.handle(err);
        }
      }
    }
    return selectedProxies;
  }

  private info(
    message: string | TemplateRef<any>,
    title?: string,
    type?: AlertType,
    fn?: Function
  ) {
    if (this.alert) {
      this.alert.show(title || this.textInfoTitle, message, type, fn);
    }
  }
}
