import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output
} from '@angular/core';
import { ScrollTabEntry } from 'shared/components/sroll-tabset';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs';

@Component({
  selector: 'scroll-tabset-tabs',
  styleUrls: ['./tabs.component.scss'],
  templateUrl: './tabs.component.html'
})
export class ScrollTabsetTabsComponent implements OnDestroy, AfterViewInit {
  @Input('tabs')
  set tabs(value: ScrollTabEntry[]) {
    this._tabs = value;
    if (this.contentElement) {
      this.setActiveTab();
    }
  }
  @Input() contentElement: ElementRef;
  @Output() tabChanged = new EventEmitter<ScrollTabEntry>();

  _tabs: ScrollTabEntry[] = [];
  private scrollContentSubscription: Subscription;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (this.contentElement) {
      this.subscribeToScrollContentEvent();
    }
  }

  ngOnDestroy(): void {
    if (this.scrollContentSubscription) {
      this.scrollContentSubscription.unsubscribe();
    }
  }

  onChangeTab(tab: ScrollTabEntry): void {
    const scrolledToTab = this._tabs.find(t => t.key === tab.key);

    if (this.contentElement) {
      this.scrollContentSubscription.unsubscribe();
      this.tabChanged.emit(scrolledToTab);

      setTimeout(() => {
        this.subscribeToScrollContentEvent();
      });
    }
    this.changeActiveTab(tab);
  }

  private subscribeToScrollContentEvent(): void {
    this.ngZone.runOutsideAngular(() => {
      const obs = fromEvent(this.contentElement.nativeElement, 'scroll');

      this.scrollContentSubscription = obs.subscribe(() => {
        this.onScrollContent();
      });
    });
  }

  private onScrollContent(): void {
    this.setActiveTab();
  }

  private setActiveTab(): void {
    const scrollPos = Math.ceil(this.contentElement.nativeElement.scrollTop);

    if (scrollPos === 0) {
      this.changeActiveTab(this._tabs[0]);
      return;
    }

    this._tabs.forEach((tab, index) => {
      if (scrollPos > tab.scrollPosition) {
        const tabTo = index === this._tabs.length - 1 ? tab : this._tabs[index + 1];
        this.changeActiveTab(tabTo);
      }
    });
  }

  private changeActiveTab(activeTab: ScrollTabEntry): void {
    this._tabs = this._tabs.map(tab => ({
      ...tab,
      active: activeTab.key === tab.key
    }));
    this.cdr.detectChanges();
  }
}
