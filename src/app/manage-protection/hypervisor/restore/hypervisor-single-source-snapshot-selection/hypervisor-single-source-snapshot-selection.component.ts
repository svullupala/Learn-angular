import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {RestService, SessionService} from 'core';
import {Subject} from 'rxjs/Subject';
import {TranslateService} from '@ngx-translate/core';
import {HighlightableList} from 'shared/util/keyboard';
import {Selectable} from 'shared/util/selectable';
import {BaseModel} from 'shared/models/base.model';
import {FilterModel} from 'shared/models/filter.model';
import {PaginateModel} from 'shared/models/paginate.model';

import {SorterModel} from 'shared/models/sorter.model';
import {LinkModel} from 'shared/models/link.model';
import {Observable} from 'rxjs';
import {applyMixins} from 'rxjs/util/applyMixins';
import {ErrorHandlerComponent} from 'shared/components';
import {DatasetModel} from 'shared/models/dataset.model';
import {RestoreItem} from 'hypervisor/restore';
import {HypervisorVersionModel, SnapshotModel} from 'hypervisor/shared/snapshot.model';
import {HypervisorVersionsModel, SnapshotsModel} from 'hypervisor/shared/snapshots.model';
import {DateFormatPipe} from 'angular2-moment';
import {SharedService} from 'shared/shared.service';
import {NvPairModel} from 'shared/models/nvpair.model';

@Component({
  selector: 'hypervisor-single-source-snapshot-selection',
  templateUrl: './hypervisor-single-source-snapshot-selection.component.html',
  styleUrls: ['./hypervisor-single-source-snapshot-selection.component.scss']
})
export class HypervisorSingleSourceSnapshotSelectionComponent extends HighlightableList
  implements OnInit, Selectable, OnDestroy {

  @Input() restoreItem: RestoreItem;
  @Input() filters: Array<FilterModel>;

  @Output() toggleSnapshotSelect = new EventEmitter<RestoreItem>();
  @Output() selectionChange = new EventEmitter();

  selectedItems: Array<HypervisorVersionModel> = [];
  isSelected: (item: BaseModel, singleSelect: boolean) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent, singleSelect: boolean) => void;

  errorHandler: ErrorHandlerComponent;

  private subs: Subject<void> = new Subject<void>();
  private model: PaginateModel<HypervisorVersionModel>;
  private currentLink: LinkModel;
  private masked: boolean = false;
  private sorters: Array<SorterModel>;
  private textBackup: string = '';
  private textReplication: string = '';
  private textCloud: string = '';
  private textArchive: string = '';
  private textSelectedSnapshotTpl: string = '';
  private datePipe: DateFormatPipe;
  private PAGE_SIZE: number = 25;

  get textSelection(): string {
    let me = this, selected = me.hasSelection();
    return selected ? SharedService.formatString(me.textSelectedSnapshotTpl,
      me.datePipe.transform(me.firstSelection.protectionTime, 'll LTS'),
      me.copyTitle(me.restoreItem.snapshot, true)) : '';
  }

  private get hasResource(): boolean {
    return !!(this.restoreItem && this.restoreItem.resource);
  }

  constructor(private translate: TranslateService,
              private rest: RestService) {
    super();
    let paginationId: string = `hypervisor-single-source-snapshot-selection-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, pageSize: this.PAGE_SIZE, classObject: HypervisorVersionsModel, relyOnPageLinks: true});
    this.datePipe = new DateFormatPipe();
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.textBackup',
      'common.textReplication',
      'common.textCloudPlain',
      'common.textArchive',
      'common.textSelectedSnapshotTpl'])
      .subscribe((resource: Object) => {
        me.textBackup = resource['common.textBackup'];
        me.textReplication = resource['common.textReplication'];
        me.textCloud = resource['common.textCloudPlain'];
        me.textArchive = resource['common.textArchive'];
        me.textSelectedSnapshotTpl = resource['common.textSelectedSnapshotTpl'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    if (me.hasResource)
      me.loadVersions();
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  onRefresh(): void {
    let me = this;
    if (me.currentLink) {
      me.refresh(me.currentLink);
    } else {
      me.loadVersions();
    }
  }

  emptySelection(): void {
    let me = this;
    me.selectedItems = [];
    if (me.restoreItem) {
      me.restoreItem.snapshot = undefined;
      me.toggleSnapshotSelect.emit(me.restoreItem);
    }
  }

  getValue(): RestoreItem {
    return this.restoreItem;
  }

  hasSelection(): boolean {
    let me = this, selection = me.firstSelection;
    return selection && me.restoreItem && !!me.restoreItem.snapshot;
  }

  retrieveSelection(): void {
    let me = this, observable: Observable<HypervisorVersionModel>,
      copy = me.restoreItem.snapshot;

    if (!copy)
      return;

    me.mask();

    copy.proxy = copy.proxy || me.rest;
    observable = copy.getRecord<HypervisorVersionModel>(HypervisorVersionModel, 'version');

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.selectedItems = record ? [record] : [];
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  loadVersions() {
    let me = this, observable: Observable<HypervisorVersionsModel>,
      resource = me.restoreItem.resource,
      filters = me.filters,
      sorters = me.sorters || [new SorterModel('protectionTime', 'DESC')];

    me.mask();

    resource.proxy = resource.proxy || me.rest;
    observable = resource.getDataset<HypervisorVersionModel, HypervisorVersionsModel>(HypervisorVersionsModel,
      'versions',
      filters, sorters, 0, me.PAGE_SIZE, [
        new NvPairModel('embedCopies', true),
        new NvPairModel('omitIfNoCopies', true)
      ]);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.model.reset();
            me.model.update(dataset);
            (dataset.records || []).forEach(function (item) {
              if (!item.copiesInPlace)
                me.loadCopies(item);
              else
                item.copies = me.sortCopies(item.copies);
            });
          }
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private loadCopies(version: HypervisorVersionModel) {
    let me = this, observable: Observable<SnapshotsModel>,
      resource = version,
      sorters = [new SorterModel('copyTime', 'DESC')];

    if (resource.hasCopy)
      return;

    observable = resource.getDataset<SnapshotModel, SnapshotsModel>(SnapshotsModel,
      'copies',
      undefined, sorters, 0, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          let records = dataset ? dataset.copies : [];
          resource.copies = me.sortCopies(records || []);
        },
        err => {
          me.handleError(err, false);
        }
      );
    }
  }

  private sortCopies(copies: SnapshotModel[]): SnapshotModel[] {
    let sequence = ['BACKUP', 'REPLICATION', 'SPPOFFLOAD', 'SPPARCHIVE'];
    return copies.sort((a, b) => {
      return sequence.indexOf(a.subPolicyType) - sequence.indexOf(b.subPolicyType);
    });
  }

  private copyTitle(copy: SnapshotModel, plain?: boolean): string {
    let me = this, title = {
      BACKUP: plain ? me.textBackup : 'common.textBackup',
      REPLICATION: plain ? me.textReplication : 'common.textReplication',
      SPPOFFLOAD: plain ? me.textCloud : 'common.textCloudPlain',
      SPPARCHIVE: plain ? me.textArchive : 'common.textArchive'
    };
    return title[copy.subPolicyType] || copy.subPolicyType;
  }

  /**
   * Refresh method.
   * @param {LinkModel} link
   */
  private refresh(link: LinkModel): void {
    let me = this, ds = me.model.dataset, observable: Observable<HypervisorVersionsModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<HypervisorVersionsModel>(HypervisorVersionsModel, link);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.model.update(dataset);
            (dataset.records || []).forEach(function (item) {
              if (!item.copiesInPlace)
                me.loadCopies(item);
              else
                item.copies = me.sortCopies(item.copies);
            });
          }
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private onPageChange(param: { page: number, dataset: DatasetModel<HypervisorVersionModel>, link: LinkModel }): void {
    let me = this, dataset = param.dataset;
    me.currentLink = param.link;
    me.unmask();
    if (dataset) {
      (dataset.records || []).forEach(function (item) {
        if (!item.copiesInPlace)
          me.loadCopies(item);
        else
          item.copies = me.sortCopies(item.copies);
      });
    }
  }

  private toggleVersionSelect(item: HypervisorVersionModel, set: HypervisorVersionModel[],
                              event: MouseEvent | KeyboardEvent): void {
    let me = this;
    if (item.hasCopy) {
      me.toggleSelect(item, set, event, true);
      me.restoreItem.snapshot = me.isSelected(item, true) ? item.firstCopy : undefined;
      me.toggleSnapshotSelect.emit(me.restoreItem);
    }
  }

  private toggleCopySelect(copy: SnapshotModel, item: HypervisorVersionModel, set: HypervisorVersionModel[],
                           event: MouseEvent | KeyboardEvent): void {
    let me = this;
    event.stopPropagation();
    me.toggleSelect(item, set, event, true);
    me.restoreItem.snapshot = me.isSelected(item, true) ? copy : undefined;
    me.toggleSnapshotSelect.emit(me.restoreItem);
  }

  get firstSelection(): HypervisorVersionModel {
    return this.selectedItems && this.selectedItems.length > 0 ? this.selectedItems[0] : null;
  }

  get selectedCopy(): SnapshotModel {
    let me = this, resource = me.restoreItem;
    return resource ? resource.snapshot : null;
  }

  private isCopySelected(item: HypervisorVersionModel, copy: SnapshotModel): boolean {
    let me = this, selection = me.firstSelection,
      selectedCopy = me.selectedCopy,
      versionSelected = selection && selection.equals(item),
      copySelected = selectedCopy && selectedCopy.equals(copy);
    return versionSelected && copySelected;
  }

  private hasCopySelected(item: HypervisorVersionModel): boolean {
    let me = this;
    return (item.copies || []).findIndex(function (copy) {
      return me.isCopySelected(item, copy);
    }) !== -1;
  }
}

applyMixins(HypervisorSingleSourceSnapshotSelectionComponent, [Selectable]);
