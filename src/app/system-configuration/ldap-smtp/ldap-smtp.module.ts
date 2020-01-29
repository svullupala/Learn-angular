import {NgModule}      from '@angular/core';
import {NgaModule}    from 'theme/nga.module';
import {CommonModule} from '@angular/common';
import {TranslationModule} from 'shared';
import {LoaderModule} from 'shared/components/loader/loader.module';
import {SharedModule} from 'shared';

import {LdapSmtpView} from './ldap-smtp.view';
import {LdapSmtpService} from './ldap-smtp.service';

import {LdapRegisterComponent} from './ldap-register/ldap-register.component';
import {LdapTableComponent} from './ldap-table/ldap-table.component';
import {SmtpRegisterComponent} from './smtp-register/smtp-register.component';
import {SmtpTableComponent} from './smtp-table/smtp-table.component';

@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    TranslationModule,
    SharedModule,
    LoaderModule
  ],
  declarations: [
    LdapSmtpView,
    LdapRegisterComponent,
    LdapTableComponent,
    SmtpRegisterComponent,
    SmtpTableComponent
  ],
  providers: [
    LdapSmtpService
  ],
  exports: []
})
export class LdapSmtpModule {
}
