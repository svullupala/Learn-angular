import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DateFormatPipe} from 'angular2-moment';
import {SharedService} from 'shared/shared.service';

/**
 * Convert rpo object into a displayable string.
 *
 * Usage:
 *    value | rpoDisplay
 * Example:
 *    <Add Example here>
 */
@Pipe({name: 'rpoDisplay'})
export class RpoDisplayPipe implements PipeTransform {
  private resourceStrings: Array<string>;
  private datePipe: DateFormatPipe;

  constructor(private translateService: TranslateService) {
    this.datePipe = new DateFormatPipe();
  }

  transform(spec: any, isNotSLA: boolean = false): string {
    let me = this,
        date = new Date(),
        minutes, hours, time, day,
        backupTarget,
        rpo;
    if (isNotSLA) {
      rpo = spec && spec.trigger ? spec.trigger : {type: ''};
    } else {
      if (!Array.isArray(spec.subpolicy)) {
        rpo = spec.trigger ? spec.trigger : { type: ''};
      } else {
        // clean this up if we don't need the dev logic to determine old/intermediate rpo format
        backupTarget = spec.subpolicy.find(function (item) {
          return (item['type'] === 'REPLICATION' && item['software']) || (item['type'] === 'SNAPSHOT');
        }) || {};
        rpo = spec.simple === true ? (backupTarget.trigger ? backupTarget.trigger : {type: ''}) : spec.option.rpo;
      }
    }
    if (!rpo.type){
      return '';
    }

    // initial resource strings if we haven't yet
    if (me.resourceStrings === undefined) {
      me.initializeResourceStrings();
    }

    date.setTime(rpo.activateDate);
    minutes = date.getMinutes();
    hours = date.getHours();
    // time = date.toLocaleTimeString('en-us', {hour12: false});
    time = me.datePipe.transform(date, 'LTS');

    switch (rpo.type) {
      case 'SUBHOURLY':
        return SharedService.formatString(
          me.resourceStrings['slapolicy.tplMinuteRpo'], rpo.frequency);
      case 'HOURLY':
          return SharedService.formatString(
            me.resourceStrings['slapolicy.tplRpoOnTheHour'], rpo.frequency);
      case 'DAILY':
          return SharedService.formatString(
            me.resourceStrings['slapolicy.tplRpoDaily'], rpo.frequency, time);
      case 'WEEKLY':
        if (rpo.dowList === undefined) {
          console.error('dowList is undefined');
          return '';
        }
        return me.getWeekDayString(rpo.dowList, rpo.frequency, time);
      case 'MONTHLY':
        if (rpo.domList === undefined) {
          console.error('domList is undefined');
          return '';
        }
        return me.getDayOfMonthString(this.getDom(rpo.domList), rpo.frequency, time);
      default:
          console.error('Incorrect rpo type detected in rpo-display pipe.');
          return '';
    }
  }

  initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'slapolicy.tplMinuteRpo',
      'slapolicy.tplRpoOnTheHour',
      'slapolicy.tplRpoHourly',
      'slapolicy.tplRpoDaily',
      'slapolicy.tplRpoWeekly',
      'slapolicy.tplRpoMonthly',
      'slapolicy.tplRpoStEveryMonth',
      'slapolicy.tplRpoNdEveryMonth',
      'slapolicy.tplRpoRdEveryMonth',
      'slapolicy.tplRpoThEveryMonth',
      'slapolicy.tplRpoEverySunday',
      'slapolicy.tplRpoEveryMonday',
      'slapolicy.tplRpoEveryTuesday',
      'slapolicy.tplRpoEveryWednesday',
      'slapolicy.tplRpoEveryThurday',
      'slapolicy.tplRpoEveryFriday',
      'slapolicy.tplRpoEverySaturday'
    ]).subscribe((resource: Array<string>) => {
      me.resourceStrings = resource;
    });
  }

  getWeekDayString(dowList: Array<boolean>, frequency: number, time: string): string {
    let me = this,
        result: string;
    if (dowList instanceof Array && dowList.length === 8) {
      if (dowList[1] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEverySunday'], frequency, time);
      } else if (dowList[2] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEveryMonday'], frequency, time);
      } else if (dowList[3] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEveryTuesday'], frequency, time);
      } else if (dowList[4] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEveryWednesday'], frequency, time);
      } else if (dowList[5] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEveryThurday'], frequency, time);
      } else if (dowList[6] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEveryFriday'], frequency, time);
      } else if (dowList[7] !== false) {
        result = SharedService.formatString(me.resourceStrings['slapolicy.tplRpoEverySaturday'], frequency, time);
      }
    }
    return result;
  }

  getDom(domList: Array<boolean>): number {
    for (let d = 0; d < domList.length; d++){
      if (domList[d]){
        return d;
      }
    }
  }

  getDayOfMonthString(day: number, frequency: number, time: string): string {
    let i = day % 10, // ex: 1 % 10 = 1,
        j = day % 100; // ex: 12 % 100 = 12
    if (i === 1 && j !== 11) {
      return SharedService.formatString(this.resourceStrings['slapolicy.tplRpoStEveryMonth'], frequency, day,  time);
    } else if (i === 2 && j !== 12) {
      return SharedService.formatString(this.resourceStrings['slapolicy.tplRpoNdEveryMonth'], frequency, day, time);
    } else if (i === 3 && j !== 13) {
      return SharedService.formatString(this.resourceStrings['slapolicy.tplRpoRdEveryMonth'], frequency, day, time);
    }
    return SharedService.formatString(this.resourceStrings['slapolicy.tplRpoThEveryMonth'], frequency, day, time);
  }
}
