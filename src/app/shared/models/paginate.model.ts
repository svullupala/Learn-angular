import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {HasProxy} from 'core';
import {LinkModel} from './link.model';
import {DatasetModel} from './dataset.model';
import {PaginateConfigModel} from './paginate-config.model';

/**
 * A generic derived class of PaginateConfigModel for the easier usage of pagination,
 * it provides the convenience of retrieving data set from server-side.
 */
export class PaginateModel<T extends HasProxy> extends PaginateConfigModel {

  /**
   * The data set controlled by the paginator(could be a paging toolbar).
   */
  dataset: DatasetModel<T>;

  /**
   * The class object of date set.
   */
  classObject: { new(): DatasetModel<T> };

  /**
   * Set to true if always rely on page links. e.g. Global Search API - GET 'api/endeavour/search', it doesn't support
   * navigating page by a given pageStartIndex parameter.
   *
   * @type {boolean}
   */
  alwaysRelyOnPageLinks: boolean = false;

  /**
   * Gets records.
   * @returns {Array<T extends HasProxy>}
   */
  get records(): Array<T> {
    return this.dataset ? this.dataset.records : [];
  }

  get hasPrevPageLink(): boolean {
    return this.dataset && this.dataset.hasLink('prevPage');
  }

  get hasNextPageLink(): boolean {
    return this.dataset && this.dataset.hasLink('nextPage');
  }

  /**
   * Constructor
   * @param config
   */
  constructor(config: {
    id?: string, pageSize?: number, classObject: { new(): DatasetModel<T> },
    relyOnPageLinks?: boolean
  }) {
    super(config);
    this.classObject = config.classObject;
    this.alwaysRelyOnPageLinks = config.relyOnPageLinks || false;
  }

  /**
   * Resets the options.
   *
   */
  reset(): void {
    super.reset();
    this.dataset = undefined;
  }

  /**
   * Calls this method to update the data set after a data set is retrieved from
   * the server side.
   * @param dataset {DatasetModel<T>}
   */
  update(dataset: DatasetModel<T>): void {
    let me = this;
    me.dataset = dataset;
    super.refresh(dataset.total);
  }

  /**
   * Go page method.
   * @param {number} page
   * @param {boolean} repickPagingParam
   * @returns {any | {observable: Observable<DatasetModel<T extends HasProxy>>; link: LinkModel}}
   */
  goPage(page: number, repickPagingParam?: boolean):
    false | { observable: Observable<DatasetModel<T>>, link: LinkModel } {
    let me = this, observable: Observable<DatasetModel<T>>, link = me.getPageLink(page);

    if (me.alwaysRelyOnPageLinks && (!link || link.name === 'self'))
      return false;

    me.pageChanged(page);
    if (me.dataset) {
      observable = (link && !repickPagingParam) ? me.dataset.getPage(me.classObject, link.name)
        : me.dataset.getPageBySelf(me.classObject, me.pageStartIndex(), me.pageSize());
      if (observable)
        return {
          observable: observable.do(
            dataset => {
              me.update(dataset);
            }),
          link: link
        };
    }
    return false;
  }

  private getPageLink(page: number): LinkModel {
    let me = this, pageSize = me.pageSize(),
      pageCount = pageSize === 0 ? 0 : Math.ceil(me.totalItems / pageSize),
      offset = page - me.currentPage, link: LinkModel, name: string;
    if (offset !== 0) {
      if (offset === 1)
        name = 'nextPage';
      else if (offset === -1)
        name = 'prevPage';
      else if (page === 1)
        name = 'firstPage';
      else if (page === pageCount)
        name = 'lastPage';
    } else {
      name = 'self';
    }
    if (name && name.length > 0 && me.dataset)
      link = me.dataset.getLink(name);

    return link;
  }
}
