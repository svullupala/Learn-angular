import {Component, EventEmitter, Output} from '@angular/core';
import { SelectorService } from 'shared/selector/selector.service';
import { Subject } from 'rxjs/Subject';
import { genericSelectorFactory } from 'shared/selector/selector.factory';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';

/**
 * Selector Factory.
 * @param type
 * @returns {SelectorService}
 */
export function backupItemSelectFactory(): SelectorService<BaseApplicationModel> {
  return genericSelectorFactory<BaseApplicationModel>();
}

@Component({
  selector: 'application-backup-selection-table',
  templateUrl: 'application-backup-selection-table.component.html',
  providers: [
    {provide: SelectorService, useFactory: backupItemSelectFactory}
  ]
})

export class ApplicationBackupSelectionTableComponent {
  @Output() onRemoveItem = new EventEmitter<any>();
  private subs: Subject<void> = new Subject<void>();
  private summaryArray: any[] = [];

  private get records(): Array<BaseApplicationModel> {
    return this.selector.selection() || [];
  }

  constructor(private selector: SelectorService<BaseApplicationModel>) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public getSummaryText(): any[] {
    let me = this;
    if (me.summaryArray.length === 0 && me.records) {
      for (let i = 0; i < me.records.length; i++) {
        me.summaryArray.push({name: me.records[i].name});
      }
    }
    return me.summaryArray;
  }


  public setRecords(restoreItems: Array<BaseApplicationModel>): void {
    this.selector.select(restoreItems);
  }

  public getValue(): Array<BaseApplicationModel> {
    return this.records;
  }

  public add(item: BaseApplicationModel): void {
    this.selector.select(item);
  }

  public remove(item: BaseApplicationModel): void {
    this.selector.deselect(item);
    this.onRemoveItem.emit();
  }

  public isEmpty(): boolean {
    return this.records && this.records.length < 1;
  }
}
