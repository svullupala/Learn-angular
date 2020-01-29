import {CommonModule} from '@angular/common';
import {A11yModule, FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {
  Directive, ElementRef, AfterViewInit, ViewChildren, QueryList,
  HostListener, Output, EventEmitter, Input, OnInit, Renderer2, ViewChild, NgModule, NgZone, OnDestroy
} from '@angular/core';
import {
  ActiveDescendantKeyManager, FocusableOption, FocusKeyManager, Highlightable, ListKeyManager,
  ListKeyManagerOption
} from '@angular/cdk/a11y';
import {DOWN_ARROW, ENTER, SPACE, TAB, UP_ARROW} from '@angular/cdk/keycodes';
import {KeyboardMultiselect} from 'shared/util/keyboard-multiselect';
import {KeyboardPagination} from 'shared/util/keyboard-pagination';

@Directive({
  selector: '[focusable]'
})
/**
 *  A directive provides focusable support for HTML tags that focus status is not natively supported(e.g. "TR").
 *  Usage example:
 *   <tr ... tabindex="0" focusable>
 *      ...
 *   </tr>
 */
export class FocusableDirective implements FocusableOption {

  @Input() item: any;
  @Output() itemSelected = new EventEmitter();

  constructor(private renderer: Renderer2, public element: ElementRef) {
  }

  focus() {
    this.element.nativeElement.focus();
  }

  selectItem(event) {
    this.itemSelected.emit({event: event, data: this.item});
  }
}

/**
 * A base class provides navigating(via focusable items) between list items
 * (e.g. the html "TR" tag) support by UP_ARROW & DOWN_ARROW keys.
 * A component can extend this class when necessary.
 */
export class FocusableList implements AfterViewInit {

  @Input() spaceSelect: boolean = false;

  @ViewChildren(FocusableDirective) focusableItems: QueryList<FocusableDirective>;
  keyManager: FocusKeyManager<FocusableDirective>;

  ngAfterViewInit() {
    this.keyManager = new FocusKeyManager<FocusableDirective>(this.focusableItems).withWrap();
    this.keyManager.setActiveItem(0);
  }

  @HostListener('click', ['$event'])
  click(event: MouseEvent) {
    this.cancelFocus();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    let element: any = event.srcElement ? event.srcElement : event.target;

    if (!this.isElementSourceItem(element) ||
      event.keyCode === TAB && this.keyManager.activeItemIndex === this.focusableItems.length - 1) {

      if (this.keyManager.activeItemIndex === this.focusableItems.length - 1)
        this.cancelFocus();
      return;
    }

    if (event.keyCode === TAB) {
      event.preventDefault();
      return false;
    }

    // Use UP_ARROW & DOWN_ARROW to navigate between list items.
    if (event.keyCode === UP_ARROW) {
      this.keyManager.setPreviousItemActive();
      event.preventDefault();
    } else if (event.keyCode === DOWN_ARROW) {
      this.keyManager.setNextItemActive();
      event.preventDefault();
    } else if ((this.spaceSelect && event.keyCode === SPACE) || event.keyCode === ENTER) {
      // when we hit SPACE or ENTER, the keyboardManager should call the selectItem method of the `ListItemComponent`
      if (this.keyManager.activeItem)
        this.keyManager.activeItem.selectItem(event);
      event.preventDefault();
    }
  }

  cancelFocus(): void {
    this.keyManager.setActiveItem(-1);
  }

  private isElementSourceItem(element: Element): boolean {
    let target: FocusableDirective, items = this.focusableItems;
    if (items) {
      target = items.find(function (item) {
        return item.element.nativeElement === element;
      });
    }
    return !!target;
  }
}

@Directive({
  selector: '[activatable]'
})
/**
 *  A directive provides activatable support for the html tag(e.g. "TR").
 *  Usage example:
 *  <table ... tabindex="0" #activatableContainer>
 *   ...
 *   <tbody>
 *    <tr ... activatable>
 *      ...
 *    </tr>
 *   </tbody>
 *  </table>
 */
export class ActivatableDirective implements OnInit, ListKeyManagerOption {
  @Input() item: any;
  @Input() preventScroll: boolean = false;
  @Output() itemSelected = new EventEmitter();

  clsActive: string = 'activated';

  isActive: boolean;

  /** Whether the option is disabled. */
  disabled?: boolean;

  /** Gets the label for this option. */
  getLabel?(): string;

  constructor(private renderer: Renderer2, private element: ElementRef) {
  }

  ngOnInit() {
    this.isActive = false;
  }

  setActive(val) {
    this.isActive = val;
    if (val) {
      this.renderer.addClass(this.element.nativeElement, this.clsActive);
      if (!this.preventScroll)
        this.element.nativeElement.scrollIntoView();
    } else {
      this.renderer.removeClass(this.element.nativeElement, this.clsActive);
    }
  }

  selectItem(event) {
    this.itemSelected.emit({event: event, data: this.item});
  }
}

/**
 * A base class provides navigating(via activatable items) between list items
 * (e.g. the html "TR" tag) support by UP_ARROW & DOWN_ARROW keys.
 * A component can extend this class when necessary.
 */
export class ActivatableList implements AfterViewInit {

  @Input() spaceSelect: boolean = false;

  @ViewChild('activatableContainer') activatableContainer: ElementRef;

  @ViewChildren(ActivatableDirective) activatableItems: QueryList<ActivatableDirective>;
  keyManager: ListKeyManager<ActivatableDirective>;

  constructor(private element?: ElementRef) {
  }

  ngAfterViewInit() {
    let me = this;
    me.keyManager = new ListKeyManager<ActivatableDirective>(me.activatableItems).withWrap();
  }

  @HostListener('click', ['$event'])
  click(event: MouseEvent) {
    this.cancelActive();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    let element: any = event.srcElement ? event.srcElement : event.target,
      container = this.activatableContainer ? this.activatableContainer.nativeElement : this.element;

    if (element === container) {
      if (this.keyManager) {
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
          event.preventDefault();
          return false;
        }
      }
    }
  }

  @HostListener('keyup', ['$event'])
  keyup(event: KeyboardEvent) {
    let element: any = event.srcElement ? event.srcElement : event.target,
      container = this.activatableContainer ? this.activatableContainer.nativeElement : this.element;

    if (element !== container) {
      this.cancelActive();
      return;
    }

    event.stopImmediatePropagation();
    if (this.keyManager) {
      if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
        // deactivate current item if existing.
        if (this.keyManager.activeItem)
          this.keyManager.activeItem.setActive(false);
        // passing the event to key manager so we get a change fired.
        this.keyManager.onKeydown(event);
        // activate current item.
        if (this.keyManager.activeItem)
          this.keyManager.activeItem.setActive(true);
        return false;
      } else if ((this.spaceSelect && event.keyCode === SPACE) || event.keyCode === ENTER) {
        // when we hit SPACE or ENTER, the keyboardManager should call the selectItem method of the `ListItemComponent`
        if (this.keyManager.activeItem)
          this.keyManager.activeItem.selectItem(event);
        return false;
      } else if (event.keyCode === TAB) {
        this.cancelActive();
        return false;
      }
    }
  }

  cancelActive(): void {
    if (this.keyManager) {
      if (this.keyManager.activeItem)
        this.keyManager.activeItem.setActive(false);
      this.keyManager.setActiveItem(-1);
    }
  }
}


@Directive({
  selector: '[highlightable]'
})
/**
 *  A directive provides highlightable support for the html tag(e.g. "TR").
 *  Usage example:
 *  <table ... tabindex="0" #highlightableContainer>
 *   ...
 *   <tbody>
 *    <tr ... highlightable>
 *      ...
 *    </tr>
 *   </tbody>
 *  </table>
 */
export class HighlightableDirective implements Highlightable {
  @Input() item: any;
  @Input() preventScroll: boolean = false;
  @Output() itemSelected = new EventEmitter();

  clsActive: string = 'activated';

  /** Applies the styles for an active item to this item. */
  setActiveStyles(): void {
    this.renderer.addClass(this.element.nativeElement, this.clsActive);
    if (!this.preventScroll)
      this.element.nativeElement.scrollIntoView();
  }

  /** Applies the styles for an inactive item to this item. */
  setInactiveStyles(): void {
    this.renderer.removeClass(this.element.nativeElement, this.clsActive);
  }

  constructor(private renderer: Renderer2, private element: ElementRef) {
  }

  selectItem(event) {
    this.itemSelected.emit({event: event, data: this.item});
  }
}

/**
 * A base class provides navigating(via highlightable items) between list items
 * (e.g. the html "TR" tag) support by UP_ARROW & DOWN_ARROW keys.
 * A component can extend this class when necessary. e.g. the resource-group-table component.
 */
export class HighlightableList implements AfterViewInit {

  @Input() spaceSelect: boolean = false;

  @ViewChild('highlightableContainer') highlightableContainer: ElementRef;

  @ViewChildren(HighlightableDirective) highlightableItems: QueryList<HighlightableDirective>;
  keyManager: ActiveDescendantKeyManager<HighlightableDirective>;

  constructor(private element?: ElementRef) {
  }

  ngAfterViewInit() {
    let me = this;
    me.keyManager = new ActiveDescendantKeyManager<HighlightableDirective>(me.highlightableItems).withWrap();
  }

  @HostListener('click', ['$event'])
  click(event: MouseEvent) {
    this.cancelActive();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    let element: any = event.srcElement ? event.srcElement : event.target,
      container = this.highlightableContainer ? this.highlightableContainer.nativeElement : this.element;

    if (element === container) {
      if (this.keyManager) {
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
          event.preventDefault();
          return false;
        }
      }
    }
  }

  @HostListener('keyup', ['$event'])
  keyup(event: KeyboardEvent) {
    let element: any = event.srcElement ? event.srcElement : event.target,
      container = this.highlightableContainer ? this.highlightableContainer.nativeElement : this.element;

    if (element !== container) {
      this.cancelActive();
      return;
    }

    event.stopImmediatePropagation();
    if (this.keyManager) {
      if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
        // passing the event to key manager so we get a change fired.
        this.keyManager.onKeydown(event);
        return false;
      } else if ((this.spaceSelect && event.keyCode === SPACE) || event.keyCode === ENTER) {
        // when we hit SPACE or ENTER, the keyboardManager should call the selectItem method of the `ListItemComponent`
        if (this.keyManager.activeItem)
          this.keyManager.activeItem.selectItem(event);
        return false;
      } else if (event.keyCode === TAB) {
        this.cancelActive();
        return false;
      }
    }
  }

  cancelActive(): void {
    if (this.keyManager) {
      if (this.keyManager.activeItem)
        this.keyManager.activeItem.setInactiveStyles();
      this.keyManager.setActiveItem(-1);
    }
  }
}

@Directive({
  selector: '[clickOnEnterKeydown]'
})
/**
 *  A directive provides invoking click on Enter Keydown support for the html tag.
 */
export class ClickOnEnterKeydownDirective {
  constructor(private renderer: Renderer2, private element: ElementRef) {
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    let element: any = event.srcElement ? event.srcElement : event.target;

    if (event.keyCode === ENTER) {
      this.invokeClick(element);
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokeClick(el: HTMLElement): void {
    if (el && this.renderer)
      this.invokeElementMethod(el, 'click');
  }
}

export type KeyboardTabDirection = 'prev' | 'next';

@Directive({
  selector: '[disableKeyboard]'
})
/**
 *  A directive provides disable keyboard support for the html tag(e.g. div).
 */
export class DisableKeyboardDirective implements OnDestroy, OnInit {

  @Input() on: boolean = false;
  @Input() direction: KeyboardTabDirection;
  @Input() prevFocusEl: HTMLElement;
  @Input() nextFocusEl: HTMLElement;

  constructor(protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              protected element: ElementRef) {
  }

  ngOnInit() {
    this.focusMonitor.monitor(this.element.nativeElement, true)
      .subscribe(origin => this.ngZone.run(() => {
        if (origin === 'keyboard' && this.on) {
          if (this.direction === 'prev' && this.prevFocusEl)
            this.prevFocusEl.focus();
          else if (this.direction === 'next' && this.nextFocusEl)
            this.nextFocusEl.focus();
        }
      }));
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.element.nativeElement);
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (this.on) {
      return false;
    }
  }
}

export class KeyboardTabDirectionProvider {
  tabDirection: KeyboardTabDirection;

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.keyCode === 16 || event.keyCode === TAB && event.shiftKey) {
      this.tabDirection = 'prev';
    } else if (event.keyCode === TAB) {
      this.tabDirection = 'next';
    }
  }
}

@Directive({
  selector: '[keyboardTabDirectionProvider]'
})
/**
 *  A directive provides the Tab key direction support for the html tag(e.g. div[tabindex='0']).
 */
export class KeyboardTabDirectionProviderDirective extends KeyboardTabDirectionProvider {
}

@NgModule({
  imports: [CommonModule, A11yModule],
  declarations: [FocusableDirective, ActivatableDirective, HighlightableDirective,
    KeyboardMultiselect, KeyboardPagination, ClickOnEnterKeydownDirective, DisableKeyboardDirective,
    KeyboardTabDirectionProviderDirective],
  exports: [A11yModule, FocusableDirective, ActivatableDirective, HighlightableDirective,
    KeyboardMultiselect, KeyboardPagination, ClickOnEnterKeydownDirective, DisableKeyboardDirective,
    KeyboardTabDirectionProviderDirective]
})
export class A11yKeyboardModule {
}
