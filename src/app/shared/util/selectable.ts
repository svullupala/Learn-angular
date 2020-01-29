import {BaseModel} from '../models/base.model';
import {Output, EventEmitter} from '@angular/core';
import {ENTER, SPACE} from '@angular/cdk/keycodes';

export class Selectable {

  @Output() selectionChange = new EventEmitter();

  selectedItems: Array<BaseModel> = [];

  isSelected(item: BaseModel, singleSelect: boolean = false): boolean {
    if (singleSelect) {
      return item.url === (this.selectedItems.length > 0 && this.selectedItems[0].url);
    }
    return !!item.metadata['selected'];
  }

  toggleSelect(item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent,
               singleSelect: boolean = false): void {
    let currentIdx, hasChange, firstIdx = set.length, lastIdx = -1,
      idx = this.selectedItems.findIndex(function (record) {
        return item.equals(record);
      }), keyboard = event instanceof KeyboardEvent;
    if (keyboard) {
      let keyEvent = event as KeyboardEvent;
      // A11Y - Keyboard support
      if (keyEvent.keyCode === SPACE || keyEvent.keyCode === ENTER) {
        // Use SPACE or ENTER to select/deselect item.
        if (idx === -1 && !singleSelect) {
          item.metadata['selected'] = true;
          this.selectedItems.push(item);
        } else if (idx !== -1) {
          item.metadata['selected'] = false;
          this.selectedItems.splice(idx, 1);
        } else {

          this.selectedItems.forEach(function (selected) {
            if (!selected.equals(item)) {
              selected.metadata['selected'] = false;
            }
          });
          this.selectedItems.splice(0, this.selectedItems.length);
          item.metadata['selected'] = true;
          this.selectedItems.push(item);
        }
        this.selectionChange.emit(this.selectedItems);
      }
    } else {
      if (event.ctrlKey || event.metaKey) {
        if (idx === -1 && !singleSelect) {
          item.metadata['selected'] = true;
          this.selectedItems.push(item);
        } else {
          item.metadata['selected'] = false;
          this.selectedItems.splice(idx, 1);
        }
        this.selectionChange.emit(this.selectedItems);
      } else if (event.shiftKey) {
        this.selectedItems.forEach(function (selected) {
          let index = set.findIndex(function (record) {
            return selected.equals(record);
          });
          firstIdx = Math.min(firstIdx, index);
          lastIdx = Math.max(lastIdx, index);
        });
        currentIdx = set.findIndex(function (record) {
          return item.equals(record);
        });
        if (currentIdx !== -1) {
          if (firstIdx !== set.length && currentIdx < firstIdx) {
            this.selectedItems.forEach(function (selected) {
              selected.metadata['selected'] = false;
            });
            this.selectedItems.splice(0, this.selectedItems.length);
            for (let i = currentIdx; i <= lastIdx; i++) {
              set[i].metadata['selected'] = true;
              this.selectedItems.push(set[i]);
            }
            this.selectionChange.emit(this.selectedItems);
          } else if (lastIdx !== -1 && currentIdx > lastIdx) {
            this.selectedItems.forEach(function (selected) {
              selected.metadata['selected'] = false;
            });
            this.selectedItems.splice(0, this.selectedItems.length);
            for (let i = firstIdx; i <= currentIdx; i++) {
              set[i].metadata['selected'] = true;
              this.selectedItems.push(set[i]);
            }
            this.selectionChange.emit(this.selectedItems);
          }
        }
      } else {
        hasChange = idx === -1;
        this.selectedItems.forEach(function (selected) {
          if (idx === -1 || !selected.equals(item)) {
            selected.metadata['selected'] = false;
            hasChange = true;
          }
        });
        if (hasChange) {
          this.selectedItems.splice(0, this.selectedItems.length);
          item.metadata['selected'] = true;
          this.selectedItems.push(item);

          this.selectionChange.emit(this.selectedItems);
        }
      }
    }
  }
}
