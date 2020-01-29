import { Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { BaseApplicationModel, PathModel } from '../../shared/base-application-model.model';
import { HasEquals } from 'shared/selector/generic-selector.service';
import { SelectorService } from 'shared/selector/selector.service';
import { genericSelectorFactory } from 'shared/selector/selector.factory';
import { VersionModel } from '../../shared/version.model';
import { JsonConvert } from 'json2typescript';
import { SourceModel, SubpolicyModel } from '../node-restore-policy.model';
import { ApplicationRestoreService } from '../application-restore.service';
import { SessionService } from 'core';
import { AlertComponent, AlertType } from 'shared/components/msgbox/alert.component';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { SiteModel } from 'site/site.model';
import * as _ from 'lodash';

export class ApplicationRestoreItem implements HasEquals<ApplicationRestoreItem> {
  public databaseMapping: string;
  public instanceVersion: string;
  public instanceId: string;
  public enablePit: boolean = false;
  public pointInTime: number;
  public transactionId: string;
  public paths: Array<PathModel>;

  constructor(public resource: BaseApplicationModel, public version: VersionModel) {
  }

  public set dataMapping(name: string) {
    this.databaseMapping = name;
  }

  public getDatabaseMappingValue(enablePaths: boolean = true, forcePaths?: boolean,
                                 treatDestinationSameAsSource?: boolean): object {
    let returnVal: object,
        key: string = this.resource.getUrl('self');
    returnVal = {
        [key]: {
          name: this.databaseMapping || '',
          paths: enablePaths ? this.getPaths(forcePaths, treatDestinationSameAsSource) : []
        }
      };
    return returnVal;
  }

  public equals(target: ApplicationRestoreItem): boolean {
    return this.resource.equals(target.resource);
  }

  private getPaths(forcePaths?: boolean,
                   treatDestinationSameAsSource?: boolean): Array<object> {
    let returnPathArr: Array<object> = [],
        paths: Array<PathModel> = this.paths || [];
    if (paths.length > 0) {
      paths.forEach((path: PathModel) => {
        let json: any;
        if (path.destination || forcePaths) {
          json = path.getPersistentJson();
          if (treatDestinationSameAsSource && !json.destination)
            json.destination = json.source;
          returnPathArr.push(json);
        }
      });
    }
    return returnPathArr;
  }
}

/**
 * Selector Factory.
 * @param type
 * @returns {SelectorService}
 */
export function restoreItemSelectorFactory(): SelectorService<ApplicationRestoreItem> {
  return genericSelectorFactory<ApplicationRestoreItem>();
}
