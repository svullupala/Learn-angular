import { Routes, RouterModule } from '@angular/router';
import { SystemConfigurationComponent } from './system-configuration.component';
import { VadpProxyMonitorComponent } from './vadp-proxy-monitor/vadp-proxy-monitor.component';
import { SitesComponent } from 'site/sites.component';
import { LdapSmtpView } from './ldap-smtp/ldap-smtp.view';
import { KeysAndCertificatesComponent } from './keys-and-certificates/key-and-certificates.component';
import { ScriptsComponent } from 'scripts/scripts.component';
import { GlobalPreferencesComponent } from "./global-preferences/global-preferences.component";

const routes: Routes = [
  {
    path: '',
    component: SystemConfigurationComponent,
    children: [
      {
        path: 'backupstorage',
        loadChildren: 'app/system-configuration/backup-storage/backup-storage.module#BackupStorageModule'
      },
      { path: 'vadpproxymonitor', component: VadpProxyMonitorComponent },
      { path: 'site', component: SitesComponent },
      { path: 'ldapsmtp', component: LdapSmtpView },
      { path: 'scripts', component: ScriptsComponent },
      { path: 'keysandcertificates', component: KeysAndCertificatesComponent },
      { path: 'globalpreferences', component: GlobalPreferencesComponent}
    ]
  }
];

export const routing = RouterModule.forChild(routes);
