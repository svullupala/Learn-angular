import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {HypervisorBackupOptionsModel} from '../../shared/hypervisor-backup-options.model';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {VadpModel} from 'vadp/vadp.model';
import {
  IdentityUserEnterSelectComponent
}
  from 'identity/shared/identity-user-enter-select/identity-user-enter-select.component';
import {VadpProxyMonitorService} from 'vadp/vadp-proxy-monitor.service';
import {ErrorHandlerComponent} from 'shared/components';
import {SiteModel} from 'site/site.model';
import {SitesModel} from 'site/sites.model';
import {JsonConvert} from 'json2typescript/index';
import {SiteService} from 'site/site.service';
import {Subject} from 'rxjs/Subject';
import {HypervisorBackupOptionsPage} from 'hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-page';
import { KeySelectorComponent } from 'shared/components/key-selector/key-selector.component';
import {SessionService} from 'core';

@Component({
  selector: 'vmware-backup-options',
  templateUrl: './vmware-backup-options.component.html',
  providers: [VadpProxyMonitorService],
  styleUrls: ['../shared/hypervisor-backup-options.scss']

})

export class VmwareBackupOptionsComponent extends HypervisorBackupOptionsPage<HypervisorBackupOptionsModel>
  implements OnInit {
  @Input() model: HypervisorBackupOptionsModel = new HypervisorBackupOptionsModel();
  @Output() loadedUserEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() loadedVADPsEvent: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(IdentityUserEnterSelectComponent) userEsRef: IdentityUserEnterSelectComponent;
  @ViewChild(KeySelectorComponent) keyEsRef: KeySelectorComponent;

  private enableVadpSelection: boolean = false;
  private selectedProxies;
  private selectedSite;
  private vadps: Array<VadpModel> = [];
  private sites: Array<SiteModel> = [];
  private dropdownList: Array<Object> = [];
  private dropdownSettings: Object;
  private view: String = 'vmview';
  private subs: Subject<void> = new Subject<void>();
  private errorHandler: ErrorHandlerComponent;
  private userInfo: IdentityUserEnterSelectModel;
  private userRegistrationMode: boolean = true;

  constructor(private vadpService: VadpProxyMonitorService, private siteService: SiteService) {
    super();
  }

  ngOnInit(): void {
    let me = this;
    me.setOptions();
    me.dropdownSettings = {
      singleSelection: true,
      enableSearchFilter: false,
      enableCheckAll: false
    };
    me.vadpService.getVMBackupProxies().takeUntil(this.subs).subscribe(
      vadpData => {
        me.vadps = vadpData.vadps;
        me.dropdownList = me.setVADPProxyDropdownList(me.vadps);
        me.loadedVADPsEvent.emit(false);
      },
      err => {
        me.loadedVADPsEvent.emit(false);
        me.errorHandler.handle(err);
      }
    );

    me.siteService.getAll().takeUntil(this.subs).subscribe(
      (res) => {
        let sitesDataset: SitesModel = JsonConvert.deserializeObject(res, SitesModel),
          defaultSite: SiteModel;
        me.sites = sitesDataset.sites;
      },
      (err) => me.errorHandler.handle(err)
    );
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
  }


  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public setView(view: String) {
    this.view = view;
  }

  public getOptions(): Object {
    let me = this, userInfo = me.getUserInfo();
    return {
      makeApplicationConsistent: me.model.makeApplicationConsistent,
      fallbackToUnquiescedSnapshot: me.model.fallbackToUnquiescedSnapshot,
      snapshotRetries: me.model.snapshotRetries,
      priority: me.model.priority,
      fullcopymethod: me.model.fullcopymethod,
      proxySelection: me.enableVadpSelection ? me.model.proxySelection : me.selectedSite,
      skipReadonlyDS: me.model.skipReadonlyDS,
      FHExcludedPath: me.model.FHExcludedPath === '' ? undefined : me.model.FHExcludedPath,
      includeVMsOnMultDatastores: me.view === 'storageview' ?
        me.model.includeVMsOnMultDatastores : undefined,
      skipIAMounts: me.model.skipIAMounts,
      enableFH: me.model.enableFH,
      enableLogTruncate: me.model.enableLogTruncate,
      username: this.userRegistrationMode
        ? (userInfo && userInfo.useExisting ? userInfo.userHref : userInfo.username || undefined)
        : this.getExistingKeyHref(),
      password: this.userRegistrationMode ? ((userInfo && !userInfo.useExisting) ? userInfo.password : undefined)
        : undefined
    };
  }

  public setOptions(options?: HypervisorBackupOptionsModel): void {
    let me = this;
    me.enableVadpSelection = false;
    if (options && !options.isEmpty()) {
      me.model.makeApplicationConsistent = options.makeApplicationConsistent;
      me.model.fallbackToUnquiescedSnapshot = options.fallbackToUnquiescedSnapshot;
      me.model.snapshotRetries = options.snapshotRetries;
      me.model.priority = options.priority;
      me.model.fullcopymethod = options.fullcopymethod;
      me.model.proxySelection = options.proxySelection || '';
      me.model.skipReadonlyDS = options.skipReadonlyDS;
      me.model.FHExcludedPath = options.FHExcludedPath;
      me.model.includeVMsOnMultDatastores = options.includeVMsOnMultDatastores;
      me.model.skipIAMounts = options.skipIAMounts;
      me.model.enableFH = options.enableFH;
      me.model.enableLogTruncate = options.enableLogTruncate;
    } else {
      // Set default options.
      me.model.makeApplicationConsistent = true;
      me.model.fallbackToUnquiescedSnapshot = true;
      me.model.snapshotRetries = 1;
      me.model.priority = 5;
      me.model.fullcopymethod = 'vadp';
      me.model.proxySelection = '';
      me.selectedProxies = undefined;
      me.model.skipReadonlyDS = true;
      me.model.FHExcludedPath = undefined;
      me.model.includeVMsOnMultDatastores = true;
      me.model.skipIAMounts = true;
      me.model.enableFH = false;
      me.model.enableLogTruncate = false;
    }
    me.setUserInfo(options);
    if (me.model.proxySelection === '') {
      me.enableVadpSelection = false;
      me.selectedSite = '';
    } else if (me.model.proxySelection.indexOf('site') !== -1) {
      me.selectedSite = me.model.proxySelection;
    } else if (me.model.proxySelection.indexOf('vadp') !== -1) {
      me.enableVadpSelection = true;
      me.selectedProxies = me.setSelectedProxiesList(me.vadps);
    }
  }

  public getUserInfo(): IdentityUserEnterSelectModel {
    let me = this;
    if (me.userEsRef)
      me.userInfo = me.userEsRef.getValue();
    return me.userRegistrationMode ? me.userInfo : null;
  }

  public getExistingUserHref(): string {
    let me = this, userInfo = me.getUserInfo();
    return (userInfo && userInfo.useExisting) ? userInfo.userHref : undefined;
  }

  public getExistingKeyHref(): string {
    let me = this, keyValue;
    if (me.keyEsRef)
      keyValue = me.keyEsRef.getValue();
    return (!this.userRegistrationMode && keyValue) ? keyValue.keyHref : undefined;
  }

  public reloadUsers(): void {
    let me = this;
    if (me.userEsRef)
      me.userEsRef.loadUsers();
  }

  private setUserInfo(options: HypervisorBackupOptionsModel): void {
    let me = this;
    me.userInfo = new IdentityUserEnterSelectModel();
    if (options && !options.isEmpty()) {
      me.userInfo.useExisting = options.hasUser();
      me.userInfo.userHref = options.hasUser() ? options.user.href : '';
      me.userInfo.user = options.hasUser() ? this.userEsRef.getUser(me.userInfo.userHref) : undefined;
      me.userInfo.username = options.username || '';
      me.userInfo.password = options.password || '';
    }
    if (me.userInfo.userHref.indexOf('key') !== -1) {
      me.keyEsRef.setValue(me.userInfo.userHref);
      me.userRegistrationMode = false;
    } else if (me.userEsRef) {
      me.userEsRef.setValue(me.userInfo);
      me.userRegistrationMode = true;
    }
  }

  private setVADPProxyDropdownList(vadps: Array<VadpModel>): Array<Object> {
    let dropdownList: Array<Object> = [];
    if (vadps && vadps.length > 0) {
      for (let i = 0; i < vadps.length; i++) {
        if (vadps[i].isVadpAvailable() === false) {
          dropdownList.push({id: vadps[i].url, itemName: vadps[i].displayName});
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
            selectedProxies.push({id: vadpProxyList[i].url, itemName: vadpProxyList[i].displayName});
            break;
          }
        } catch (error) {
          this.errorHandler.handle(error);
        }
      }
    }
    return selectedProxies;
  }

  private keyPressed(key: KeyboardEvent) {
    if (key && (key.key === 'Enter' || key.keyCode === 13)) {
      return false;
    }
  }

  private onLoadUsers(event?: any): void {
    this.loadedUserEvent.emit(event);
  }
}
