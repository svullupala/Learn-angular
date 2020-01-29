import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

/**
 * Return the correct description for a given serviceId.
 *
 * Usage:
 *    value | serviceIdDisplay
 * Example:
 *  'serviceprovider.protection.hypervisor' will return 'Hypervisor Backup'
 */
@Pipe({name: 'serviceIdDisplay'})
export class ServiceIdDisplayPipe implements PipeTransform {

  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService) {
  }

  transform(serviceId: string): string {
    let me = this;

    // initial resource strings if we haven't yet
    if (me.resourceStrings === undefined) {
      me.initializeResourceStrings();
    }

    if (typeof serviceId === 'string') {
      switch (serviceId) {
        case 'serviceprovider.protection.hypervisor':
          return me.resourceStrings['common.textHypervisorBackup'];
        case 'serviceprovider.protection.application':
          return me.resourceStrings['common.textDatabaseBackup'];
        case 'serviceprovider.protection.catalog':
          return me.resourceStrings['common.textCatalogBackup'];
        default:
          return '';
      }
    }
    console.error('Must provide a string of type job in job-display pipe.');
  }

  private initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'common.textHypervisorBackup',
      'common.textCatalogBackup',
      'common.textDatabaseBackup'], {})
      .subscribe((resource: Array<string>) => {
        me.resourceStrings = resource;
      });
  }
}
