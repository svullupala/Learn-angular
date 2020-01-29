import {Injectable} from '@angular/core';
import {BaseModel} from '../models/base.model';
import {SelectorService} from './selector.service';

@Injectable()
export class MultihierSelectorService extends SelectorService<BaseModel> {

  private records: BaseModel[] = [];

  public select(records: BaseModel | BaseModel[]): void {
    let me = this, items = Array.isArray(records) ? records : [records],
      target = items.filter(function (item) {
        return !me.hasAncestor(item, true) || me.isExcluded(item);
      });

    target.forEach(function (item) {
      me.include(item, true);
      me.removeDescendants(item);
      me.removeExcludedAncestors(item);
    });
  }

  public deselect(records: BaseModel | BaseModel[], exclusionSupported?: boolean): void {
    let me = this, removedItems = [], items = Array.isArray(records) ? records : [records];
    items.forEach(function (item) {
      let index = me.indexOf(item);
      if (index !== -1) {
        me.records.splice(index, 1);
        removedItems.push(item);
      } else if (exclusionSupported) {
        me.include(item, false);
      }
    });
    items.forEach(function (item) {
      me.removeDescendants(item);
      if (!exclusionSupported)
        me.removeIncludedAncestors(item);
    });
  }

  public deselectAll(): void {
    if (this.records.length > 0)
      this.records.splice(0);
  }

  public isSelected(record: BaseModel): boolean {
    let me = this;
    return me.contains(record, true) ||
      me.hasAncestor(record, true) && !me.isExcluded(record) ||
      me.hasPartialSelection(record);
  }

  public hasPartialSelection(record: BaseModel): boolean {
    return this.indexDescendant(record) !== -1;
  }

  public getPath(record: BaseModel): string {
    return record.metadata['path'] || '';
  }

  public setPath(record: BaseModel, path: string): void {
    record.metadata['path'] = path;
  }

  public count(): number {
    return this.records.length;
  }

  public selection(): BaseModel[] {
    return this.records;
  }

  private getInclude(record: BaseModel): boolean {
    return record.metadata['include'];
  }

  private setInclude(record: BaseModel, include: boolean): void {
    record.metadata['include'] = include;
  }

  private contains(record: BaseModel, checkInclude?: boolean): boolean {
    return this.indexOf(record, checkInclude) !== -1;
  }

  private hasAncestor(record: BaseModel, checkInclude?: boolean): boolean {
    return this.indexAncestor(record, checkInclude) !== -1;
  }

  private isAncestor(ancestor: BaseModel, descendant: BaseModel): boolean {
    let me = this, path1 = me.getPath(ancestor),
      path2 = me.getPath(descendant);
    return (path1 !== path2 && path2.indexOf(path1) === 0);
  }

  private isDescendant(descendant: BaseModel, ancestor: BaseModel) {
    let me = this, path1 = me.getPath(descendant),
      path2 = me.getPath(ancestor);
    return (path1 !== path2 && path1.indexOf(path2) === 0);
  }

  private removeIncludedAncestors(record: BaseModel): void {
    let me = this;
    me.records = me.records.filter(function (item) {
      let isAncestor = me.isAncestor(item, record);
      return !isAncestor || me.getInclude(item) === false;
    });
  }

  private removeExcludedAncestors(record: BaseModel): void {
    let me = this;
    me.records = me.records.filter(function (item) {
      let isAncestor = me.isAncestor(item, record);
      return !isAncestor || me.getInclude(item) !== false;
    });
  }

  private removeDescendants(record: BaseModel): void {
    let me = this;
    me.records = me.records.filter(function (item) {
      let isDescendant = me.isDescendant(item, record);
      return !isDescendant;
    });
  }

  private indexDescendant(record: BaseModel, checkInclude?: boolean): number {
    let me = this;
    return me.records.findIndex(function (item) {
      let result = me.isDescendant(item, record);
      if (checkInclude)
        result = result && me.getInclude(item) === true;
      return result;
    });
  }

  private indexAncestor(record: BaseModel, checkInclude?: boolean, excluded?: boolean): number {
    let me = this;
    return me.records.findIndex(function (item) {
      let result = me.isAncestor(item, record);
      if (checkInclude)
        result = result && me.getInclude(item) === !excluded;
      return result;
    });
  }

  private indexOf(record: BaseModel, checkInclude?: boolean): number {
    let me = this;
    return me.records.findIndex(function (item) {
      let result = item.equals(record);
      if (checkInclude)
        result = result && me.getInclude(item) === true;
      return result;
    });
  }

  private isExcluded(record: BaseModel): boolean {
    let me = this, excluded,
      target = me.records.find(function (item) {
        return item.equals(record);
      });
    excluded = target && me.getInclude(target) !== true;
    if (!excluded) {
      // Find excluded ancestor to determine excluded status.
      excluded = me.indexAncestor(record, true, true) !== -1;
    }
    return excluded;
  }

  private include(record: BaseModel, value: boolean): void {
    let me = this,
      target = me.records.find(function (item) {
        return item.equals(record);
      });
    if (target)
      me.setInclude(target, value);
    else {
      me.setInclude(record, value);
      me.records.push(record);
    }
  }
}
