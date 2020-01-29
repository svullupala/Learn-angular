import {Component, OnInit, Input, Output, EventEmitter, ElementRef, SimpleChanges, OnChanges} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {PaginateModel} from '../../models/paginate.model';
import {DatasetModel} from '../../models/dataset.model';
import {ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {LinkModel} from '../../models/link.model';
import {SharedService} from 'shared/shared.service';
import {InfiniteScrollEvent} from 'ngx-infinite-scroll';

export type PaginationMode = 'normal' | 'infiniteScrolling' | 'both';

@Component({
  selector: 'paging-toolbar',
  templateUrl: './paging-toolbar.component.html',
  styleUrls: ['./paging-toolbar.component.scss']
})
export class PagingToolbarComponent implements OnInit, OnChanges {

  /**
   * The pageChange event emitter, the expression specified(event handler) will be invoked whenever
   * the page changes via a click on one of the pagination controls. The $event argument will be the number of
   * the new page. This should be used to update the value of the currentPage variable which was passed to
   * the PagingPipe.
   * @type {EventEmitter<number | { page: number, dataset: DatasetModel<any> }>}
   */
  @Output() pageChange = new EventEmitter<number | { page: number, dataset: DatasetModel<any>, link: LinkModel }>();

  /**
   * The refresh event emitter, the expression specified(event handler) will be invoked whenever
   * the refresh via a click on one of the refresh button. No $event argument is needed.
   * @type {EventEmitter<DatasetModel<any>>}
   */
  @Output() refresh = new EventEmitter<DatasetModel<any>>();

  /**
   * The startGoPage event emitter, the expression specified(event handler) will be invoked when a retrieving
   * the page from server-side started. No $event argument is needed.
   * @type {EventEmitter}
   */
  @Output() startGoPage = new EventEmitter();

  /**
   * The scrolled event emitter, this will emit if the distance threshold has been reached on a scroll down.
   * @type {EventEmitter<InfiniteScrollEvent>}
   */
  @Output() scrolled = new EventEmitter<InfiniteScrollEvent>();

  /**
   * The scrolled event emitter, this will emit if the distance threshold has been reached on a scroll up.
   * @type {EventEmitter<InfiniteScrollEvent>}
   */
  @Output() scrolledUp = new EventEmitter<InfiniteScrollEvent>();

  /**
   * The beforeRefresh event emitter, this will emit before the refresh occurs.
   * @type {EventEmitter<boolean>}
   */
  @Output() beforeRefresh = new EventEmitter<boolean>();

  /**
   * The jumpTo event emitter, this will emit if the jumpTo button is clicked.
   * @type {EventEmitter<number>}
   */
  @Output() jumpTo = new EventEmitter<number>();

  /**
   * If set to false, align to left. Default is true.
   * @type {boolean}
   */
  @Input() alignToRight: boolean = true;

  /**
   * If set to true, no page number is shown. Default is false.
   * @type {boolean}
   */
  @Input() noPageNumber: boolean = false;

  /**
   * If set to true, previous page is disabled. Default is false.
   * @type {boolean}
   */
  @Input() prevPageDisabled: boolean = false;

  /**
   * If set to true, next page is disabled. Default is false.
   * @type {boolean}
   */
  @Input() nextPageDisabled: boolean = false;

  /**
   * If set to true, no total number is shown. Default is false.
   * @type {boolean}
   */
  @Input() noTotalNumber: boolean = false;

  /**
   * If you need to support more than one instance of pagination at a time,
   * set the id and ensure it matches the id set in the PaginatePipe config.
   */
  @Input() id: string;

  /**
   * Defines the maximum number of page links to display. Default is 7.
   */
  @Input() maxSize: number = 7;

  /**
   * If set to false, the "previous" and "next" links will not be displayed. Default is true.
   */
  @Input() directionLinks: boolean = true;

  /**
   * If set to true, the pagination controls will not be displayed when all items in the collection
   * fit onto the first page. Default is true.
   */
  @Input() autoHide: boolean = true;

  /**
   * The label displayed on the "previous" link.
   */
  @Input() previousLabel: string;

  /**
   * The label displayed on the "next" link.
   */
  @Input() nextLabel: string;

  /**
   * The word for "Pagination" used to label the controls for screen readers.
   */
  @Input() screenReaderPaginationLabel: string;

  /**
   * The word for "page" used in certain strings generated for screen readers, e.g. "Next page".
   */
  @Input() screenReaderPageLabel: string;

  /**
   * The phrase indicating the current page for screen readers, e.g. "You're on page ".
   */
  @Input() screenReaderCurrentLabel: string;

  /**
   * The total number of entries for the entire store.
   */
  @Input() total: number = 0;

  /**
   * The displayed count of entries for the entire store, for "infiniteScrolling" mode only
   */
  @Input() displayedCount: number = 0;

  /**
   * If set to true, no displayed count is shown. Default is false.
   * @type {boolean}
   */
  @Input() noDisplayedCount: boolean = false;

  /**
   * An alternative paginate model, if provided, the id & total input values will be ignored,
   * and the id & total members will rely on the model, also, the toolbar will internally
   * retrieve the page from server-side by calling the getPage method of the model.
   */
  @Input() model: PaginateModel<any>;

  /**
   * The supported pagination mode. Default is 'normal'.
   * @type {PaginationMode}
   */
  @Input() supportedMode: PaginationMode = 'normal';

  /**
   * The initial pagination mode, it is applicable only if the supportedMode is 'both'. Valid value is 'normal' or
   * 'infiniteScrolling', default is 'normal'.
   * @type {PaginationMode}
   */
  @Input() initialMode: PaginationMode = 'normal';

  /**
   * Should set an ElementRef or HTMLElement for a scrollable element,
   * it is applicable only if the supportedMode is 'both' or 'infiniteScrolling'.
   *
   * @type {ElementRef | HTMLElement}
   */
  @Input() infiniteScrollContainer: ElementRef | HTMLElement;

  /**
   * If set to true, no refresh button will be shown.  Default is false.
   */
  @Input() hideRefreshButton: boolean = false;

  /**
   * If set to true, infiniteScroll will be disabled. Default is false.
   */
  @Input() infiniteScrollDisabled: boolean = false;

  /**
   * If set to true,  the button support to jump to the last page will be enabled. Default is false,
   * it is applicable only if the supportedMode is 'both' or 'infiniteScrolling'.
   */
  @Input() jumpToLastPageEnabled: boolean = false;

  /**
   * If set to true, a loading indicator will be shown when current mode is 'infiniteScrolling'. Default is false.
   */
  infiniteScrollLoadingIndicator: boolean = false;

  /**
   * If a change is detected in the value of resetEntryNumber, entryNumber will be set to null. 
   * Usecase: When the user clicks on a different job session
   */
  @Input() resetEntryNumber: boolean = false;

  errorHandler: ErrorHandlerComponent;

  get infiniteScrollingSupported(): boolean {
    return this.supportedMode === 'infiniteScrolling' || this.supportedMode === 'both';
  }

  get normalPaginationSupported(): boolean {
    return this.supportedMode === 'normal' || this.supportedMode === 'both';
  }

  get canSwitchMode(): boolean {
    return this.supportedMode === 'both';
  }

  get invalidInitialMode(): boolean {
    return this.initialMode === 'normal' || this.initialMode === 'infiniteScrolling';
  }

  get textSwitchMode(): string {
    return SharedService.formatString(this.textSwitchToPaginationModeTpl, this.currentMode === 'normal' ?
    this.textInfiniteScrolling : this.textNormalPagination);
  }

  get isInfiniteScrollingMode(): boolean {
    return this.currentMode === 'infiniteScrolling';
  }

  get refreshDisabled(): boolean {
    return this.isInfiniteScrollingMode && this.infiniteScrollLoadingIndicator;
  }

  get jumpToDisabled(): boolean {
    return !(this.entryNumber >= 1 && this.entryNumber <= this.totalItems) || this.refreshDisabled;
  }

  get totalItems(): number {
    let total = this.model ? this.model.totalItems : this.total;
    return this.isInfiniteScrollingMode ? (total || this.displayedCount) : total;
  }

  private currentMode: PaginationMode;
  private textPrev: string;
  private textNext: string;
  private textRefresh: string;
  private textTotal: string;
  private textDisplayed: string;
  private textInfiniteScrolling: string;
  private textNormalPagination: string;
  private textSwitchToPaginationModeTpl: string = '';
  private entryNumber: number;

  constructor(private translate: TranslateService) {
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnChanges(simpleChanges: SimpleChanges) {
    if (simpleChanges['resetEntryNumber'] && 
      (simpleChanges['resetEntryNumber']['currentValue'] !== simpleChanges['resetEntryNumber']['previousValue'])) {
      this.entryNumber = null;      
    }    
  }

  onPageChange(page: number): void {
    this.goPage(page);
  }

  onRefresh(): void {
    let me = this, ismode = me.isInfiniteScrollingMode;

    me.beforeRefresh.emit(ismode);
    me.goPage(ismode ? 1 : undefined, ismode);
    if (ismode) {
      me.infiniteScrollLoadingIndicator = false;
      me.scrollToTop();
    }
  }

  onJumpToClick(): void {
    let me = this;
    if (me.isInfiniteScrollingMode) {
      me.jumpTo.emit(me.entryNumber);
    }
  }

  onJumpToLastPageClick(): void {
    let me = this;
    if (me.isInfiniteScrollingMode)
      me.lastPage();
  }

  onSwitchMode(): void {
    let me = this;
    me.currentMode = me.currentMode === 'normal' ? 'infiniteScrolling' : 'normal';
    me.goPage(1);
    if (me.isInfiniteScrollingMode) {
      me.infiniteScrollLoadingIndicator = false;
      me.scrollToTop();
    }
  }

  onScrollDown(event: InfiniteScrollEvent): void {
    let me = this;
    if (me.isInfiniteScrollingMode) {
      me.scrolled.emit(event);
    }
  }

  onScrollUp(event: InfiniteScrollEvent): void {
    let me = this;
    if (me.isInfiniteScrollingMode) {
      me.scrolledUp.emit(event);
    }
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.textPrev',
      'common.textNext',
      'common.textRefresh',
      'common.textColonTotal',
      'common.textColonDisplayed',
      'common.textInfiniteScrolling',
      'common.textNormalPagination',
      'common.textSwitchToPaginationModeTpl'])
      .subscribe((resource: Object) => {
        me.previousLabel = me.previousLabel === undefined ? resource['common.textPrev'] : me.previousLabel;
        me.nextLabel = me.nextLabel === undefined ? resource['common.textNext'] : me.nextLabel;
        me.textRefresh = resource['common.textRefresh'];
        me.textTotal = resource['common.textColonTotal'];
        me.textDisplayed = resource['common.textColonDisplayed'];
        me.textInfiniteScrolling = resource['common.textInfiniteScrolling'];
        me.textNormalPagination = resource['common.textNormalPagination'];
        me.textSwitchToPaginationModeTpl = resource['common.textSwitchToPaginationModeTpl'];
      });
    if (me.model) {
      me.id = me.model.id;
      me.total = me.model.totalItems;
    }
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.initCurrentMode();
  }

  getInfiniteScrollContainer(): HTMLElement {
    let me = this, el: HTMLElement = null;
    if (me.infiniteScrollContainer) {
      if (me.infiniteScrollContainer instanceof ElementRef)
        el = me.infiniteScrollContainer.nativeElement;
      else
        el = me.infiniteScrollContainer;
    }
    return el;
  }

  scrollToTop(top?: number): void {
    let el: HTMLElement = this.getInfiniteScrollContainer();
    if (el) {
      el.scrollTo({top: top || 0});
    }
  }

  hasLastPageLink(): boolean {
    let dataset = this.model ? this.model.dataset :  null;
    return dataset && dataset.hasLink('lastPage');
  }

  private initCurrentMode(): void {
    let me = this;
    if (me.canSwitchMode) {
      me.currentMode = me.invalidInitialMode ? me.initialMode :
        (me.normalPaginationSupported ? 'normal' : 'infiniteScrolling');
    } else {
      me.currentMode = me.normalPaginationSupported ? 'normal' : 'infiniteScrolling';
    }
  }

  /**
   * Go page, if the page parameter is undefined, reload(refresh) current page.
   * @param {number} page
   * @param {boolean} repickPagingParam
   */
  private goPage(page?: number, repickPagingParam?: boolean) {
    let me = this, ret, observable: Observable<DatasetModel<any>>, link: LinkModel;
    if (me.model) {
      ret = me.model.goPage(page === undefined ? me.model.currentPage : page, repickPagingParam);
      if (ret) {
        observable = ret.observable;
        link = ret.link;
        if (observable) {
          me.startGoPage.emit();
          ret.observable.subscribe(
            dataset => {
              if (page === undefined)
                me.refresh.emit(dataset);
              else
                me.pageChange.emit({page: page, dataset: dataset, link: link});
            },
            err => me.handleError(err, false),
          );
        }
      } else if (page === undefined) {
        me.refresh.emit();
      } else {
        me.pageChange.emit(page);
      }
    } else {
      if (page === undefined)
        me.refresh.emit();
      else
        me.pageChange.emit(page);
    }
  }

  private lastPage() {
    let me = this, page: number, pageSize: number, ret, observable: Observable<DatasetModel<any>>, link: LinkModel;
    if (me.model) {
      pageSize = me.model.pageSize();
      page = pageSize === 0 ? 0 : Math.ceil(me.totalItems / pageSize);
      if (!page)
        return;

      ret = me.model.goPage(page);
      if (ret) {
        observable = ret.observable;
        link = ret.link;
        if (observable) {
          me.startGoPage.emit();
          ret.observable.subscribe(
            dataset => {
              me.pageChange.emit({page: page, dataset: dataset, link: link});
            },
            err => me.handleError(err, false),
          );
        }
      }
    }
  }
}
