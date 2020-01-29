import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { fromEvent } from 'rxjs/observable/fromEvent';

import { FixedAngularMultiSelect } from 'shared/util/keyboard-multiselect';

@Directive({
  selector: '[fixMultiselectDropdownPosition]'
})
export class FixMultiselectDropdownPositionDirective implements AfterViewInit, OnDestroy {
  @Input('fixMultiselectDropdownPosition') multiselect: FixedAngularMultiSelect;
  @Input('scrollableParentElement') scrollableParentElement: HTMLElement;

  public dropdownEl: HTMLElement;
  private inputEl: HTMLElement;
  private dropdownClosed = new Subject();
  private destroy = new Subject();

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.dropdownEl = this.el.nativeElement.getElementsByClassName('dropdown-list')[0];
    this.inputEl = this.el.nativeElement.getElementsByClassName('selected-list')[0];

    this.multiselect.activeChange.takeUntil(this.destroy).subscribe(value => {
      if (value && this.dropdownEl) {
        this.onOpenDropdown();
      } else {
        this.dropdownClosed.next();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  private onOpenDropdown(): void {
    this.ngZone.runOutsideAngular(() => {
      this.appendStylesToDropdown();
      if (this.scrollableParentElement) {
        this.onScrollParentElement$().subscribe(() => {
          const inputBounds: ClientRect = this.inputEl.getBoundingClientRect();
          this.dropdownEl.style.top = inputBounds.top + inputBounds.height - 30 + 'px';
        });
      }
    });
  }

  private onScrollParentElement$(): Observable<MouseEvent> {
    return fromEvent<MouseEvent>(this.scrollableParentElement, 'scroll').takeUntil(
      this.dropdownClosed || this.destroy
    );
  }

  private appendStylesToDropdown(): void {
    const inputBounds = this.inputEl.getBoundingClientRect();

    this.dropdownEl.style.position = 'fixed';
    this.dropdownEl.style.overflow = 'hidden';
    this.dropdownEl.style.display = 'block';
    this.dropdownEl.style.top = inputBounds.top + inputBounds.height - 30 + 'px';
    this.dropdownEl.style.maxHeight = this.multiselect.settings.maxHeight + 5 + 'px';
    this.dropdownEl.style.width = inputBounds.width + 'px';
    this.dropdownEl.style.borderTop = '1px solid #464646';
    try {
      this.dropdownEl.getBoundingClientRect().left = inputBounds.left;
    } catch (e) {}
  }
}
