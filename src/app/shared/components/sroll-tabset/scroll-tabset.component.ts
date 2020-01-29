import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren
} from '@angular/core';

export interface ScrollTabEntry {
  key: string;
  title: string;
  content: TemplateRef<any>;
  active?: boolean;
  disabled?: boolean;
  scrollPosition?: number;
}

@Component({
  selector: 'scroll-tabset',
  templateUrl: './scroll-tabset.component.html',
  styleUrls: ['./scroll-tabset.component.scss']
})
export class ScrollTabsetComponent implements AfterViewInit {
  @Input('tabs')
  set tabs(value: ScrollTabEntry[]) {
    this._tabs = value;
  }
  @Input() disabled: boolean = false;
  @ViewChildren('tabs', { read: ElementRef }) renderedTabs: QueryList<ElementRef>;
  @ViewChild('content') contentElement: ElementRef;

  _tabs: ScrollTabEntry[] = [];

  constructor() {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      setTimeout(() => {
        this.assignScrollPositionToTabs();
      }, 0);
    }, 0);
  }

  onChangeTab(activeTab: ScrollTabEntry): void {
    if (this.contentElement) {
      this.contentElement.nativeElement.scrollTop = activeTab.scrollPosition;
    }
  }

  refreshTabs(): void {
    this.assignScrollPositionToTabs();
  }

  private assignScrollPositionToTabs(): void {
    const reassignedTabs: ScrollTabEntry[] = [...this._tabs];

    this.renderedTabs.toArray().forEach((tab, index) => {
      reassignedTabs[index].scrollPosition = tab.nativeElement.offsetTop;
    });
    this._tabs = reassignedTabs;
  }
}
