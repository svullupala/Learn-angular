import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DecimalPipe} from '@angular/common';

/**
 * Convert numeric storage size into a string with binary prefix unit defined by
 * the International Electrotechnical Commission (IEC) (xxx bytes, xxx KiB, xxx MiB, xxx GiB, xxx TiB).
 *
 * Usage:
 *    value | storageSize
 * Example:
 *    <Add Example here>
 */
@Pipe({name: 'storageSize'})
export class StorageSizePipe implements PipeTransform {
  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService, private decimalPipe: DecimalPipe) {
  }

  transform(value: number): string {
    let me = this;

    // initial resource strings if we haven't yet
    if (me.resourceStrings === undefined) {
      me.initializeResourceStrings();
    }
    return me.formatStorageSize(value);
  }

  initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'common.textBytes',
      'common.textKibibytes',
      'common.textMebibytes',
      'common.textGibibytes',
      'common.textTebibytes'
    ]).subscribe((resource: Array<string>) => {
      me.resourceStrings = resource;
    });
  }

  /**
   * Simple format for a storage size (xxx bytes, xxx KiB, xxx MiB, xxx GiB, xxx TiB)
   *
   * @method formatStorageSize
   * @param {number} value The numeric value to format
   * @return {string} The formatted storage size
   */
  formatStorageSize(value: number): string {
    let me = this,
      size = value,
      unit = '';

    if (value < 1024) {
      size = value;
      unit = me.resourceStrings['common.textBytes'];
    } else if (value < 1048576) {
      size = Math.round((value * 10) / 1024) / 10;
      unit = me.resourceStrings['common.textKibibytes'];
    } else if (value < 1073741824) {
      size = Math.round((value * 10) / 1048576) / 10;
      unit = me.resourceStrings['common.textMebibytes'];
    } else if (value < 1099511627776) {
      size = Math.round((value * 10 ) / 1073741824) / 10;
      unit = me.resourceStrings['common.textGibibytes'];
    } else {
      size = Math.round((value * 10) / 1099511627776) / 10;
      unit = me.resourceStrings['common.textTebibytes'];
    }

    return me.decimalPipe.transform(Number(size)) + ' ' + unit;
  }

}
