import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

/**
 * Return the correct job type
 *
 * Usage:
 *    value | jobSubPolicyTypeDisplay
 * Example:
 *  'REPLICATION' will return '-Replication'
 */
@Pipe({name: 'jobSubPolicyTypeDisplay'})
export class JobSubPolicyTypeDisplayPipe implements PipeTransform {

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
        case 'BACKUP':
          return me.resourceStrings[""];
        case 'REPLICATION':
          return me.resourceStrings['common.textSubTypeReplication'];
        case 'SPPOFFLOAD':
          return me.resourceStrings['common.textSubTypeOffload'];
        case 'SPPARCHIVE':
          return me.resourceStrings['common.textSubTypeArchive'];
        case 'SNAPSHOT':
          return me.resourceStrings['common.textSubTypeSnapshot'];
        case 'MIRROR':
          return me.resourceStrings['common.textSubTypeMirror'];
        case 'VMCOPY':
          return me.resourceStrings['common.textSubTypeVMCopy'];
        case 'HYBRID':
          return me.resourceStrings['common.textSubTypeHybrid'];
        default:
          return type;
      }
    }
    return me.resourceStrings[""];
  }

  private initializeResourceStrings() {
    let me = this;
    me.resourceStrings = [];
    me.translateService.get([
      'common.textSubTypeReplication',
      'common.textSubTypeOffload',
      'common.textSubTypeSnapshot',
      'common.textSubTypeMirror', 
      'common.textSubTypeVMCopy',
      'common.textSubTypeHybrid',
      'common.textSubTypeArchive'], {})
      .subscribe((resource: Array<string>) => {
        me.resourceStrings = resource;
      });
  }
}
