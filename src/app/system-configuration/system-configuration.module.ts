import {NgModule} from '@angular/core';
import {routing} from './system-configuration.routing';
import {VadpProxyMonitorModule} from './vadp-proxy-monitor/vadp-proxy-monitor.module';
import {LdapSmtpModule} from './ldap-smtp/ldap-smtp.module';
import {SiteModule} from './site/site.module';
import {SystemConfigurationComponent} from './system-configuration.component';
import {AccessKeysModule} from './access-keys/access-keys.module';
import {CertificatesModule} from './certificates/certificates.module';
import {KeysAndCertificatesComponent} from './keys-and-certificates/key-and-certificates.component';
import {TranslationModule} from 'shared/translation.module';
import {NgaModule} from 'theme/nga.module';
import { SshKeysModule } from './ssh-keys/ssh-keys.module';
import {ScriptsModule} from 'scripts/scripts.module';
import { GlobalPreferencesModule } from "./global-preferences/global-preferences.module";
import { SharedModule } from 'shared';

@NgModule({
  imports: [
    routing,
    VadpProxyMonitorModule,
    SiteModule,
    LdapSmtpModule,
    AccessKeysModule,
    CertificatesModule,
    SshKeysModule,
    TranslationModule,
    NgaModule,
    ScriptsModule,
    GlobalPreferencesModule,
    SharedModule
  ],
  declarations: [
    SystemConfigurationComponent,
    KeysAndCertificatesComponent,
  ],
  providers: [
  ],
  exports: [
    KeysAndCertificatesComponent,
  ]
})

export class SystemConfigurationModule {
}
