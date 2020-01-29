import {
  Component, Input, Output, EventEmitter, ElementRef, ViewChild, TemplateRef, OnInit,
  ChangeDetectorRef
} from '@angular/core';
import {isString} from 'util';
import 'style-loader!./dynamic-tabset.component.scss';

export type DynamicTabEntry = {
  key: string;
  title: string;
  content: string | TemplateRef<any>;
  removable?: boolean;
  refresh?: boolean;
  active?: boolean;
  disabled?: boolean;
  customClass?: string;
};

/**
 *  A dynamic tabset component which based on the ngx-bootstrap tabset provides add & remove tab methods,
 *  also tries to follow the sdl style.
 *
 *     Selector: dynamic-tabset
 *
 *     Events:
 *              select, deselect, added and removed.
 *
 *     Inputs:
 *              tabs - default([])
 *
 */
@Component({
  selector: 'dynamic-tabset',
  templateUrl: './dynamic-tabset.component.html'
})
export class DynamicTabsetComponent implements OnInit {
  @Input() tabs: DynamicTabEntry[] = [];
  @Input() lastRefreshedAt: Date;
  @Output() select = new EventEmitter<DynamicTabEntry>();
  @Output() deselect = new EventEmitter<DynamicTabEntry>();
  @Output() refresh = new EventEmitter<DynamicTabEntry>();
  @Output() added = new EventEmitter<DynamicTabEntry>();
  @Output() removed = new EventEmitter<DynamicTabEntry[]>();

  @ViewChild('searchField') searchField: ElementRef;

  constructor(private changeDef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.tabs = this.tabs || [];
  }

  addTab(tab: DynamicTabEntry): boolean {
    if (this.indexOf(tab) !== -1)
      return false;

    this.tabs.push(tab);
    this.added.emit(tab);
    return true;
  }

  removeTab(tab: string | DynamicTabEntry): DynamicTabEntry[] {
    let result: DynamicTabEntry[] = [];
    if (this.indexOf(tab) !== -1) {
      result = this.tabs.splice(this.indexOf(tab), 1);
      this.removed.emit(result);
    }
    return result;
  }

  removeAllTabs(): DynamicTabEntry[] {
    let result: DynamicTabEntry[] = [];
    if (this.tabs.length > 0) {
      result = this.tabs.splice(0, this.tabs.length);
      this.removed.emit(result);
    }
    return result;
  }

  existTab(tab: string | DynamicTabEntry): boolean {
    return this.indexOf(tab) !== -1;
  }

  runChangeDetection(): void {
    if (!this.changeDef['destroyed']) {
      this.changeDef.detectChanges();
    }
  }

  private onSelect(tab: DynamicTabEntry): void {
    tab.active = true;
    this.select.emit(tab);
  }

  private onDeselect(tab: DynamicTabEntry): void {
    tab.active = false;
    this.deselect.emit(tab);
  }

  private onRefresh(tab: DynamicTabEntry) {
    this.refresh.emit(tab);
  }

  private find(tab: string | DynamicTabEntry): DynamicTabEntry {
    return this.tabs.find(function (entry) {
      return entry.key === (isString(tab) ? tab : (<DynamicTabEntry>tab).key);
    });
  }

  private indexOf(tab: string | DynamicTabEntry): number {
    return this.tabs.findIndex(function (entry) {
      return entry.key === (isString(tab) ? tab : (<DynamicTabEntry>tab).key);
    });
  }

  private hasPlainContent(tab: DynamicTabEntry): boolean {
    return tab && isString(tab.content);
  }
}
