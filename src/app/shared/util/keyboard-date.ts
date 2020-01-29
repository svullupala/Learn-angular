import {
  ElementRef, HostListener, NgZone, OnDestroy, OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import {BsDatepickerDirective} from 'ngx-bootstrap/datepicker';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Subject} from 'rxjs/Subject';
import {ENTER, ESCAPE, TAB} from '@angular/cdk/keycodes';

const isEdgeBrowser = () => (/edge/).test(navigator.userAgent.toLowerCase());
const isFirefoxBrowser = () => (/firefox/).test(navigator.userAgent.toLowerCase());

export class KeyboardDate implements OnDestroy, OnInit {

  @ViewChild('dpElement') dpElement: ElementRef;
  @ViewChild('dp') dp: BsDatepickerDirective;

  protected dpContainer: HTMLElement;
  protected dpFocusOrigin: FocusOrigin;
  protected dpCellClicked: boolean = false;

  protected subs: Subject<void> = new Subject<void>();

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone) {
  }

  ngOnInit() {
    this.focusMonitor.monitor(this.dpElement.nativeElement)
      .subscribe(origin => this.ngZone.run(() => {
        if (origin === 'keyboard' && this.dp) {
          if (this.dp.isOpen)
            this.delayFocusFirstButtonOfDpContainer(origin);
          else {
            this.dpFocusOrigin = origin;
            this.dp.show();
          }
        }
      }));
    this.dp.onShown.takeUntil(this.subs)
      .subscribe(data => {
        this.monitorDpContainer(this.dpFocusOrigin);
        this.dpFocusOrigin = undefined;
      });
    this.dp.onHidden.takeUntil(this.subs)
      .subscribe(data => {
        this.stopMonitoringDpContainer();
        this.focusElement(this.dpElement.nativeElement, 'mouse');
      });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.dpElement.nativeElement);
    this.stopMonitoringDpContainer();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.keyCode === ESCAPE && this.dp) {
      this.dp.hide();
      event.stopPropagation();
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokeDpCellClick(cell: HTMLElement) {
    if (cell && this.renderer)
      this.invokeElementMethod(cell, 'click');
  }

  private monitorDpContainer(focusOrigin: FocusOrigin): void {
    let container = this.getDpContainer();
    if (container) {
      this.dpContainer = container;
      this.onEscQuitDpContainer();
      this.delaySetDpContainerCellsFocusable();
      this.delayFocusFirstButtonOfDpContainer(focusOrigin);
      this.focusMonitor.monitor(this.dpContainer, true)
        .subscribe(origin => this.ngZone.run(() => {
          let nonChrome = isEdgeBrowser() || isFirefoxBrowser();
          // Edge & Firefox browsers have different behaviour with Chrome browser.
          if (nonChrome)
            this.delaySetDpContainerCellsFocusable();
          if (!origin) {
            if (!nonChrome)
              this.delaySetDpContainerCellsFocusable();
            if (this.dpCellClicked) {
              this.dpCellClicked = false;
              this.delayFocusFirstButtonOfDpContainer('keyboard');
            }
          }
        }));
    }
  }

  private stopMonitoringDpContainer(): void {
    if (this.dpContainer) {
      this.focusMonitor.stopMonitoring(this.dpContainer);
      this.dpContainer = null;
    }
  }

  private onEscQuitDpContainer(): void {
    let me = this, container = me.dpContainer;
    jQuery(container).off('keydown').keydown(function (event) {
      let target = event ? event.target : null;
      if (event) {
        if ((event.keyCode === ESCAPE || event.keyCode === TAB && !event.shiftKey &&
          target === me.getLastCellChild(container)) && me.dp) {
          me.dp.hide();
        } else if (event.keyCode === ENTER && target) {
          me.dpCellClicked = true;
        }
      }
    });
  }

  private delaySetDpContainerCellsFocusable(): void {
    setTimeout(() => {
      this.setDpContainerCellsFocusable();
    },  500);
  }

  private setDpContainerCellsFocusable(): void {
    let me = this, container = me.dpContainer,
      cells = jQuery(container)
        .find('table > tbody > tr > td:not(.disabled) > span:not(.is-other-month):not(.disabled)');
    if (cells && cells.length > 0) {
      cells.attr('tabindex', '0');
      cells.off('keyup').keyup(function (event) {
        let target = event ? event.target : null;
        if (event) {
          if (event.keyCode === ESCAPE && me.dp)
            me.dp.hide();
          else if (event.keyCode === ENTER && target) {
            // Invoke click to select the cell.
            me.invokeDpCellClick(target);
            me.dpCellClicked = true;
          }
        }
      });
    }
  }

  private getDpContainer(): HTMLElement {
    let els = jQuery('body > bs-datepicker-container > div.bs-datepicker > div.bs-datepicker-container');
    return els && els.length ? els[0] : null;
  }

  private getFirstButtonChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('button:not([disabled])');
    return els && els.length ? els[0] : null;
  }

  private getLastCellChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container)
      .find('table > tbody > tr > td:not(.disabled) > span:not(.is-other-month):not(.disabled)');
    return els && els.length ? els[els.length - 1] : null;
  }

  private delayFocusFirstButtonOfDpContainer(origin?: FocusOrigin): void {
    let me = this;
    setTimeout(() => {
      let firstButton = me.getFirstButtonChild(me.dpContainer);
      if (firstButton)
        me.focusMonitor.focusVia(firstButton, origin || 'mouse');
    }, 500);
  }

  private focusElement(el: HTMLElement, origin: FocusOrigin): void {
    if (el)
      this.focusMonitor.focusVia(el, origin);
  }
}


