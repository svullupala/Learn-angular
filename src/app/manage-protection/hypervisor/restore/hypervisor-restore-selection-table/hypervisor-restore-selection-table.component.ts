import {Component, EventEmitter, Input, Output} from '@angular/core';
import { SnapshotModel } from '../../shared/snapshot.model';
import { SelectorService } from 'shared/selector/selector.service';
import { HypervisorRestoreService } from '../hypervisor-restore.service';
import { AlertComponent, AlertType } from 'shared/components/msgbox/alert.component';
import { Subject } from 'rxjs/Subject';
import { SessionService } from 'core';
import { TranslateService } from '@ngx-translate/core';
import {RestoreItem} from 'hypervisor/restore';
import { genericSelectorFactory } from 'shared/selector/selector.factory';
import {SourceModel} from 'applications/restore/node-restore-policy.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';

/**
 * Selector Factory.
 * @param type
 * @returns {SelectorService}
 */
export function restoreItemSelectorFactory(): SelectorService<RestoreItem> {
  return genericSelectorFactory<RestoreItem>();
}

@Component({
  selector: 'hypervisor-restore-selection-table',
  templateUrl: './hypervisor-restore-selection-table.component.html',
  styleUrls: ['./hypervisor-restore-selection-table.component.scss'],
  providers: [
    {provide: SelectorService, useFactory: restoreItemSelectorFactory}
  ]
})
export class HypervisorRestoreSelectionTableComponent {
  @Input() showDelete: boolean = true;
  @Input() showRename: boolean = false;
  @Input() hypervisorType: string = 'vmware';
  @Input() selectSnapshot: boolean = false;
  @Input() snapshotSelectionDisabled: boolean = false;
  @Input() greyedOutEnabled: boolean = false;
  @Output() onRemoveItem = new EventEmitter<any>();
  @Output() restoreSelectionEvent = new EventEmitter<boolean>();
  @Output() dropDownSnapshotEvent = new EventEmitter<RestoreItem>();
  @Output() selectSnapshotEvent = new EventEmitter<RestoreItem>();
  private alert: AlertComponent;
  private textConfirm: string;
  private textResourcesConfirm: string;
  private subs: Subject<void> = new Subject<void>();
  private useLatest: boolean = true;
  private summaryArray: any[] = [];

  private get records(): Array<RestoreItem> {
    return this.selector.selection() || [];
  }

  constructor(private selector: SelectorService<RestoreItem>,
              private translate: TranslateService,
              private hypervisiorRestoreService: HypervisorRestoreService) {
  }

  ngOnInit() {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.translate.get([
      'common.textConfirm',
      'common.textSite',
      'common.textCloudRepoServers',
      'common.textConfirmResources'
    ]).takeUntil(this.subs)
      .subscribe((resource: Object) => {
        this.textConfirm = resource['common.textConfirm'];
        this.textResourcesConfirm = resource['common.textConfirmResources'];
      });
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public handleRenameChange(event: any, name: string, index: number) {
    let me = this;
    if (me.summaryArray.length === 0) {
      me.getSummaryText();
    }
    me.summaryArray[index]['rename'] = event;
  }

  public getSummaryText(): any[] {
    let me = this;
    if (me.summaryArray.length === 0 && me.records) {
      for (let i = 0; i < me.records.length; i++) {
        me.summaryArray.push({name: me.records[i].resource.name, rename: ''});
      }
    }
    return me.summaryArray;
  }

  public setRecords(restoreItems: Array<RestoreItem>): void {
    this.selector.select(restoreItems);
  }

  public setSource(sources: Array<SourceModel>) {
    let sourceArr = [];
    if (sources && sources.length > 0) {
      this.selector.deselectAll();
      sources.forEach((source: SourceModel) => {
        let restoreItem: RestoreItem,
          resource: HypervisorModel,
          isPit: boolean = false,
          version: SnapshotModel;

        source['links'] = {}; // create a mock link object so deserializing won't fail
        resource = JsonConvert.deserializeObject(source, HypervisorModel);
        if (source.pointInTime > 0 || source.transactionId) {
          isPit = true;
        }
        resource.name = source.metadata['name'];
        resource['links'] = {self: {href: source['href'] || '', rel: 'related'}};
        if (source.metadata['useLatest'] === true
          || source.version['metadata']['useLatest'] === true || source.version === null) {
          resource['links']['latestversion'] = {
            href: (isPit || source.version === null ) ? '' : source.version['href']
            , rel: 'related'};
          // resource.createEligibilityObject();
          // resource.setBackupEligibility = true;
          // resource.setLogbackupEligibility = true;
        } else {
          version = JsonConvert.deserializeObject(source, SnapshotModel);
          version.name = source.metadata['name'];
          version['links'] = {self: {href: isPit ? '' : source.version['copy']['href'], rel: 'related'}};
          version['links']['version'] = {href: isPit ? '' : source.version['href'], rel: 'related'};
          version.protectionTime = source.version['metadata']['protectionTime'];
        }
        restoreItem = new RestoreItem(resource, version);
        // restoreItem.pointInTime = source.pointInTime;
        // restoreItem.transactionId = source.transactionId;
        // restoreItem.instanceVersion = source.metadata['instanceVersion'] || '';
        // restoreItem.instanceId = source.metadata['instanceId'] || '';
        sourceArr.push(restoreItem);
      });
      this.setRecords(sourceArr);
    }
  }

  public getValue(): Array<RestoreItem> {
    return this.records;
  }

  public add(item: RestoreItem, preventEvent?: boolean): void {
    this.selector.select(item);
    if (this.records && this.records.length === 1) {
      this.useLatest = item.snapshot === undefined;
    }
    if (!preventEvent)
      this.hypervisiorRestoreService.update(this.getValue());
  }

  public remove(item: RestoreItem): void {
    this.selector.deselect(item);
    this.hypervisiorRestoreService.update(this.getValue());
    this.onRemoveItem.emit();
  }

  public removeAll(preventEvent?: boolean): void {
    this.selector.deselectAll();
    if (!preventEvent) {
      this.hypervisiorRestoreService.update(this.getValue());
      this.onRemoveItem.emit();
    }
  }

  public update(oldResource: BaseHypervisorModel, item: RestoreItem): void {
    let me = this, target = me.findByResource(oldResource);
    if (target) {
      me.remove(target);
      me.add(item);
    }
  }
  public hasResource(item: RestoreItem): boolean {
    return this.records.findIndex(function (record) {
        return record.resource.equals(item.resource);
      }) !== -1;
  }

  public hasSnapshot(item: RestoreItem): boolean {
    return this.records.findIndex(function (record) {
        if (record.snapshot && item.snapshot)
          return record.snapshot.equals(item.snapshot);
        else if (!record.snapshot && !item.snapshot)
          return record.snapshot === item.snapshot;
      }) !== -1;
  }

  public checkSnapshotSelections(): boolean {
    let me = this, valid = false;

    me.records.forEach(function (restoreItem: RestoreItem) {
      if (restoreItem.resource && restoreItem.snapshot){
        valid = true;
      }
    });
    if (valid) {
      valid = me.records.findIndex(function (restoreItem: RestoreItem) {
        return restoreItem.resource && !!restoreItem.snapshot;
      }) !== -1;
    }
    return valid;
  }

  public reset(): void {
    this.useLatest = true;
  }

  public isEmpty(): boolean {
    return this.records && this.records.length < 1;
  }

  public getNonGreyedOutItems(): RestoreItem[] {
    let me = this;
    return me.records.filter(function (restoreItem: RestoreItem) {
      return !me.greyedOut(restoreItem);
    });
  }

  public hasGreyedOutItem(): boolean {
    let me = this;
    return me.records.findIndex(function (restoreItem: RestoreItem) {
      return me.greyedOut(restoreItem);
    }) !== -1;
  }

  public greyedOut(item: RestoreItem): boolean {
    return this.selectSnapshot && (this.noSnapshotsFound(item) || this.noSnapshotSelection(item));
  }

  private noSnapshotsFound(restoreItem: RestoreItem): boolean {
    return restoreItem.resource &&
      !restoreItem.resource.hasSnapshot && !restoreItem.snapshot;
  }

  private noSnapshotSelection(restoreItem: RestoreItem): boolean {
    return restoreItem.resource &&
      restoreItem.resource.hasSnapshot && restoreItem.snapshot === undefined;
  }

  private trackByFn(index: number, item: RestoreItem): string {
    if (item && item.snapshot) {
      return item.snapshot.id;
    }
    return item && item.resource && item.resource.id;
  }

  private confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler, discardHandler);
  }

  private onSnapshotDropDown(item: RestoreItem): void {
    this.dropDownSnapshotEvent.emit(item);
  }

  private onSnapshotSelect(item: RestoreItem, snapshot?: SnapshotModel): void {
    item.snapshot = snapshot;
    if (this.records && this.records.length === 1) {
      this.useLatest = item.snapshot === undefined;
    }
    this.selectSnapshotEvent.emit(item);
  }

  private findByResource(resource: BaseHypervisorModel): RestoreItem {
    return this.records.find(function (record) {
      return record.resource.equals(resource);
    });
  }

  private isAwsec2(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_AWSEC2;
  }
}
