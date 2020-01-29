import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ApplicationVersionModel, VersionModel} from '../../shared/version.model';
import {RestService, SessionService} from 'core';
import {Subject} from 'rxjs/Subject';
import {TranslateService} from '@ngx-translate/core';
import {
  ApplicationRestoreItem
} from 'applications/restore/application-list-table/application-list-table.component';
import {HighlightableList} from 'shared/util/keyboard';
import {Selectable} from 'shared/util/selectable';
import {BaseModel} from 'shared/models/base.model';
import {FilterModel} from 'shared/models/filter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {ApplicationVersionsModel, VersionsModel} from 'applications/shared/versions.model';
import {SorterModel} from 'shared/models/sorter.model';
import {LinkModel} from 'shared/models/link.model';
import {Observable} from 'rxjs';
import {applyMixins} from 'rxjs/util/applyMixins';
import {ErrorHandlerComponent} from 'shared/components';
import {DatasetModel} from 'shared/models/dataset.model';
import {SharedService} from 'shared/shared.service';
import {DateFormatPipe} from 'angular2-moment';
import {NvPairModel} from 'shared/models/nvpair.model';

@Component({
  selector: 'application-single-source-snapshot-selection',
  templateUrl: './application-single-source-snapshot-selection.component.html',
  styleUrls: ['./application-single-source-snapshot-selection.component.scss']
})
export class ApplicationSingleSourceSnapshotSelectionComponent extends HighlightableList
  implements OnInit, Selectable, OnDestroy {

  @Input() restoreItem: ApplicationRestoreItem;
  @Input() filters: Array<FilterModel>;

  @Output() toggleSnapshotSelect = new EventEmitter<ApplicationRestoreItem>();
  @Output() selectionChange = new EventEmitter();

  selectedItems: Array<ApplicationVersionModel> = [];
  isSelected: (item: BaseModel, singleSelect: boolean) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent, singleSelect: boolean) => void;

  errorHandler: ErrorHandlerComponent;

  private subs: Subject<void> = new Subject<void>();
  private model: PaginateModel<ApplicationVersionModel>;
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
      me.copyTitle(me.restoreItem.version, true)) : '';
  }

  private get hasResource(): boolean {
    return !!(this.restoreItem && this.restoreItem.resource);
  }

  constructor(private translate: TranslateService,
              private rest: RestService) {
    super();
    let paginationId: string = `application-single-source-snapshot-selection-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, pageSize: this.PAGE_SIZE, classObject: ApplicationVersionsModel, relyOnPageLinks: true});
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
      me.restoreItem.version = undefined;
      me.toggleSnapshotSelect.emit(me.restoreItem);
    }
  }

  getValue(): ApplicationRestoreItem {
    return this.restoreItem;
  }

  hasSelection(): boolean {
    let me = this, selection = me.firstSelection;
    return selection && me.restoreItem && !!me.restoreItem.version;
  }

  retrieveSelection(): void {
    let me = this, observable: Observable<ApplicationVersionModel>,
      copy = me.restoreItem.version;

    if (!copy)
      return;

    me.mask();

    copy.proxy = copy.proxy || me.rest;
    observable = copy.getRecord<ApplicationVersionModel>(ApplicationVersionModel, 'version');

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
    let me = this, observable: Observable<ApplicationVersionsModel>,
      resource = me.restoreItem.resource,
      filters = me.filters,
      sorters = me.sorters || [new SorterModel('protectionTime', 'DESC')];

    me.mask();

    resource.proxy = resource.proxy || me.rest;
    observable = resource.getDataset<ApplicationVersionModel, ApplicationVersionsModel>(ApplicationVersionsModel,
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

  private loadCopies(version: ApplicationVersionModel) {
    let me = this, observable: Observable<VersionsModel>,
      resource = version,
      sorters = [new SorterModel('copyTime', 'DESC')];

    if (resource.hasCopy)
      return;

    observable = resource.getDataset<VersionModel, VersionsModel>(VersionsModel,
      'copies',
      undefined, sorters, 0, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          let records = dataset ? dataset.versions : [];
          resource.copies = me.sortCopies(records || []);
        },
        err => {
          me.handleError(err, false);
        }
      );
    }
  }

  private sortCopies(copies: VersionModel[]): VersionModel[] {
    let sequence = ['BACKUP', 'REPLICATION', 'SPPOFFLOAD', 'SPPARCHIVE'];
    return copies.sort((a, b) => {
      return sequence.indexOf(a.subPolicyType) - sequence.indexOf(b.subPolicyType);
    });
  }

  private copyTitle(copy: VersionModel, plain?: boolean): string {
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
    let me = this, ds = me.model.dataset, observable: Observable<ApplicationVersionsModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<ApplicationVersionsModel>(ApplicationVersionsModel, link);
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

  private onPageChange(param: { page: number, dataset: DatasetModel<ApplicationVersionModel>, link: LinkModel }): void {
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

  private toggleVersionSelect(item: ApplicationVersionModel, set: ApplicationVersionModel[],
                              event: MouseEvent | KeyboardEvent): void {
    let me = this;
    if (item.hasCopy) {
      me.toggleSelect(item, set, event, true);
      me.restoreItem.version = me.isSelected(item, true) ? item.firstCopy : undefined;
      me.toggleSnapshotSelect.emit(me.restoreItem);
    }
  }

  private toggleCopySelect(copy: VersionModel, item: ApplicationVersionModel, set: ApplicationVersionModel[],
                           event: MouseEvent | KeyboardEvent): void {
    let me = this;
    event.stopPropagation();
    me.toggleSelect(item, set, event, true);
    me.restoreItem.version = me.isSelected(item, true) ? copy : undefined;
    me.toggleSnapshotSelect.emit(me.restoreItem);
  }

  get firstSelection(): ApplicationVersionModel {
    return this.selectedItems && this.selectedItems.length > 0 ? this.selectedItems[0] : null;
  }

  get selectedCopy(): VersionModel {
    let me = this, resource = me.restoreItem;
    return resource ? resource.version : null;
  }

  private isCopySelected(item: ApplicationVersionModel, copy: VersionModel): boolean {
    let me = this, selection = me.firstSelection,
      selectedCopy = me.selectedCopy,
      versionSelected = selection && selection.equals(item),
      copySelected = selectedCopy && selectedCopy.equals(copy);
    return versionSelected && copySelected;
  }

  private hasCopySelected(item: ApplicationVersionModel): boolean {
    let me = this;
    return (item.copies || []).findIndex(function (copy) {
      return me.isCopySelected(item, copy);
    }) !== -1;
  }
}

applyMixins(ApplicationSingleSourceSnapshotSelectionComponent, [Selectable]);
