import {Injectable} from '@angular/core';
import {SelectorService} from './selector.service';

export interface HasEquals<T> {
  equals(t: T): boolean;
}

@Injectable()
export class GenericSelectorService<T extends HasEquals<T>> extends SelectorService<T> {

  protected records: T[] = [];

  public select(records: T | T[]): void {
    let me = this, items = Array.isArray(records) ? records : [records],
      target = items.filter(function (item) {
        return !me.contains(item);
      });
    me.records = me.records.concat(target);
  }

  public deselect(records: T | T[]): void {
    let me = this, items = Array.isArray(records) ? records : [records];
    items.forEach(function (item) {
      let index = me.indexOf(item);
      if (index !== -1)
        me.records.splice(index, 1);
    });
  }

  public deselectAll(): void {
    if (this.records.length > 0)
      this.records.splice(0);
  }

  public isSelected(record: T): boolean {
    return this.contains(record);
  }

  public hasPartialSelection(record: T): boolean {
    return false;
  }

  public getPath(record: T): string {
    return '';
  }

  public setPath(record: T, path: string): void {
  }

  public count(): number {
    return this.records.length;
  }

  public selection(): T[] {
    return this.records;
  }

  protected contains(record: T): boolean {
    return this.indexOf(record) !== -1;
  }

  protected indexOf(record: T): number {
    return this.records.findIndex(function (item) {
      return item.equals(record);
    });
  }
}
