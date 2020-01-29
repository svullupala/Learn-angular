import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

/**
 * Convert the word "Policy" to "Job" string.  This should not really be needed if backend made the change on their
 * end but I am too tired of asking and be turned down. GRRRRRRRRRRRR.
 *
 * Usage:
 *    value | BooleanPipe
 * Example:
 *    <True returns "Yes">
 */
@Pipe({name: 'rolesecuritygroupname'})
export class RoleSecurityGroupNamePipe implements PipeTransform {
  private resource: Array<string>;

  constructor(private translateService: TranslateService) {}

  transform(value: string): string {
    if (this.resource === undefined || this.resource.length === 0) {
      this.initializeStrings();
    }
    // Don't need to worry about L10N since this is a key returning from the backend.
    switch (value) {
      case 'Policy':
        return this.resource['job.textJob'];
      case 'Storage Work Flow':
        return this.resource['slapolicy.textSLAPolicy'];
      case 'Resource Pool':
        return this.resource['menubar.submenu.textResourceGroup'];
      case 'Proxy':
        return this.resource['hypervisor.textSelectVADPProxy'];
      case 'Storage':
        return this.resource['slapolicy.textSLABackupTarget'];
      case 'LDAP':
        return this.resource['ldap-smtp.textLdap'];
      case 'Certificate':
        return this.resource['certificates.textCertificate'];
      case 'Cloud':
        return this.resource['cloud.textCloud'];
      case 'Application':
        return this.resource['application.textApplication'];
      case 'Application Server':
        return this.resource['application.textApplicationServer'];
      case 'Hypervisor':
        return this.resource['resourceGroups.textHypervisor'];
      case 'Identity and Keys':
        return this.resource['common.textIdentityAndKeys'];
      case 'Log':
        return this.resource['job.textLogFile'];
      case 'VADP Proxy':
        return this.resource['menubar.submenu.textVADPProxy'];
      case 'Report':
        return this.resource['reports.textReport'];
      case 'Role':
        return this.resource['resourceGroups.textRoles'];
      case 'Script':
        return this.resource['common.textScript'];
      case 'Script Server':
        return this.resource['resourceGroups.textScriptServers'];
      case 'Site':
        return this.resource['common.textSite'];
      case 'SMTP':
        return this.resource['ldap-smtp.textSmtp'];
      case 'User':
        return this.resource['resourceGroups.textUsers'];
      case 'Screen':
        return this.resource['resourceGroups.textScreens'];
      default:
        return value;
    }
  }


  initializeStrings() {
    let me = this;
    me.translateService.get([
      'job.textJob',
      'slapolicy.textSLAPolicy',
      'menubar.submenu.textResourceGroup',
      'hypervisor.textSelectVADPProxy',
      'slapolicy.textSLABackupTarget',
      'ldap-smtp.textLdap',
      'certificates.textCertificate',
      'cloud.textCloud',
      'application.textApplication',
      'application.textApplicationServer',
      'resourceGroups.textHypervisor',
      'common.textIdentityAndKeys',
      'job.textLogFile',
      'menubar.submenu.textVADPProxy',
      'reports.textReport',
      'resourceGroups.textRoles',
      'common.textScript',
      'common.textSite',
      'ldap-smtp.textSmtp',
      'resourceGroups.textScriptServers',
      'resourceGroups.textUsers',
      'resourceGroups.textScreens'
    ]).subscribe((resource: Array<string>) => {
      me.resource = resource;
    });
  }
}
