import {Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {PaginateModel} from '../../models/paginate.model';
import {DatasetModel} from '../../models/dataset.model';
import {ErrorHandlerComponent} from 'shared/components';
import {RestService, SessionService} from 'core';
import {LinkModel} from '../../models/link.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'paging-dockbar',
  templateUrl: './paging-dockbar.component.html',
  styleUrls: ['./paging-dockbar.component.scss']
})
export class PagingDockbarComponent implements OnInit, OnChanges {

  /**
   * The pageSizeChange event emitter.
   * @type {EventEmitter<number>}
   */
  @Output() pageSizeChange = new EventEmitter<number>();

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
   * The beforeRefresh event emitter, this will emit before the refresh occurs.
   * @type {EventEmitter<boolean>}
   */
  @Output() beforeRefresh = new EventEmitter<boolean>();

  /**
   * If set to false, align to left. Default is true.
   * @type {boolean}
   */
  @Input() alignToRight: boolean = true;

  /**
   * If you need to support more than one instance of pagination at a time,
   * set the id and ensure it matches the id set in the PaginatePipe config.
   */
  @Input() id: string;

  /**
   * Defines the page size. Default is RestService.pageSize.
   */
  @Input() itemsPerPage: number = RestService.pageSize;

  /**
   * The label displayed on the "previous" link.
   */
  @Input() previousLabel: string;

  /**
   * The label displayed on the "next" link.
   */
  @Input() nextLabel: string;

  /**
   * The total number of entries for the entire store.
   */
  @Input() total: number = 0;


  /**
   * The current (active) page number.
   */
  @Input() currentPage: number = 1;

  /**
   * An alternative paginate model, if provided, the id & total & pageSize input values will be ignored,
   * and the id & total members will rely on the model, also, the toolbar will internally
   * retrieve the page from server-side by calling the getPage method of the model.
   */
  @Input() model: PaginateModel<any>;

  /**
   * If set to true, no refresh button will be shown.  Default is false.
   */
  @Input() hideRefreshButton: boolean = false;

  errorHandler: ErrorHandlerComponent;
  pages: NvPairModel[] = [];
  sizes: NvPairModel[] = [];

  private textRefresh: string;
  private textTotal: string;
  private textDisplayed: string;
  private textItemsPerPageTpl: string;
  private textOfPagesTpl: string;
  private textOfPageTpl: string;
  private textOfItemsTpl: string;
  private textTotalItemsTpl: string;
  private textTotalItemTpl: string;

  constructor(private translate: TranslateService) {
  }

  get refreshDisabled(): boolean {
    return false;
  }

  get identity(): string {
    return this.model ? this.model.id : this.id;
  }

  get totalItems(): number {
    return this.model ? this.model.totalItems : this.total;
  }

  get pageSize(): number {
    return this.model ? this.model.pageSize() : this.itemsPerPage;
  }

  get totalPages(): number {
    return this.model ? this.model.totalPages() :
      (this.itemsPerPage ? Math.ceil(this.totalItems / this.itemsPerPage) : 0);
  }

  get pageStartIndex(): number {
    return this.model ? this.model.pageStartIndex() : (this.itemsPerPage * (this.currentPage - 1));
  }

  get pageEndIndex(): number {
    return this.model ? this.model.pageEndIndex() :
      ((this.itemsPerPage * this.currentPage < this.totalItems) ? (this.itemsPerPage * this.currentPage - 1) :
        (this.itemsPerPage * (this.currentPage - 1) + (this.itemsPerPage ?
          (this.totalItems % this.itemsPerPage - 1) : 0)));
  }

  get hasNextPage(): boolean {
    return this.model ? this.model.hasNextPage() : (this.itemsPerPage * this.currentPage < this.totalItems);
  }

  get textItemsPerPage(): string {
    return SharedService.formatString(this.textItemsPerPageTpl, this.pageSize);
  }

  get textOfPages(): string {
    return SharedService.formatString(this.totalPages === 1 ? this.textOfPageTpl : this.textOfPagesTpl,
      this.totalPages);
  }

  get textOfItems(): string {
    return this.totalItems < 2 ?
      SharedService.formatString(this.totalItems === 1 ? this.textTotalItemTpl : this.textTotalItemsTpl,
        this.totalItems) :
      SharedService.formatString(this.textOfItemsTpl,
        this.pageStartIndex + 1,
        this.pageEndIndex + 1,
        this.totalItems);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnChanges(changes: SimpleChanges) {
    let me = this;
    if (changes && (changes['model'] && !changes['model'].isFirstChange()
      || changes['itemsPerPage'] && !changes['itemsPerPage'].isFirstChange()
      || changes['total'] && !changes['total'].isFirstChange())) {
      me.resetParams();
    }
  }

  resetParams(): void {
    let me = this, totalPages = me.totalPages, maxPageSize = RestService.pageSize,
      step = 10, stepCount = Math.ceil(maxPageSize / step);
    me.pages.splice(0, me.pages.length);
    for (let i = 0; i < totalPages; i++) {
      me.pages.push(new NvPairModel('' + (i + 1), i + 1));
    }
    me.sizes.splice(0, me.sizes.length);
    for (let i = 2; i < stepCount; i++) {
      me.sizes.push(new NvPairModel('' + (i + 1) * step, (i + 1) * step));
    }
  }

  onPageChange(page: number): void {
    this.goPage(page);
  }

  onRefresh(): void {
    let me = this;

    me.beforeRefresh.emit(false);
    me.goPage(undefined, false);
  }

  onPageSizeClick(item: NvPairModel): void {
    this.pageSizeChange.emit(item.value);
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.textPrev',
      'common.textNext',
      'common.textRefresh',
      'common.textColonTotal',
      'common.textColonDisplayed',
      'common.textItemsPerPageTpl',
      'common.textOfPagesTpl',
      'common.textOfPageTpl',
      'common.textOfItemsTpl',
      'common.textTotalItemsTpl',
      'common.textTotalItemTpl'
    ])
      .subscribe((resource: Object) => {
        me.previousLabel = me.previousLabel === undefined ? resource['common.textPrev'] : me.previousLabel;
        me.nextLabel = me.nextLabel === undefined ? resource['common.textNext'] : me.nextLabel;
        me.textRefresh = resource['common.textRefresh'];
        me.textTotal = resource['common.textColonTotal'];
        me.textDisplayed = resource['common.textColonDisplayed'];
        me.textItemsPerPageTpl = resource['common.textItemsPerPageTpl'];
        me.textOfPagesTpl = resource['common.textOfPagesTpl'];
        me.textOfPageTpl = resource['common.textOfPageTpl'];
        me.textOfItemsTpl = resource['common.textOfItemsTpl'];
        me.textTotalItemsTpl = resource['common.textTotalItemsTpl'];
        me.textTotalItemTpl = resource['common.textTotalItemTpl'];
      });
    if (me.model) {
      me.id = me.model.id;
      me.total = me.model.totalItems;
    }
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.resetParams();
  }

  hasLastPageLink(): boolean {
    let dataset = this.model ? this.model.dataset : null;
    return dataset && dataset.hasLink('lastPage');
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
