import {SorterModel} from '../models/sorter.model';

export interface Sortable {
  isAsc(name: string): boolean;

  isDesc(name: string): boolean;

  onSort(name: string): void;
}

export class SortUtil {
  public static has(sorters: Array<SorterModel>, name: string, desc?: boolean): boolean {
    return (sorters || []).findIndex(function (item: SorterModel) {
      let checkDirection = desc !== undefined, direct = desc ? 'desc' : 'asc';
      return item.property === name && (!checkDirection || (item.direction || '').toLowerCase() === direct);
    }) !== -1;
  }

  public static toggle(sorters: Array<SorterModel>, name: string): void {
    let direct, target = (sorters || []).find(function (item: SorterModel) {
      return item.property === name;
    });
    if (target) {
      direct = (target.direction || '').toLowerCase();
      target.direction = (direct === 'desc') ? 'ASC' : 'DESC';
    }
  }
}
