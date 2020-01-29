import {
  Component,
  ViewChild,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter, AfterViewInit
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {NvPairModel} from 'shared/models/nvpair.model';
import {RbacModel} from 'shared/rbac/rbac.model';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {Subject} from 'rxjs/Subject';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {HypervisorInventoryCategory, HypervisorInventoryCategoryLabel} from '../hypervisor-inventory.service';
import {HypervisorCategoryTableComponent} from '..';

@Component({
  selector: 'hypervisor-category-view',
  templateUrl: './hypervisor-category-view.component.html',
  styleUrls: ['./hypervisor-category-view.component.scss'],
})
export class HypervisorCategoryViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() category: HypervisorInventoryCategory;
  @Input() textBackToTarget: string;
  @Input() view: NvPairModel;
  @Output() close = new EventEmitter();
  @Output() assignPolicy = new EventEmitter<BaseHypervisorModel>();
  @Output() editRunSettings = new EventEmitter<BaseHypervisorModel>();
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(HypervisorCategoryTableComponent) table: HypervisorCategoryTableComponent;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  views: Array<NvPairModel> = [];
  namePattern: string = '';
  protected viewReady: boolean = false;
  private textSearchFor: string;
  private subs: Subject<void> = new Subject<void>();
  private masked: boolean = false;
  private searchCategory: boolean = false;

  constructor(private translate: TranslateService) {
  }

  get totalRecords(): number {
    return this.table ? this.table.totalRecords : (this.category ? this.category.value : 0);
  }

  get totalMatching(): boolean {
    return this.category && this.totalRecords === this.category.value;
  }

  get hasChangeDetectedIcon(): boolean {
    return this.emptyNamePattern && !this.totalMatching;
  }

  get hypervisorType(): string {
    return this.category ? this.category.hypervisorType : '';
  }

  get emptyNamePattern(): boolean {
    return !this.namePattern || this.namePattern === '*';
  }

  get titleTpl(): string {
    let result: string = '',
      // view = me.view ? me.view.value : undefined,
      cname: HypervisorInventoryCategoryLabel = this.category ? this.category.name : undefined;

    switch (cname) {
      case 'Protected':
        // result = view === 'tagview' ? 'inventory.textProtectedTags' :
        //   view === 'storageview' ? 'inventory.textProtectedVolumes' :
        //     'inventory.textProtectedVMs';
        result = 'inventory.textProtectedVMs';
        break;
      case 'Unprotected':
        // result = view === 'tagview' ? 'inventory.textUnprotectedTags' :
        //   view === 'storageview' ? 'inventory.textUnprotectedVolumes' :
        //     'inventory.textUnprotectedVMs';
        result = 'inventory.textUnprotectedVMs';
        break;
      case 'Failed':
        // result = view === 'tagview' ? 'inventory.textFailedTags' :
        //   view === 'storageview' ? 'inventory.textFailedVolumes' :
        //     'inventory.textFailedVMs';
        result = 'inventory.textFailedVMs';
        break;
      default:
        break;
    }
    return result;
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  onClose(): void {
    this.close.emit();
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  searchAll(): void {
    let me = this;
    if (me.searchBarComponent) {
      me.searchBarComponent.reset();
    }
    // Empty name pattern.
    me.namePattern = undefined;
    me.startSearch();
  }

  onClearSearch() {
    this.searchAll();
  }

  startSearch(namePattern?: string): void {
    let me = this;

    if (namePattern !== undefined)
      me.namePattern = namePattern;
    if (me.table) {
      me.table.setSearchCategory(me.searchCategory);
      me.table.searchResources(me.namePattern);
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    me.translate.get([
      'vmware.textSearchForVMsAndFolders'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textSearchFor = resource['vmware.textSearchForVMsAndFolders'];
      });
  }

  onAssignPolicy(item: BaseHypervisorModel): void {
    this.assignPolicy.emit(item);
  }

  onEditRunSettings(item: BaseHypervisorModel): void {
    this.editRunSettings.emit(item);
  }

  onRefreshClick(): void {
    let me = this;
    if (me.table)
      me.table.onRefresh();
  }
}
