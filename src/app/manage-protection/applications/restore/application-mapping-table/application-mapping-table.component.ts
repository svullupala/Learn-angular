import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { JsonConvert } from 'json2typescript';
import { ApplicationRestoreItem } from '../application-list-table/application-list-table.component';
import { ApplicationRestoreService } from '../application-restore.service';
import { PathModel } from '../../shared/base-application-model.model';
import { Subject } from 'rxjs/Subject';
import { ApplicationService } from '../../shared/application.service';
import { VersionModel } from '../../shared/version.model';

@Component({
  selector: 'application-mapping-table',
  templateUrl: './application-mapping-table.component.html',
  styleUrls: ['./application-mapping-table.component.scss']
})
export class ApplicationMappingTableComponent implements OnInit, OnDestroy {
  @Input() dbRenamingCharLimit: number;
  @Input() hidePathMapping: boolean = false;
  @Input() disableNameMapping: boolean = false;
  @Input() granularMode: boolean = false;
  @Input() applicationType: string = '';
  private records: Array<ApplicationRestoreItem> = [];
  private subs: Subject<void> = new Subject<void>();

  constructor(private applicationRestoreService: ApplicationRestoreService,
              private applicationService: ApplicationService) {
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    this.applicationRestoreService.getRestoreItemsSub.takeUntil(this.subs).subscribe(
      (items: Array<ApplicationRestoreItem>) => {
        this.records = items;
      }
    );
  }

  update(items: Array<ApplicationRestoreItem>): void {
    this.records = items;
  }

  public getMappingValue(forcePaths?: boolean, restoreType?: string, treatDestinationSameAsSource?: boolean): object {
    let returnObj: object = {};
    if (this.records && this.records.length > 0) {
      this.records.forEach((item: ApplicationRestoreItem) => {
        if (forcePaths) {
          this.onShowPaths(item);
        }
        if (this.granularMode) {
          item.databaseMapping = item.resource.name + '_RDB';
        }

        item.databaseMapping = item.databaseMapping || '';
        if (restoreType && restoreType === 'db2') {
          item.databaseMapping = item.databaseMapping.toUpperCase();
        }
        if (treatDestinationSameAsSource && item.databaseMapping === '')
          item.databaseMapping = item.resource.name;
        _.assign(returnObj, item.getDatabaseMappingValue(!this.hidePathMapping || forcePaths, forcePaths,
          treatDestinationSameAsSource));
      });
    }
    return returnObj;
  }

  public initPathsAsNeeded(): void {
    let me = this;
    if (me.records && me.records.length > 0) {
      me.records.forEach((item: ApplicationRestoreItem) => {
          me.onShowPaths(item);
      });
    }
  }

  public setMappings(mappings: object): void {
    if (mappings) {
      _.forIn(mappings, (value, key) => {
        if (mappings.hasOwnProperty(key)) {
          this.records.forEach((item: ApplicationRestoreItem) => {
            if (item.resource.url === key) {
              item.databaseMapping = mappings[key]['name'] || '';
              item.paths = this.setPaths(mappings[key]['paths']);
            }
          });
        }
      });
    }
  }

  public checkMappings(mappings: object, allBlank?: boolean): boolean {
    let mapValid: boolean = true, dbMapping: string, paths: Array<PathModel> = [],
      checkRegex =
        (this.applicationType === 'db2' || this.applicationType === 'mongo' || this.applicationType === 'oracle');
    if (mappings) {
      _.forIn(mappings, (value, key) => {
        if (mappings.hasOwnProperty(key)) {
          this.records.forEach((item: ApplicationRestoreItem) => {
            if (item.resource.url === key) {
              dbMapping = mappings[key]['name'] || '';
              if (checkRegex && dbMapping !== '') {
                let regExp;
                if (this.applicationType === 'oracle') {
                  regExp = new RegExp('^[a-zA-Z][a-zA-Z0-9_#$]*$');
                }
                if (this.applicationType === 'db2') {
                  regExp = new RegExp('^[A-Z@#][A-Z0-9@#_]{0,7}$');
                }
                if (this.applicationType === 'mongo') {
                  regExp = new RegExp('^[a-zA-Z0-9_\\-#]*$');
                }
                mapValid = mapValid && regExp.test(dbMapping);
              }
              if (this.applicationType === 'exch') {
                if ((!allBlank && dbMapping === '') || (allBlank && dbMapping !== '')) {
                  mapValid = false;
                }
              }
              paths = this.setPaths(mappings[key]['paths']);
              for (let c = 0; c < paths.length; c++) {
                if (checkRegex && paths[c].destination !== ''){
                  let regExp;
                  if (this.applicationType === 'oracle') {
                    regExp = new RegExp('^([/\\+][^/ ]*[a-zA-Z0-9_\\-.])+/?$');
                  }
                  if (this.applicationType === 'db2') {
                    regExp = new RegExp('^(/[^/ ]*[a-zA-Z0-9_\\-.])+/?$');
                  }
                  if (this.applicationType === 'mongo') {
                    regExp = new RegExp('^(/[^/ ]*[a-zA-Z0-9_\\-.])+/?$');
                  }
                  mapValid = mapValid && regExp.test(paths[c].destination);
                }
                if (this.applicationType === 'exch') {
                  if ((!allBlank && paths[c].destination === '') || (allBlank && paths[c].destination !== '')) {
                    mapValid = false;
                  }
                }
              }
            }
          });
        }
      });
      return mapValid;
    }
  }

  public clearRdbName(): void {
    let me = this, resetGranularMode = false;
    (me.records || []).forEach((item: ApplicationRestoreItem) => {
      let idx: number;
      if (item.databaseMapping) {
        idx = item.databaseMapping.indexOf('_RDB');
        if (idx !== -1 && idx === item.databaseMapping.length - 4) {
          item.databaseMapping = '';
          resetGranularMode = true;
        }
      }
    });
    if (resetGranularMode)
      me.granularMode = false;
  }

  private setPaths(paths: Array<object>): Array<PathModel> {
    let pathArr: Array<PathModel> = [];
    if (paths && paths.length > 0) {
      paths.forEach((path: object) => {
        let pathModel: PathModel = JsonConvert.deserializeObject(path, PathModel);
        pathModel.name = pathModel.source || pathModel.name || '';
        pathArr.push(pathModel);
      });
    }
    return pathArr;
  }

  private onShowPaths(item: ApplicationRestoreItem): void {
    if (item.paths && item.paths.length > 0) {
      return;
    }
    if (item.version) {
      if (item.version.hasLink('version')) {
        this.applicationService.getVersion(item.version)
          .takeUntil(this.subs)
          .subscribe(
          (version: VersionModel) => item.paths = this.setPaths(version.paths),
            (err) => console.log(err)
        );
      }
    } else {
      item.paths = item.resource.paths;
    }
  }

  private trackByModel(idx: number, item: ApplicationRestoreItem) {
    if (item && item.version) {
      return item.version.url;
    }
    return item && item.resource.url;
  }
}
