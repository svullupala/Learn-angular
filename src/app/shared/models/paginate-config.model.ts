import {RestService} from 'core';

/**
 * A simple class encapsulates the paging configuration options,
 * its json() method can be used as the parameter of paging pipe.
 */
export class PaginateConfigModel {

  /**
   * Required. The number of items to display on each page.
   */
  itemsPerPage: number = RestService.pageSize;

  /**
   * Required. The current (active) page number.
   */
  currentPage: number = 1;

  /**
   * If you need to support more than one instance of pagination at a time,
   * set the id and ensure it matches the id attribute of PagingToolbarComponent.
   */
  id: string = undefined;

  /**
   * The total number of items in the collection. Only useful when doing server-side paging, where the collection size
   * is limited to a single page returned by the server API. For in-memory paging, this property should not be set,
   * as it will be automatically set to the value of collection.length. Default is doing server-side paging here.
   */
  totalItems: number = 0;

  /**
   * Constructor
   * @param config
   */
  constructor(config?: {id?: string, pageSize?: number}) {
    if (config && config.id)
      this.id = config.id;
    if (config && config.pageSize)
      this.itemsPerPage = config.pageSize;
    this.reset();
  }

  /**
   * Returns a json object contains the config options which can be passed as the parameter of paging pipe.
   * @returns {{itemsPerPage: number, currentPage: number, id: string, totalItems: number}}
   */
  json(): Object {
    return {
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
      id: this.id,
      totalItems: this.totalItems
    };
  }

  /**
   * Resets the options.
   *
   */
  reset(): void {
    this.currentPage = 1;
    this.totalItems = 0;
  }

  /**
   * Calls this method to refresh the total number of items in the collection after a data set is retrieved from
   * the server side.
   * @param total {number}
   */
  refresh(total: number): void {
    this.totalItems = total;
  }

  /**
   * Calls this method to update the current (active) page number after a pageChange event fires.
   *
   * @param page {number}
   */
  pageChanged(page: number): void {
    let me = this;
    me.currentPage = page;
  }

  /**
   * Calls this method to update the page size after a pageSizeChange event fires.
   *
   * @param pageSize {number}
   */
  pageSizeChanged(pageSize: number): void {
    let me = this;
    me.itemsPerPage = pageSize;
  }

  /**
   * Returns the page start index.
   * @returns {number}
   */
  pageStartIndex(): number {
    return this.itemsPerPage * (this.currentPage - 1);
  }

  /**
   * Returns the page end index.
   * @returns {number}
   */
  pageEndIndex(): number {
    let size: number = this.pageSize();
    return this.hasNextPage() ? (this.itemsPerPage * this.currentPage - 1) :
      (this.pageStartIndex() + size ? (this.totalItems % size - 1) : 0);
  }

  /**
   * Returns the page size.
   * @returns {number}
   */
  pageSize(): number {
    return this.itemsPerPage;
  }

  /**
   * Returns the total number of pages.
   * @returns {number}
   */
  totalPages(): number {
    let size: number = this.pageSize();
    return size ? Math.ceil(this.totalItems / size) : 0;
  }

  hasNextPage(): boolean {
    return this.itemsPerPage * this.currentPage < this.totalItems;
  }
}
