import {HttpErrorResponse} from '@angular/common/http';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {HasProxy, RestService} from 'core';

@JsonObject
export class ConfigGroupTestModel {
  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('status', String, true)
  public status: string = undefined;

  @JsonProperty('statusDetail', String, true)
  public statusDetail: string = undefined;
}

@JsonObject
export class ConfigGroupModel {

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('tests', [ConfigGroupTestModel], true)
  public tests: ConfigGroupTestModel[] = undefined;

  @JsonProperty('groupTestsComplete', Boolean, true)
  public groupTestsComplete: boolean = false;

}

@JsonObject
export class ConfigGroupsModel implements HasProxy {

  proxy: RestService;

  @JsonProperty('configGroups', [ConfigGroupModel], true)
  public configGroups: ConfigGroupModel[] = [];

  @JsonProperty('testsComplete', Boolean, true)
  public testsComplete: boolean = false;

  public static dummyData(): Observable<ConfigGroupsModel> {
    let result: ConfigGroupsModel, data = {
      'configGroups': [ // contains at least one group named 'LINUX', 'AIX' or 'WINDOWS'
        {
          'name': 'LINUX',
          'description': 'Basic Linux pre-requisites for file and volume operations',
          'tests': [
            {
              'name': 'Sudo Privileges', // short display string
              'description': 'User must have password-less sudo privileges', // more detailed one-sentence description
              'status': 'SUCCESS', // SUCCESS, FAILURE, WARNING
              'statusDetail': null
            },
            {
              'name': 'LVM Metadata Service',
              'description': 'Service lvm2-lvmetad must be disabled',
              'status': 'FAILURE',
              'statusDetail': 'Service lvm2-lvmetad is running'
            }
          ]
        },
        {
          'name': 'ORACLE', // additional app group is present only in application is installed
          'description': 'Pre-requisites for discovery, backup, and restore of Oracle databases',
          'tests': [
            {
              'name': 'Inventory Permissions',
              'description': 'User must be in the Oracle inventory group',
              'status': 'SUCCESS',
              'statusDetail': null
            },
            {
              'name': 'ASM Disk String',
              'description': 'SPP pattern must be part of the ASM_DISKSTRING configuration',
              'status': 'WARNING',
              'statusDetail': 'SPP pattern not found in ASM_DISKSTRING'
            }
          ]
        }
      ]
    };
    try {
      result = <ConfigGroupsModel>JsonConvert.deserializeObject(data, ConfigGroupsModel);
    } catch (e) {
    }
    return Observable.of(result).delay(1000).do(val => val);
  }

  protected getRecords(): Array<ConfigGroupModel> {
    return this.configGroups;
  }
}

@JsonObject
export class ConfigGroupsTestTaskModel extends ConfigGroupsModel {

  @JsonProperty('statusHref', String, true)
  public statusHref: string = undefined;

  query(proxy?: RestService): Observable<ConfigGroupsTestTaskModel> {
    let me = this, observable: Observable<Object>,
      result: Observable<ConfigGroupsTestTaskModel>, url = me.statusHref;
    proxy = proxy || me.proxy;
    if (url && url.length > 0 && proxy) {
      observable = proxy.getByUrl(url);
      result = observable.map((response: Object) => {
        const data = response;
        let record: ConfigGroupsTestTaskModel;
        try {
          record = <ConfigGroupsTestTaskModel> JsonConvert.deserializeObject(data, ConfigGroupsTestTaskModel);
          record.proxy = proxy;
          record.statusHref = me.statusHref;
        } catch (e) {
        }
        me.proxy = proxy;
        return record;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }
}

