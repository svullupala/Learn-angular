import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';

import {SharedService} from 'shared/shared.service';

/**
 * Convert subpolicy array into a Observable with displayable string according to the type.
 *
 * Usage:
 *    value | subPolicyDisplay | async
 * Example:
 *    <Add Example here>
 */
@Pipe({name: 'subPolicyDisplay'})
export class SubPolicyDisplayPipe implements PipeTransform {
  private resourceStrings: Array<string>;

  constructor(private translateService: TranslateService) {
  }

  transform(spec: any, type: string): Observable<string> {
    let me = this;
    if (me.resourceStrings === undefined || me.resourceStrings.length == 0) {
      return me._initTrans(spec, type);
    } else {
      return me._trans(spec, type);
    }
  }

  _initTrans(spec: any, type: string): Observable<string> {
    let me = this;
    me.resourceStrings = [];
    return me.translateService.get([
      'slapolicy.tplDays',
      'slapolicy.tplWeeks',
      'slapolicy.tplMonths',
      'slapolicy.tplYears',
      'slapolicy.tplSnapshots',
      'slapolicy.textVADP',
      'slapolicy.textReplication',
      'slapolicy.textOffload',
      'slapolicy.textArchive',
      'slapolicy.textSameRetentionAsSourceSelection'
    ]).map((resource: Array<string>) => {
      me.resourceStrings = resource;
      return me._transform(spec, type);
    });
  }

  _trans(spec: any, type: string): Observable<string> {
    let me = this;
    return Observable.of(me._transform(spec, type));
  }

  _transform(spec: any, type: string): string {
    let me = this,
        simple = spec.simple !== undefined ? spec.simple : true,
        subpolicy = spec.subpolicy || spec,
        resultString = '';

    subpolicy.forEach(function(eachSubpolicy) {
      if (type === 'snapshot' && eachSubpolicy.type === 'SNAPSHOT') {
        resultString = me.addToString(resultString, me.createSnapshotString(eachSubpolicy, simple));
      }
      if (type === 'replication' && eachSubpolicy.type === 'REPLICATION') {
        resultString = me.addToString(resultString, me.createReplicationString(eachSubpolicy, simple));
      }
      if (type === 'replication' && eachSubpolicy.type === 'SPPOFFLOAD') {
        if (me.isWormProtected(eachSubpolicy)) {
          resultString = me.addToString(resultString, me.createOffloadWORMString(eachSubpolicy, simple)); 
        } else {
          resultString = me.addToString(resultString, me.createOffloadString(eachSubpolicy, simple)); 
        }
      }
      if (type === 'replication' && eachSubpolicy.type === 'SPPARCHIVE') {
        if (me.isWormProtected(eachSubpolicy)) {
          resultString = me.addToString(resultString, me.createArchiveWORMString(eachSubpolicy, simple)); 
        } else {
          resultString = me.addToString(resultString, me.createArchiveString(eachSubpolicy, simple)); 
        }
      }
      if (type === 'replicationSite' && eachSubpolicy.type === 'REPLICATION') {
        resultString += me.createReplicationSiteString(eachSubpolicy, simple);
      }
    });

    return resultString;
  }

  isWormProtected(subpolicy: any): boolean {
     if ((subpolicy !== undefined) 
          && (subpolicy.target !== undefined) 
          && (subpolicy.target.wormProtected !== undefined)) {
        return subpolicy.target.wormProtected; 
     }
     
     return false;
  }

  createSnapshotString(eachSubpolicy: any, simple: boolean) {
    var retention = simple === true ? eachSubpolicy.retention : eachSubpolicy.spec.option.retention;
    return this.getRetentionString(retention);
  }

  createReplicationString(eachSubpolicy: any, simple: boolean) {
    var me = this,
        retention = simple === true ? eachSubpolicy.retention : eachSubpolicy.spec.option.retention;
    // For SPP 3.0, we only have VADP.  Post 3.0, we can uncomment the following code
    // return (eachSubpolicy.software === true ?
    //   me.resourceStrings['slapolicy.textVADP'] : me.resourceStrings['slapolicy.textReplication']) + ': ' +
    //   me.getRetentionString(retention);
    return (eachSubpolicy.software === true ?
       '' : me.resourceStrings['slapolicy.textReplication'] + ': ') + me.getRetentionString(retention, true);
  }

  createOffloadString(eachSubpolicy: any, simple: boolean) {
    var me = this,
        retention = simple === true ? eachSubpolicy.retention : eachSubpolicy.spec.option.retention;
    return (eachSubpolicy.software === true ?
       '' : me.resourceStrings['slapolicy.textOffload'] + ': ') + me.getRetentionString(retention, true);
  }

  createOffloadWORMString(eachSubpolicy: any, simple: boolean) {
    var me = this,
        retention = simple === true ? eachSubpolicy.retention : eachSubpolicy.spec.option.retention;
    return (eachSubpolicy.software === true ?
       '' : me.resourceStrings['slapolicy.textOffload'] + ': WORM');
  }

  createArchiveString(eachSubpolicy: any, simple: boolean) {
    var me = this,
        retention = simple === true ? eachSubpolicy.retention : eachSubpolicy.spec.option.retention;
    return (eachSubpolicy.software === true ?
       '' : me.resourceStrings['slapolicy.textArchive'] + ': ') + me.getRetentionString(retention, true);
  }

  createArchiveWORMString(eachSubpolicy: any, simple: boolean) {
    var me = this,
        retention = simple === true ? eachSubpolicy.retention : eachSubpolicy.spec.option.retention;
    return (eachSubpolicy.software === true ?
       '' : me.resourceStrings['slapolicy.textArchive'] + ': WORM');
  }

  createReplicationSiteString(eachSubpolicy: any, simple: boolean) {
    var me = this;
    // if simple is false, there is no replication site info.
    if (simple === true) {
      return (eachSubpolicy.software === true ?
        me.resourceStrings['slapolicy.textVADP'] : me.resourceStrings['slapolicy.textReplication']) +
        ': ' + eachSubpolicy.site;
    } else {
      return '';
    }
  }

  getRetentionString(retention: any, replication?: boolean) {
    if (retention.age !== undefined) {
      let converted = this._convertDays(retention.age);
      return SharedService.formatString(this.resourceStrings[converted.type], converted.value);
    } else if (retention.numsnapshots !== undefined) {
      return SharedService.formatString(
        this.resourceStrings['slapolicy.tplSnapshots'], retention.numsnapshots);
    } else if (replication) {
      return this.resourceStrings['slapolicy.textSameRetentionAsSourceSelection'];
    }
  }


  addToString(result: string, needToAdd: string) {
    if (result.length > 0) {
      result += ', ' + needToAdd;
    } else {
      result = needToAdd;
    }
    return result;
  }

  private _convertDays(value: number): {type: string, value: number} {
    let retVal: any = {type: 'slapolicy.tplDays', value: value};

    if (value % 365 === 0) {
      retVal.type = 'slapolicy.tplYears';
      retVal.value = value / 365;
    } else if (value % 30 === 0) {
      retVal.type = 'slapolicy.tplMonths';
      retVal.value = value / 30;
    } else if (value % 7 === 0) {
      retVal.type = 'slapolicy.tplWeeks';
      retVal.value = value / 7;
    }

    return retVal;
  }

}
