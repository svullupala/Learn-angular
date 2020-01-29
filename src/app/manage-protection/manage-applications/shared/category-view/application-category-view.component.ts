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
import {ApplicationInventoryCategory, ApplicationInventoryCategoryLabel} from '../application-inventory.service';
import {ApplicationCategoryTableComponent} from '..';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';

@Component({
  selector: 'application-category-view',
  templateUrl: './application-category-view.component.html',
  styleUrls: ['./application-category-view.component.scss'],
})
export class ApplicationCategoryViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() category: ApplicationInventoryCategory;
  @Input() textBackToTarget: string;
  @Input() view: NvPairModel;
  @Output() close = new EventEmitter();
  @Output() assignPolicy = new EventEmitter<BaseApplicationModel>();
  @Output() editRunSettings = new EventEmitter<BaseApplicationModel>();
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  @ViewChild(ApplicationCategoryTableComponent) table: ApplicationCategoryTableComponent;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  views: Array<NvPairModel> = [];
  namePattern: string = '';
  protected viewReady: boolean = false;
  private textSearchFor: string;
  private subs: Subject<void> = new Subject<void>();
  private masked: boolean = false;

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

  get applicationType(): string {
    return this.category ? this.category.applicationType : '';
  }

  get emptyNamePattern(): boolean {
    return !this.namePattern || this.namePattern === '*';
  }

  get titleTpl(): string {
    let result: string = '',
      cname: ApplicationInventoryCategoryLabel = this.category ? this.category.name : undefined;

    switch (cname) {
      case 'Protected':
        result = 'inventory.textProtectedDatabases';
        break;
      case 'Unprotected':
        result = 'inventory.textUnprotectedDatabases';
        break;
      case 'Failed':
        result = 'inventory.textFailedDatabases';
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

    if (me.searchBarComponent)
      me.searchBarComponent.reset();
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
    if (me.table)
      me.table.searchResources(me.namePattern);
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
      'inventory.textSearchForDatabases'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.textSearchFor = resource['inventory.textSearchForDatabases'];
      });
  }

  onAssignPolicy(item: BaseApplicationModel): void {
    this.assignPolicy.emit(item);
  }

  onEditRunSettings(item: BaseApplicationModel): void {
    this.editRunSettings.emit(item);
  }

  onRefreshClick(): void {
    let me = this;
    if (me.table)
      me.table.onRefresh();
  }
}
