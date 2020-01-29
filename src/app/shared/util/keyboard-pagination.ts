import {
  Directive,
  ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, Renderer2
} from '@angular/core';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Subject} from 'rxjs/Subject';
import {ENTER, ESCAPE, TAB} from '@angular/cdk/keycodes';
import {PaginationControlsComponent} from 'ngx-pagination';

@Directive({
  selector: '[keyboardPagination]',
  exportAs: 'keyboard-pagination'
})
export class KeyboardPagination implements OnDestroy, OnInit {

  @Input() pagination: PaginationControlsComponent;
  @Input() prevFocusEl: HTMLElement;
  @Input() nextFocusEl: HTMLElement;

  protected paginationContainer: HTMLElement;
  protected paginationFocusOrigin: FocusOrigin;
  protected paginationCellClicked: boolean = false;
  protected subs: Subject<void> = new Subject<void>();
  private isActive: boolean = false;
  private quitFlag: boolean = false;

  get paginationVisible(): boolean {
    return !!this.getPaginationContainer();
  }

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              protected element: ElementRef) {
  }

  ngOnInit() {

    this.setMeFocusable();
    this.focusMonitor.monitor(this.element.nativeElement)
      .subscribe(origin => this.ngZone.run(() => {
        if (!this.paginationContainer)
          this.paginationContainer = this.getPaginationContainer();

        if (this.paginationContainer) {
          if (origin === 'keyboard' && this.pagination) {
            if (this.quitFlag)
              this.quitFlag = false;
            else {
              this.delaySetPaginationContainerCellsFocusable();
              if (this.isActive)
                this.delayFocusFirstItemOfPaginationContainer(origin);
              else {
                this.isActive = true;
                this.paginationFocusOrigin = origin;
                this.monitorPaginationContainer(this.paginationFocusOrigin);
              }
            }
          }
        }
      }));
    this.pagination.pageChange.takeUntil(this.subs)
      .subscribe(page => {
        this.delaySetPaginationContainerCellsFocusable();
      });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.element.nativeElement);
    this.stopMonitoringPaginationContainer();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  protected setPaginationContainerCellsFocusable(): void {
    let me = this;
    me.setCellsFocusable('li > a', '0', true);
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    let me = this, element: any = event.srcElement ? event.srcElement : event.target,
      container = me.paginationContainer;
    if (event.keyCode === ESCAPE) {
      event.stopPropagation();
      // try to quit focus.
      me.quitFlag = true;
      me.focusElement(me.nextFocusEl);
    } else if ((event.keyCode === 16 || event.keyCode === TAB && event.shiftKey) &&
      element === me.getFirstItemChild(container)) {
      event.stopPropagation();
      // try to quit focus.
      me.quitFlag = true;
      me.focusElement(me.prevFocusEl);
    }
  }

  private setCellsFocusable(subSelector: string, tabindexValue: string,
                            handleKeyup?: boolean,
                            refocusFirstItem?: boolean): void {
    let me = this, container = me.paginationContainer,
      cells = jQuery(container).find(subSelector);
    if (cells && cells.length > 0) {
      cells.attr('tabindex', tabindexValue);
      if (handleKeyup) {
        cells.off('keyup').keyup(function (event) {
          let target = event ? event.target : null;
          if (event) {
            if (event.keyCode === ESCAPE && me.pagination) {
              // QUIT focus?
            } else if (event.keyCode === ENTER && target) {
              // Invoke click to select the cell.
              me.invokePaginationCellClick(target);
              if (refocusFirstItem)
                me.paginationCellClicked = true;
            }
          }
        });
      }
    }
  }

  private setMeFocusable(): void {
    let me = this, container = me.element.nativeElement,
      el = jQuery(container);
    if (el && el.length > 0) {
      el.attr('tabindex', '0');
      el.addClass('focusable-pagination-host');
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokePaginationCellClick(cell: HTMLElement) {
    if (cell && this.renderer)
      this.invokeElementMethod(cell, 'click');
  }

  private monitorPaginationContainer(focusOrigin: FocusOrigin): void {
    this.delayFocusFirstItemOfPaginationContainer(focusOrigin);
    this.focusMonitor.monitor(this.paginationContainer, true)
      .subscribe(origin => this.ngZone.run(() => {
        if (!origin) {
          if (this.paginationCellClicked) {
            this.paginationCellClicked = false;
            this.delayFocusFirstItemOfPaginationContainer('keyboard');
          }
        }
      }));
  }

  private stopMonitoringPaginationContainer(): void {
    if (this.paginationContainer) {
      this.focusMonitor.stopMonitoring(this.paginationContainer);
      this.paginationContainer = null;
    }
  }

  private getPaginationContainer(): HTMLElement {
    let result = null, els;
    if (this.element && this.element.nativeElement) {
      els = jQuery(this.element.nativeElement).find('pagination-template > ul.ngx-pagination');
      result = els && els.length ? els[0] : null;
    }
    return result;
  }

  private getFirstItemChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('li > a');
    return els && els.length ? els[0] : null;
  }

  private delaySetPaginationContainerCellsFocusable(): void {
    setTimeout(() => {
      this.setPaginationContainerCellsFocusable();
    }, 500);
  }

  private delayFocusFirstItemOfPaginationContainer(origin?: FocusOrigin): void {
    setTimeout(() => {
      let firstItem = this.getFirstItemChild(this.paginationContainer);
      if (firstItem)
        this.focusMonitor.focusVia(firstItem, origin || 'mouse');
    }, 500);
  }

  private focusElement(el: HTMLElement): void {
    if (el)
      this.focusMonitor.focusVia(el, 'keyboard');
  }
}
