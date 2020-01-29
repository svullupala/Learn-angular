import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

/**
 * Return the correct job type
 *
 * Usage:
 *    value | jobTypeDisplay
 * Example:
 *  'catalog' will return 'Inventory'
 */
@Pipe({name: 'jobTypeDisplay'})
export class JobTypeDisplayPipe implements PipeTransform {

  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService) {
  }

  transform(type: string): string {
    let me = this;

    // initial resource strings if we haven't yet
    if (me.resourceStrings === undefined) {
      me.initializeResourceStrings();
    }
    if (typeof type === 'string') {
      switch (type) {
        case 'catalog':
          return me.resourceStrings['common.textInventory'];
        case 'BACKUP':
        case 'protection':
          return me.resourceStrings['common.textBackup'];
        case 'recovery':
          return me.resourceStrings['common.textRestore'];
        case 'restore':
          return me.resourceStrings['common.textRestoreFile'];
        case 'analyze':
          return me.resourceStrings['common.textReport'];
        case 'misc':
          return me.resourceStrings['common.textMisc'];
        case 'maintenance':
          return me.resourceStrings['common.textMaintenance'];
        case 'script':
          return me.resourceStrings['common.textScript'];
        case 'REPLICATION':
          return me.resourceStrings['common.textReplication'];
        case 'SPPOFFLOAD':
          return me.resourceStrings['common.textOffload'];
        default:
          return type;
      }
    }
    return me.resourceStrings['common.textNone'];
  }

  private initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'common.textInventory',
      'common.textBackup',
      'common.textRestore',
      'common.textReplication',
      'common.textOffload',
      'common.textRestoreFile',
      'common.textReport',
      'common.textMisc',
      'common.textNone',
      'common.textMaintenance',
      'common.textScript'], {})
      .subscribe((resource: Array<string>) => {
        me.resourceStrings = resource;
      });
  }
}
