import {Pipe, PipeTransform} from '@angular/core';
import {isNumeric} from 'rxjs/util/isNumeric';

/**
 * Return the the on demand restore name without the epoch time
 *
 * Usage:
 *    jobName | ondemandSessionName
 * Example:
 *  'onDemandRestore_1503254132099' will return 'onDemandRestore'
 */
@Pipe({name: 'ondemandSessionName'})
export class OnDemandSessionNamePipe implements PipeTransform {

  transform(jobName: string): string {
    let me = this,
        regEx = /\_\d{13,}$/, // matches "_7398247839274",
        idx, ts = false;

    if (typeof jobName === 'string') {
      typeof regEx[Symbol.search] === 'function'
        ? (idx = regEx[Symbol.search](jobName))
        : (idx = regEx.test(jobName) === true ? jobName.indexOf('_') : -1);

      if (idx !== -1)
        ts = me.isTimestamp(jobName.substring(idx + 1));

      return ts ?  jobName.substring(0, idx) :  jobName;
    }
    console.error('Must provide a valid string for ondemandSessionName pipe');
  }

  private isTimestamp(value: any): boolean {
    return isNumeric(value) && '' + value === '' + Number(value);
  }
}
