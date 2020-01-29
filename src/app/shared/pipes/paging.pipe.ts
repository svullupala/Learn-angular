import {Pipe, PipeTransform} from '@angular/core';
import {PaginatePipe} from 'ngx-pagination';

/**
 * Paging pipe, this is a simple encapsulation of PaginatePipe.
 * The pipe should be placed at the end of an NgFor expression. It accepts a single argument,
 * an object conforming to the PaginationInstance interface. The following config options are available:
 * <element *ngFor="let item of collection | paginate: { id: 'foo',
 *                                                    itemsPerPage: pageSize,
 *                                                    currentPage: p,
 *                                                    totalItems: total }">...</element>
 */
@Pipe({name: 'paging'})
export class PagingPipe implements PipeTransform {
  constructor(private paginate: PaginatePipe) {
  }

  transform(collection: any[], args: any): any {
    return this.paginate.transform(collection, args);
  }
}
