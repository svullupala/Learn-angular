import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';

export enum DurationDisplayType {
  LONG,
  SHORT,
  SHORT_NOSECS,
  LONG_NOSECS
}

/**
 * Convert a duration in milliseconds {Number} into a displayable string.
 *
 * Usage:
 *    value | durationDisplay
 * Example:
 *    <Add Example here>
 */
@Pipe({name: 'durationDisplay'})
export class DurationDisplayPipe implements PipeTransform {

  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService) {
  }

  transform(duration: number, formatType: DurationDisplayType): string {
    let me = this;

    // initial resource strings if we haven't yet
    if (me.resourceStrings === undefined) {
      me.initializeResourceStrings();
    }
    return me.elapsedTimeFormatter(duration, formatType);
  }

  initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'common.textSecond',
      'common.textMinute',
      'common.textHour',
      'common.textSeconds',
      'common.textMinutes',
      'common.textHours'], {})
      .subscribe((resource: Array<string>) => {
        me.resourceStrings = resource;
      });
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  shortFormat(hours, minutes, seconds) {
    let me = this,
      tpl = '{0}h {1}m {2}s';
    return SharedService.formatString(tpl, hours, minutes, seconds);
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */
  longFormat(hours, minutes, seconds) {
    let me = this,
      tpl = '{0} {1} {2}';

    return SharedService.formatString(tpl,
      me.plural(hours,
        me.resourceStrings['common.textHour'] || 'hour',
        me.resourceStrings['common.textHours'] || 'hours'),
      me.plural(minutes,
        me.resourceStrings['common.textMinute'] || 'minute',
        me.resourceStrings['common.textMinutes'] || 'minutes'),
      me.plural(seconds,
        me.resourceStrings['common.textSecond'] || 'second',
        me.resourceStrings['common.textSeconds'] || 'seconds'));
  }

  /**
   * Pluralization helper.
   */
  private plural(value, singularStr, pluralStr) {
    return value > 1 ? `${value}${pluralStr}` : `${value}${singularStr}`;
  }

  /*
   * Returns a formatted string given the duration returned from backend.
   *
   * @method elapsedTimeFormatter
   * @param milliseconds {Number} The duration in milliseconds.
   * @param shortFmt {Boolean} True to return abbreviated units. Defaults to false
   * @return {String} The time elapsed
   */
  private elapsedTimeFormatter(milliseconds: number, formatType: DurationDisplayType) {
    let me = this,
      seconds = Math.floor(milliseconds / 1000),
      minutes = Math.floor(seconds / 60),
      hours = Math.floor(minutes / 60);

    minutes = minutes - (60 * hours);
    seconds = seconds - (60 * 60 * hours) - (60 * minutes);
  
    switch(formatType) {
      case DurationDisplayType.LONG: {
        return me.longFormat(hours, minutes, seconds);
      }
      case DurationDisplayType.SHORT: {
        return me.shortFormat(hours, minutes, seconds);
      }
      default: {
        return me.longFormat(hours, minutes, seconds);
      }
    }
  }
}
