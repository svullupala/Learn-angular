import { Component, OnInit, OnDestroy } from '@angular/core';
import { NodeService, RestService } from 'core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { Subject } from 'rxjs/Subject';
import { DatasetModel } from 'shared/models/dataset.model';
import { SorterModel } from 'shared/models/sorter.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { IdentityUsersModel } from 'identity/shared/identity-users.model';
import { IdentityUserModel } from 'identity/shared/identity-user.model';
import { LdapSmtpService } from 'ldapsmtp/ldap-smtp.service';
import { ScriptsModel } from 'scripts/scripts.model';
import { ScriptModel } from 'scripts/script.model';
import { SiteService } from 'site/site.service';
import { JsonConvert } from 'json2typescript/index';
import { SitesModel } from 'site/sites.model';
import { VadpProxyMonitorService } from 'vadp/vadp-proxy-monitor.service';
import { ResourceGroupsModel } from '../../resource-groups.model';
import { ResourceGroupModel } from '../../resource-group.model';
import { AppServerService } from 'appserver/appserver.service';
import { FilterModel } from 'shared/models/filter.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import { SiteModel } from 'site/site.model';
import { StoragesModel } from 'diskstorage/shared/storages.model';
import { StorageModel } from 'diskstorage/shared/storage.model';
import { CloudModel } from 'cloud/cloud.model';
import { CloudsModel } from 'cloud/clouds.model';
import { KeyModel } from '../../../../system-configuration/access-keys/key.model';
import { KeysModel } from '../../../../system-configuration/access-keys/keys.model';
import { CertificateModel } from 'cloud/cloud-certificate/certificate.model';
import { CertificatesModel } from 'cloud/cloud-certificate/certificates.model';

@Component({
  selector: 'resource-group-system-selector',
  templateUrl: './resource-group-system-selector.component.html',
  styleUrls: ['../../resource-groups.scss'],
  providers: [LdapSmtpService, SiteService, AppServerService, VadpProxyMonitorService]
})

export class ResourceGroupSystemSelectorComponent implements OnInit, OnDestroy {
  private sorters: Array<SorterModel>;
  private subs: Subject<void> = new Subject<void>();
  private dataset: DatasetModel<any>;
  private paginateConfig: PaginateConfigModel;
  private records: Array<any> = [];
  private breadcrumbs: Array<BreadcrumbModel> = [];
  private addAllLogItem: ResourceGroupSelectionModel;
  private addAllLdapItem: ResourceGroupSelectionModel;
  private addAllSmtpItem: ResourceGroupSelectionModel;
  private addAllScriptItem: ResourceGroupSelectionModel;
  private addAllScriptServerItem: ResourceGroupSelectionModel;
  private addAllSiteItem: ResourceGroupSelectionModel;
  private addAllVadpItem: ResourceGroupSelectionModel;
  private addAllCloudItem: ResourceGroupSelectionModel;
  private addAllKeyItem: ResourceGroupSelectionModel;
  private addAllCertificateItem: ResourceGroupSelectionModel;
  private hideAllButton: boolean = false;
  private systemType: string;
  private crumbTitle: string;
  private textAll: string;
  private stringsArr: object;
  private resourceType: string = ResourceGroupsService.SYSTEM_TYPE;
  private allRbacPath: string;
  private addAllItem: ResourceGroupSelectionModel;

  private masked: boolean = false;

  constructor(private rest: RestService,
              private node: NodeService,
              private translate: TranslateService,
              private ldapSmtpService: LdapSmtpService,
              private siteService: SiteService,
              private appServerService: AppServerService,
              private vadpService: VadpProxyMonitorService,
              private resourceGroupsService: ResourceGroupsService) {
    let me = this;
    me.paginateConfig = new PaginateConfigModel();
    me.paginateConfig.id = `resource-group-system-table-pagination-${(new Date()).valueOf()}`;
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  ngOnInit(): void {
    let me = this;
    me.breadcrumbs = [];
    me.resourceType = ResourceGroupsService.SYSTEM_TYPE;
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.translate.get([
      'ldap-smtp.textLdap',
      'scripts.title',
      'storage.textSite',
      'ldap-smtp.textSmtp',
      'resourceGroups.textAll',
      'resourceGroups.textCloud',
      'resourceGroups.textDisk',
      'resourceGroups.textScriptServers',
      'resourceGroups.textLogs',
      'resourceGroups.textSystemLogs',
      'resourceGroups.textAuditLogs',
      'resourceGroups.textSystem',
      'resourceGroups.textKeys',
      'resourceGroups.textCertificates',
      'hypervisor.textVADP'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.stringsArr = resource;
      me.textAll = resource['resourceGroups.textAll'];
      // initialize container items for all system types
      me.addAllLogItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_LOGS_RRAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['resourceGroups.textLogs']]);
      me.addAllLdapItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_LDAP_RRAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['ldap-smtp.textLdap']]);
      me.addAllSmtpItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_SMTP_RRAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['ldap-smtp.textSmtp']]);
      me.addAllScriptItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_SCRIPTS_RBAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['scripts.title']]);
      me.addAllScriptServerItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_SCRIPT_SERVERS_RBAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['resourceGroups.textScriptServers']]);
      me.addAllSiteItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_SITE_RRAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['storage.textSite']]);
      me.addAllVadpItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_VADPS_RBAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['hypervisor.textVADP']]);
      me.addAllCloudItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_CLOUD_RBAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['resourceGroups.textCloud']]);
      me.addAllKeyItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_KEYS_RBAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['resourceGroups.textKeys']]);
      me.addAllCertificateItem = me.resourceGroupsService.createAllItem(ResourceGroupsService.ALL_CERTIFICATE_RBAC_PATH,
        me.textAll, [me.stringsArr['resourceGroups.textSystem'], me.stringsArr['resourceGroups.textCertificates']]);
    });
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private loadData(): void {
    let me = this,
        crumb: BreadcrumbModel,
        observable = me.getObservable();
    if (observable) {
      me.mask();
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          let data = dataset,
              total;
          me.dataset = data;
          me.records = me.systemType === 'proxy' ? me.dataset['vadps'] : me.dataset.records;
          total = me.dataset.total || me.records.length || 0;
          me.paginateConfig.refresh(total);
          crumb = new BreadcrumbModel(me.crumbTitle, me.dataset.url);
          me.breadcrumbs = me.resourceGroupsService.resetBreadcrumbs(me.breadcrumbs, crumb);
          me.unmask();
        },
        err => {
          me.handleError(err);
        }
      );
    }
  }

  private getObservable(): Observable<any> {
    let observable: Observable<any>,
        filter: Array<FilterModel> = [];
     if (this.systemType === 'ldap') {
      observable = this.ldapSmtpService.getLdapEntries();
      this.crumbTitle = this.stringsArr['ldap-smtp.textLdap'];
      this.allRbacPath = ResourceGroupsService.ALL_LDAP_RRAC_PATH;
      this.addAllItem = this.addAllLdapItem;
      this.hideAllButton = false;
    } else if (this.systemType === 'script') {
      observable = ScriptsModel.retrieve<ScriptModel, ScriptsModel>(ScriptsModel,
        this.rest, undefined, this.sorters, this.paginateConfig.pageStartIndex());
      this.crumbTitle = this.stringsArr['scripts.title'];
      this.allRbacPath = ResourceGroupsService.ALL_SCRIPTS_RBAC_PATH;
      this.addAllItem = this.addAllScriptItem;
      this.hideAllButton = false;
    } else if (this.systemType === 'scriptserver') {
      observable = this.appServerService.getScriptservers(undefined, this.paginateConfig.pageStartIndex());
      this.crumbTitle = this.stringsArr['resourceGroups.textScriptServers'];
      this.allRbacPath = ResourceGroupsService.ALL_SCRIPT_SERVERS_RBAC_PATH;
      this.addAllItem = this.addAllScriptServerItem;
      this.hideAllButton = false;
    } else if (this.systemType === 'site') {
      observable = SitesModel.retrieve<SiteModel, SitesModel>(SitesModel,
        this.rest, undefined, this.sorters, this.paginateConfig.pageStartIndex());
      this.crumbTitle = this.stringsArr['storage.textSite'];
      this.allRbacPath = ResourceGroupsService.ALL_SITE_RRAC_PATH;
      this.addAllItem = this.addAllSiteItem;
      this.hideAllButton = true;
    } else if (this.systemType === 'smtp') {
      observable = this.ldapSmtpService.getSmtpEntries();
      this.crumbTitle = this.stringsArr['ldap-smtp.textSmtp'];
      this.allRbacPath = ResourceGroupsService.ALL_SMTP_RRAC_PATH;
      this.addAllItem = this.addAllSmtpItem;
      this.hideAllButton = false;
    } else if (this.systemType === 'proxy') {
      observable = this.vadpService.getVMBackupProxies(this.paginateConfig.pageStartIndex());
      this.crumbTitle = this.stringsArr['hypervisor.textVADP'];
      this.allRbacPath = ResourceGroupsService.ALL_VADPS_RBAC_PATH;
      this.addAllItem = this.addAllVadpItem;
      this.hideAllButton = false;
    } else if (this.systemType === 'logs') {
      observable = this.getFakeLogs();
      this.crumbTitle = this.stringsArr['resourceGroups.textLogs'];
      this.allRbacPath = ResourceGroupsService.ALL_LOGS_RRAC_PATH;
      this.addAllItem = this.addAllLogItem;
      this.hideAllButton = false;
    } else if (this.systemType === 'disk') {
       observable = StoragesModel.retrieve<StorageModel, StoragesModel>(StoragesModel,
         this.rest, undefined, this.sorters, this.paginateConfig.pageStartIndex());
       this.crumbTitle = this.stringsArr['resourceGroups.textDisk'];
       this.allRbacPath = '';
       this.hideAllButton = true;
     } else if (this.systemType === 'cloud' || this.systemType === 'repo') {
       let op: string = this.systemType === 'repo' ? 'IN' : 'NOT IN';
       filter.push(new FilterModel('provider', 'sp', op));
       observable = CloudsModel.retrieve<CloudModel, CloudsModel>(CloudsModel,
         this.rest, filter, this.sorters, this.paginateConfig.pageStartIndex());
       this.crumbTitle = this.stringsArr['resourceGroups.textCloud'];
       this.allRbacPath = ResourceGroupsService.ALL_CLOUD_RBAC_PATH;
       this.addAllItem = this.addAllCloudItem;
       this.hideAllButton = true;
     } else if (this.systemType === 'key') {
       observable = KeysModel.retrieve<KeyModel, KeysModel>(KeysModel,
         this.rest, undefined, this.sorters, this.paginateConfig.pageStartIndex());
       this.crumbTitle = this.stringsArr['resourceGroups.textKeys'];
       this.allRbacPath = ResourceGroupsService.ALL_KEYS_RBAC_PATH;
       this.addAllItem = this.addAllKeyItem;
       this.hideAllButton = true;
     } else if (this.systemType === 'certificate') {
       observable = CertificatesModel.retrieve<CertificateModel, CertificatesModel>(CertificatesModel,
         this.rest, undefined, this.sorters, this.paginateConfig.pageStartIndex());
       this.crumbTitle = this.stringsArr['resourceGroups.textCertificates'];
       this.allRbacPath = ResourceGroupsService.ALL_CERTIFICATE_RBAC_PATH;
       this.addAllItem = this.addAllCertificateItem;
       this.hideAllButton = false;
     }
    return observable;
  }

  private getFakeLogs(): Observable<any> {
    let observable = Observable.create(
      (observer) => {
        let fakeDataset = new ResourceGroupsModel(),
            auditLog = new ResourceGroupModel(),
            systemLog = new ResourceGroupModel();
        auditLog.name = this.stringsArr['resourceGroups.textAuditLogs'];
        auditLog.rbacPath = 'root:0/log.all:0/log.type:audit';
        auditLog.links = {self: {href: 'auditlog/all', rel: 'related'}};
        systemLog.name = this.stringsArr['resourceGroups.textSystemLogs'];
        systemLog.rbacPath = 'root:0/log.all:0/log.type:system';
        systemLog.links = {self: {href: 'systemlog/all', rel: 'related'}};
        fakeDataset.links = {self: {href: '', rel: 'related'}};
        fakeDataset.total = 2;
        fakeDataset.resourceGroups = [auditLog, systemLog];
        observer.next(fakeDataset);
        observer.complete();
      }
    );
    return observable;
}

  private onRefresh(): void {
    this.loadData();
  }

  private handleError(err: any): void {
    this.unmask();
    this.resourceGroupsService.handleError(err);
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.records = [];
    this.dataset = undefined;
    this.systemType = undefined;
    this.crumbTitle = undefined;
  }
}

