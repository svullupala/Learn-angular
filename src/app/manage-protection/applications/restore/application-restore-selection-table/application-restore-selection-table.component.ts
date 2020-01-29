import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BaseApplicationModel } from '../../shared/base-application-model.model';
import { SelectorService } from 'shared/selector/selector.service';
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
import {
  ApplicationRestoreItem,
  restoreItemSelectorFactory
} from 'applications/restore/application-list-table/application-list-table.component';


@Component({
  selector: 'application-restore-selection-table',
  templateUrl: './application-restore-selection-table.component.html',
  styleUrls: ['./application-restore-selection-table.component.scss'],
  providers: [
    { provide: SelectorService, useFactory: restoreItemSelectorFactory }
  ]
})
export class ApplicationRestoreSelectionTableComponent implements OnInit {
  @Input() showDelete: boolean = true;
  @Input() snapshotSelectionDisabled: boolean = false;
  @Input() greyedOutEnabled: boolean = false;
  @Input() selectSnapshot: boolean = false;
  @Input() applicationType: string;
  @Output() onRemoveItem = new EventEmitter<any>();
  @Output() dropDownSnapshotEvent = new EventEmitter<ApplicationRestoreItem>();
  @Output() selectSnapshotEvent = new EventEmitter<ApplicationRestoreItem>();
  private alert: AlertComponent;
  private textConfirm: string;
  private textResourcesConfirm: string;
  private subs: Subject<void> = new Subject<void>();
  private useLatest: boolean = true;
  private isOffload: boolean = false;
  private sites: Array<SiteModel> = [];
  private site: SiteModel;
  private isAppTypeExchOnline: boolean = false;
  private get records(): Array<ApplicationRestoreItem> {
    return this.selector.selection() || [];
  }

  constructor(private selector: SelectorService<ApplicationRestoreItem>,
    private translate: TranslateService,
    private applicationRestoreService: ApplicationRestoreService) {
  }

  ngOnInit() {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.translate.get([
      'common.textConfirm',
      'common.textSite',
      'common.textConfirmResources'
    ]).takeUntil(this.subs)
      .subscribe((resource: Object) => {
        this.textConfirm = resource['common.textConfirm'];
        this.textResourcesConfirm = resource['common.textConfirmResources'];
      });
    this.applicationRestoreService.getSitesSub.takeUntil(this.subs)
      .subscribe(
        (sites: Array<SiteModel>) => {
          this.sites = sites;
          this.site = this.sites.find((site: SiteModel) => { return site.defaultSite; });
        }
      );
    if (this.applicationType === 'office365') {
      this.isAppTypeExchOnline = true;
    }

  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public setRecords(restoreItems: Array<ApplicationRestoreItem>): void {
    this.selector.select(restoreItems);
    this.applicationRestoreService.updateRestoreItems(restoreItems);
  }

  public setSource(sources: Array<SourceModel>) {
    let sourceArr = [];
    if (sources && sources.length > 0) {
      this.selector.deselectAll();
      sources.forEach((source: SourceModel) => {
        let restoreItem: ApplicationRestoreItem,
          resource: BaseApplicationModel,
          isPit: boolean = false,
          version: VersionModel;

        source['links'] = {}; // create a mock link object so deserializing won't fail
        resource = JsonConvert.deserializeObject(source, BaseApplicationModel);
        if (source.pointInTime > 0 || source.transactionId) {
          isPit = true;
        }
        resource.name = source.metadata['name'];
        resource['links'] = { self: { href: source['href'] || '', rel: 'related' } };
        if (source.metadata['useLatest'] === true
          || source.version['metadata']['useLatest'] === true || source.version === null) {
          resource['links']['latestversion'] = {
            href: (isPit || source.version === null) ? '' : source.version['href']
            , rel: 'related'
          };
          resource.createEligibilityObject();
          resource.setBackupEligibility = true;
          resource.setLogbackupEligibility = true;
        } else {
          version = JsonConvert.deserializeObject(source, VersionModel);
          version.name = source.metadata['name'];
          version['links'] = { self: { href: isPit ? '' : source.version['copy']['href'], rel: 'related' } };
          version['links']['version'] = { href: isPit ? '' : source.version['href'], rel: 'related' };
          version.protectionTime = source.version['metadata']['protectionTime'];
        }
        restoreItem = new ApplicationRestoreItem(resource, version);
        restoreItem.pointInTime = source.pointInTime;
        restoreItem.transactionId = source.transactionId;
        restoreItem.instanceVersion = source.metadata['instanceVersion'] || '';
        restoreItem.instanceId = source.metadata['instanceId'] || '';
        sourceArr.push(restoreItem);
      });
      this.setRecords(sourceArr);
    }
  }

  public setRestoreType(model: SubpolicyModel): void {
    let href: string;
    if (model && !_.isEmpty(model.source)) {
      this.isOffload = model.source['copy']['isOffload'] || false;
      this.useLatest = !this.isEmpty() ? this.records[0].version === undefined : false;
      // this.onRestoreChange();
      if (!this.isOffload && this.useLatest) {
        href = model.source['copy']['site'] ? model.source['copy']['site']['href'] : '';
        this.site = this.sites.find((item: SiteModel) => {
          return href === item.url || (href.indexOf(item.id) !== -1);
        });
      }
    }
  }

  public getValue(): Array<ApplicationRestoreItem> {
    return this.records;
  }

  public isEmpty(): boolean {
    return this.records && this.records.length < 1;
  }

  public add(item: ApplicationRestoreItem): void {
    this.selector.select(item);
    if (this.records && this.records.length === 1) {
      this.useLatest = item.version === undefined;
    }
    this.applicationRestoreService.updateRestoreItems(this.getValue());
  }

  public remove(item: ApplicationRestoreItem): void {
    this.selector.deselect(item);
    this.applicationRestoreService.updateRestoreItems(this.getValue());
    this.onRemoveItem.emit();
  }

  public removeAll(): void {
    this.selector.deselectAll();
    this.applicationRestoreService.updateRestoreItems(this.getValue());
    this.onRemoveItem.emit();
  }

  public update(oldResource: BaseApplicationModel, item: ApplicationRestoreItem): void {
    let me = this, target = me.findByResource(oldResource);
    if (target) {
      me.remove(target);
      me.add(item);
    }
  }

  public hasResource(item: ApplicationRestoreItem): boolean {
    return this.records.findIndex(function (record) {
      return record.resource.equals(item.resource);
    }) !== -1;
  }

  public hasVersion(item: ApplicationRestoreItem): boolean {
    return this.records.findIndex(function (record) {
      if (record.version && item.version)
        return record.version.equals(item.version);
      else if (!record.version && !item.version)
        return record.version === item.version;
    }) !== -1;
  }

  public checkVersionSelections(): boolean {
    let me = this, valid = false;

    me.records.forEach(function (restoreItem: ApplicationRestoreItem) {
      if (restoreItem.resource && restoreItem.version){
        valid = true;
      }
    });
    if (valid) {
      valid = me.records.findIndex(function (restoreItem: ApplicationRestoreItem) {
        return restoreItem.resource && !!restoreItem.version;
      }) !== -1;
    }
    return valid;
  }

  public getNonGreyedOutItems(): ApplicationRestoreItem[] {
    let me = this;
    return me.records.filter(function (restoreItem: ApplicationRestoreItem) {
      return !me.greyedOut(restoreItem);
    });
  }

  public hasGreyedOutItem(): boolean {
    let me = this;
    return me.records.findIndex(function (restoreItem: ApplicationRestoreItem) {
      return me.greyedOut(restoreItem);
    }) !== -1;
  }

  public greyedOut(item: ApplicationRestoreItem): boolean {
    return this.selectSnapshot && (this.noSnapshotsFound(item) || this.noSnapshotSelection(item));
  }

  private noSnapshotsFound(restoreItem: ApplicationRestoreItem): boolean {
    return restoreItem.resource &&
      !restoreItem.resource.hasSnapshot && !restoreItem.version;
  }

  private noSnapshotSelection(restoreItem: ApplicationRestoreItem): boolean {
    return restoreItem.resource &&
      restoreItem.resource.hasSnapshot && restoreItem.version === undefined;
  }

  private trackByFn(index: number, item: ApplicationRestoreItem): string {
    if (item && item.version) {
      return item.version.id;
    }
    return item && item.resource && item.resource.id;
  }

  private confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler, discardHandler);
  }

  private onSnapshotDropDown(item: ApplicationRestoreItem): void {
    this.dropDownSnapshotEvent.emit(item);
  }

  private onSnapshotSelect(item: ApplicationRestoreItem, version?: VersionModel): void {
    item.version = version;
    if (this.records && this.records.length === 1) {
      this.useLatest = item.version === undefined;
    }
    this.selectSnapshotEvent.emit(item);
  }

  private findByResource(resource: BaseApplicationModel): ApplicationRestoreItem {
    return this.records.find(function (record) {
      return record.resource.equals(resource);
    });
  }

  private parseUsername(location: string): string {
    return location.substring(location.indexOf('/', 2) + 1, location.lastIndexOf('/'));
  }
}
