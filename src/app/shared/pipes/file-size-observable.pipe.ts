import {Pipe, PipeTransform} from '@angular/core';
import { FileSizePipe } from './file-size.pipe';
import {Observable} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';


@Pipe({name: 'fileSizeObservable'})
export class FileSizeObservablePipe implements PipeTransform {
  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService, private fileSizePipe: FileSizePipe, private decimalPipe: DecimalPipe) {
  }
      
  transform(value: number, flag: 0|1|2 = 0): Observable<string> {
    let me = this;
    //If reourceStrings is undefined, resourceStrings are initialized
    if (me.resourceStrings === undefined || me.resourceStrings.length == 0) 
      return me.initializeResourceStrings(value, flag);
    return me._trans(value, flag);
    }
    
    initializeResourceStrings(value: number, flag: any): Observable<string> {
      let me = this;
      me.resourceStrings = [];
      return me.translateService.get([
        'common.textBytes',
        'common.textKilobytes',
        'common.textMegabytes',
        'common.textGigabytes',
        'common.textTerabytes'
      ]).map((resource: Array<string>) => {
          me.resourceStrings = resource;
          return me.formatFileSize(value, flag);
      });
    }

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

    _trans(value: number, flag: any): Observable<string> {
      let me = this;
      return Observable.of(me.formatFileSize(value, flag));
    }
  }