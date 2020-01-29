import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ResourceGroupsService } from '../../resource-groups.service';
import { DatasetModel } from 'shared/models/dataset.model';
import { selectorFactory, SelectorType } from 'shared/selector/selector.factory';
import { SelectorService } from 'shared/selector/selector.service';
import { BaseModel } from 'shared/models/base.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { ResourceGroupSelectionModel } from '../resource-group-selection.model';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'resource-selector-component',
  templateUrl: './resource-selector.component.html',
  styleUrls: ['../../resource-groups.scss'],
  providers: [
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.MULTIHIER}
  ]
})

export class ResourceSelectorComponent implements OnInit, OnDestroy {
  @Input() records: Array<any> = [];
  @Input() hideAllButton: boolean = false;
  @Input() addAllItem: ResourceGroupSelectionModel;
  @Input() dataset: DatasetModel<any>;
  @Input() hideSearchBar: boolean = false;
  @Input() paginateConfig: PaginateConfigModel;
  @Input() masked: boolean = false;
  @Input() view: string;
  @Input() resourceType: string;
  @Input() applicationType: string;
  @Input() textPlaceholderLabel: string;
  @Input() breadcrumbs: Array<BreadcrumbModel>;
  @Input() hideBreadcrumbs: boolean = false;
  @Input() ignoreBreadCrumb: boolean = false;
  @Output() onPageChangeEvent: EventEmitter<number> = new EventEmitter<number>();
  @Output() onSearchEvent: EventEmitter<string> = new EventEmitter<string>();
  @Output() onRefreshEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() onBreadcrumbClickEvent: EventEmitter<BreadcrumbModel> = new EventEmitter<BreadcrumbModel>();
  @Output() navigateEvent: EventEmitter<any> = new EventEmitter<any>();
  private subs: Subject<void> = new Subject<void>();
  private selectAllItem: boolean = false;

  constructor(private resourceGroupsService: ResourceGroupsService,
              private translate: TranslateService,
              private selector: SelectorService<BaseModel>) {}

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  ngOnInit(): void {
    let me = this;
    me.paginateConfig = this.paginateConfig || new PaginateConfigModel();
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
    me.resourceGroupsService.updateResourceGroupClickedSub.takeUntil(me.subs).subscribe(
      () => {
        me.onAddResources();
        me.resourceGroupsService.addResourceCompletedSignal();
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  isAllHidden(): boolean {
    return this.hideAllButton || (this.records.length === 0);
  }

  private selectorSelected() {
    if (this.selector.count() > 0) {
      this.resourceGroupsService.addResourceValidateSignal(true);
    } else {
      this.resourceGroupsService.addResourceValidateSignal(false);
    }
  }

  private initMetadata(): void {
    let me = this,
      records = me.records as Array<BaseModel> || [];
    records.forEach(function (item) {
      item.metadata['selected'] = false;
    });
  }

  private selectAll(): void {
    if (this.selectAllItem) {
      if (this.selector.count() > 0) {
        this.selector.deselectAll();
        this.initMetadata();
      }
      this.selector.select(this.addAllItem.resource);
      this.selectorSelected();
    } else {
      this.selector.deselectAll();
    }
  }

  private hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  private emptySelection(): void {
    this.selector.deselectAll();
    this.selectAllItem = false;
    this.initMetadata();
  }

  private onSelectChange(item: any): void {
    let me = this;

    if (me.selectAllItem) {
      me.selectAllItem = false;
      me.selector.deselect(me.addAllItem.resource);
    }
    if (item.metadata['selected'] === true) {
      me.selector.select(item);
    } else {
      me.selector.deselect(item);
    }
    me.selectorSelected();
  }

  private onAddResources(): void {
    let records = Array.from(this.selector.selection()),
        type: string = this.resourceType || 'N/A',
        breadcrumbs: Array<BreadcrumbModel> = this.breadcrumbs ? Array.from(this.breadcrumbs) : [];
    if (this.selectAllItem) {
      this.addAllItem.breadcrumbs = (this.ignoreBreadCrumb) ? [] : breadcrumbs;
      if (this.applicationType) {
        this.addAllItem.breadcrumbs.unshift(new BreadcrumbModel(this.applicationType, undefined));
      }
      this.addAllItem.breadcrumbs.unshift(new BreadcrumbModel(type, undefined));
      this.resourceGroupsService.addAllResource(this.addAllItem);
    } else {
      if (this.applicationType) {
        breadcrumbs.unshift(new BreadcrumbModel(this.applicationType, undefined));
      }
      breadcrumbs.unshift(new BreadcrumbModel(type, undefined));
      records.forEach((item: any) => {
        let model: ResourceGroupSelectionModel = new ResourceGroupSelectionModel(type, item, breadcrumbs);
        this.resourceGroupsService.updateResources(model);
      });
    }
    this.emptySelection();
  }

  private onPageChange(page: number): void {
    this.paginateConfig.pageChanged(page);
    this.onPageChangeEvent.emit(this.paginateConfig.pageStartIndex());
    this.emptySelection();
  }

  private onSearch(pattern: string): void {
    this.onSearchEvent.emit(pattern);
    this.emptySelection();
  }

  private onRefresh(): void {
    this.onRefreshEvent.emit();
    this.emptySelection();
  }

  private canNavigate(item: BaseModel): boolean {
    return item && item.hasLink(this.view);
  }

  private onBreadcrumbClick(breadcrumb: BreadcrumbModel): void {
    this.onBreadcrumbClickEvent.emit(breadcrumb);
    this.emptySelection();
  }

  private navigate(item: BaseModel): void {
    this.navigateEvent.emit(item);
    this.emptySelection();
  }

  private reset(): void {
    this.emptySelection();
    this.breadcrumbs = [];
    this.dataset = undefined;
    this.records = [];
  }

  private trackByFn(idx: number, item: any) {
    return item && item.id;
  }
}
