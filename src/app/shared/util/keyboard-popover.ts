import {
  ElementRef, HostListener, NgZone, OnDestroy, OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import {PopoverDirective} from 'ngx-bootstrap';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Subject} from 'rxjs/Subject';
import {ENTER, ESCAPE, TAB} from '@angular/cdk/keycodes';

export class KeyboardPopover implements OnDestroy, OnInit {

  @ViewChild('popoverElement') popoverElement: ElementRef;
  @ViewChild('popover') popover: PopoverDirective;

  protected popoverContainer: HTMLElement;
  protected popoverFocusOrigin: FocusOrigin;
  protected subs: Subject<void> = new Subject<void>();

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone) {
  }

  ngOnInit() {
    this.focusMonitor.monitor(this.popoverElement.nativeElement)
      .subscribe(origin => this.ngZone.run(() => {
        if (origin === 'keyboard' && this.popover) {
          if (this.popover.isOpen)
            this.delayFocusFirstItemOfPopoverContainer(origin);
          else {
            this.popoverFocusOrigin = origin;
            this.popover.show();
          }
        }
      }));
    this.popover.onShown.takeUntil(this.subs)
      .subscribe(data => {
        this.monitorPopoverContainer(this.popoverFocusOrigin);
        this.popoverFocusOrigin = undefined;
      });
    this.popover.onHidden.takeUntil(this.subs)
      .subscribe(data => {
        this.stopMonitoringPopoverContainer();
        this.focusElement(this.popoverElement.nativeElement, 'mouse');
      });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.popoverElement.nativeElement);
    this.stopMonitoringPopoverContainer();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.keyCode === ESCAPE && this.popover) {
      this.popover.hide();
      event.stopPropagation();
    }
  }


  protected setPopoverContainerCellsFocusable(): void {
    let me = this, container = me.popoverContainer,
      cells = jQuery(container).find('div');
    if (cells && cells.length > 0) {
      cells.attr('tabindex', '0');
      cells.off('keyup').keyup(function (event) {
        let target = event ? event.target : null;
        if (event) {
          if (event.keyCode === ESCAPE && me.popover)
            me.popover.hide();
          else if (event.keyCode === ENTER && target) {
            // Invoke click to select the cell.
            me.invokePopoverCellClick(target);
          }
        }
      });
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokePopoverCellClick(cell: HTMLElement) {
    if (cell && this.renderer)
      this.invokeElementMethod(cell, 'click');
  }

  private monitorPopoverContainer(focusOrigin: FocusOrigin): void {
    let container = this.getPopoverContainer();
    if (container) {
      this.popoverContainer = container;
      this.onEscQuitPopoverContainer();
      this.delaySetPopoverContainerCellsFocusable();
      this.delayFocusFirstItemOfPopoverContainer(focusOrigin);
      this.focusMonitor.monitor(this.popoverContainer, true);
    }
  }

  private stopMonitoringPopoverContainer(): void {
    if (this.popoverContainer) {
      this.focusMonitor.stopMonitoring(this.popoverContainer);
      this.popoverContainer = null;
    }
  }

  private onEscQuitPopoverContainer(): void {
    let me = this, container = me.popoverContainer;
    jQuery(container).off('keydown').keydown(function (event) {
      let target = event ? event.target : null;
      if (event) {
        if ((event.keyCode === ESCAPE || event.keyCode === TAB && !event.shiftKey &&
            target === me.getLastItemChild(container) || event.keyCode === TAB && event.shiftKey &&
            target === me.getFirstItemChild(container)) && me.popover) {
          me.popover.hide();
        }
      }
    });
  }

  private getPopoverContainer(): HTMLElement {
    let els = jQuery('body > popover-container > div.popover-body');
    return els && els.length ? els[0] : null;
  }

  private getFirstItemChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('div');
    return els && els.length ? els[0] : null;
  }

  private getLastItemChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('div');
    return els && els.length ? els[els.length - 1] : null;
  }

  private delaySetPopoverContainerCellsFocusable(): void {
    setTimeout(() => {
      this.setPopoverContainerCellsFocusable();
    }, 500);
  }

  private delayFocusFirstItemOfPopoverContainer(origin?: FocusOrigin): void {
    setTimeout(() => {
      let firstItem = this.getFirstItemChild(this.popoverContainer);
      if (firstItem)
        this.focusMonitor.focusVia(firstItem, origin || 'mouse');
    }, 500);
  }

  private focusElement(el: HTMLElement, origin: FocusOrigin): void {
    if (el)
      this.focusMonitor.focusVia(el, origin);
  }
}


