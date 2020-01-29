import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DecimalPipe} from '@angular/common';
import {LocaleService} from '../locale.service';

/**
 * Convert numeric file size into a string with traditional unit (xxx bytes, xxx KB, xxx MB, xxx GB, xxx TB).
 *
 * Usage:
 *    value | fileSize
 * Example:
 *    <Add Example here>
 */
@Pipe({name: 'fileSize'})
export class FileSizePipe implements PipeTransform {
  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService, private decimalPipe: DecimalPipe) {
  }

  transform(value: number, flag: 0|1|2 = 0): string {
    let me = this;

    // initial resource strings if we haven't yet
    if (me.resourceStrings === undefined) {
      me.initializeResourceStrings();
    }
    return me.formatFileSize(value, flag);
  }

  initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'common.textBytes',
      'common.textKilobytes',
      'common.textMegabytes',
      'common.textGigabytes',
      'common.textTerabytes'
    ]).subscribe((resource: Array<string>) => {
      me.resourceStrings = resource;
    });
  }

  /**
   * Simple format for a file size (xxx bytes, xxx KB, xxx MB, xxx GB, xxx TB)
   *
   * @method formatFileSize
   * @param {number} value The numeric value to format
   * @param {0|1|2} flag  A flag to indicate the section: 0 - value + unit; 1 - value only; 2 - unit only.
   * @return {string} The formatted file size
   */
  formatFileSize(value: number, flag: 0|1|2 = 0): string {
    let me = this,
      size = value,
      unit = '';

    if (value < 1024) {
      size = value;
      unit = me.resourceStrings['common.textBytes'];
    } else if (value < 1048576) {
      size = Math.round((value * 10) / 1024) / 10;
      unit = me.resourceStrings['common.textKilobytes'];
    } else if (value < 1073741824) {
      size = Math.round((value * 10) / 1048576) / 10;
      unit = me.resourceStrings['common.textMegabytes'];
    } else if (value < 1099511627776) {
      size = Math.round((value * 10 ) / 1073741824) / 10;
      unit = me.resourceStrings['common.textGigabytes'];
    } else {
      size = Math.round((value * 10) / 1099511627776) / 10;
      unit = me.resourceStrings['common.textTerabytes'];
    }
    if (flag === 0)
      return me.decimalPipe.transform(Number(size)) + ' ' + unit;
    else if (flag === 1)
      return me.decimalPipe.transform(Number(size));
    else
      return unit;
  }

}
