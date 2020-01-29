import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

/**
 * Convert boolean into a 'Yes' or 'No' string.
 *
 * Usage:
 *    value | BooleanPipe
 * Example:
 *    <True returns "Yes">
 */
@Pipe({name: 'boolean'})
export class BooleanPipe implements PipeTransform {
  private yesText: string;
  private noText: string;

  constructor(private translateService: TranslateService) {}

  transform(value: boolean): string {
    this.initializeStrings();
    return value ? this.yesText : this.noText;
  }

  initializeStrings() {
    let me = this;
    me.translateService.get([
      'common.textYes',
      'common.textNo',
    ]).subscribe((resource: Array<string>) => {
      me.yesText = resource['common.textYes'];
      me.noText = resource['common.textNo'];
    });
  }
}
