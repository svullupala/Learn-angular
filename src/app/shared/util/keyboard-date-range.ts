import {
  ElementRef, HostListener, NgZone, OnDestroy, OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import {BsDaterangepickerDirective} from 'ngx-bootstrap/datepicker';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Subject} from 'rxjs/Subject';
import {ENTER, ESCAPE, TAB} from '@angular/cdk/keycodes';

const isEdgeBrowser = () => (/edge/).test(navigator.userAgent.toLowerCase());
const isFirefoxBrowser = () => (/firefox/).test(navigator.userAgent.toLowerCase());

export class KeyboardDateRange implements OnDestroy, OnInit {

  @ViewChild('drpElement') drpElement: ElementRef;
  @ViewChild('drp') drp: BsDaterangepickerDirective;

  protected drpContainer: HTMLElement;
  protected drpFocusOrigin: FocusOrigin;
  protected drpCellClicked: boolean = false;

  protected subs: Subject<void> = new Subject<void>();

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone) {
  }

  ngOnInit() {
    this.focusMonitor.monitor(this.drpElement.nativeElement)
      .subscribe(origin => this.ngZone.run(() => {
        if (origin === 'keyboard' && this.drp) {
          if (this.drp.isOpen)
            this.delayFocusFirstButtonOfDrpContainer(origin);
          else {
            this.drpFocusOrigin = origin;
            this.drp.show();
          }
        }
      }));
    this.drp.onShown.takeUntil(this.subs)
      .subscribe(data => {
        this.monitorDrpContainer(this.drpFocusOrigin);
        this.drpFocusOrigin = undefined;
      });
    this.drp.onHidden.takeUntil(this.subs)
      .subscribe(data => {
        this.stopMonitoringDrpContainer();
        this.focusElement(this.drpElement.nativeElement, 'mouse');
      });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.drpElement.nativeElement);
    this.stopMonitoringDrpContainer();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.keyCode === ESCAPE && this.drp) {
      this.drp.hide();
      event.stopPropagation();
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokeDrpCellClick(cell: HTMLElement) {
    if (cell && this.renderer)
      this.invokeElementMethod(cell, 'click');
  }

  private monitorDrpContainer(focusOrigin: FocusOrigin): void {
    let container = this.getDrpContainer();
    if (container) {
      this.drpContainer = container;
      this.onEscQuitDrpContainer();
      this.delaySetDrpContainerCellsFocusable();
      this.delayFocusFirstButtonOfDrpContainer(focusOrigin);
      this.focusMonitor.monitor(this.drpContainer, true)
        .subscribe(origin => this.ngZone.run(() => {
          let nonChrome = isEdgeBrowser() || isFirefoxBrowser();
          // Edge & Firefox browsers have different behaviour with Chrome browser.
          if (nonChrome)
            this.delaySetDrpContainerCellsFocusable();
          if (!origin) {
            if (!nonChrome)
              this.delaySetDrpContainerCellsFocusable();
            if (this.drpCellClicked) {
              this.drpCellClicked = false;
              this.delayFocusFirstButtonOfDrpContainer('keyboard');
            }
          }
        }));
    }
  }

  private stopMonitoringDrpContainer(): void {
    if (this.drpContainer) {
      this.focusMonitor.stopMonitoring(this.drpContainer);
      this.drpContainer = null;
    }
  }

  private onEscQuitDrpContainer(): void {
    let me = this, container = me.drpContainer;
    jQuery(container).off('keydown').keydown(function (event) {
      let target = event ? event.target : null;
      if (event) {
        if ((event.keyCode === ESCAPE || event.keyCode === TAB && !event.shiftKey &&
          target === me.getLastCellChild(container)) && me.drp) {
          me.drp.hide();
        } else if (event.keyCode === ENTER && target) {
          me.drpCellClicked = true;
        }
      }
    });
  }

  private delaySetDrpContainerCellsFocusable(): void {
    setTimeout(() => {
      this.setDrpContainerCellsFocusable();
    },  500);
  }

  private setDrpContainerCellsFocusable(): void {
    let me = this, container = me.drpContainer,
      cells = jQuery(container).find('table > tbody > tr > td > span:not(.is-other-month)');
    if (cells && cells.length > 0) {
      cells.attr('tabindex', '0');
      cells.off('keyup').keyup(function (event) {
        let target = event ? event.target : null;
        if (event) {
          if (event.keyCode === ESCAPE && me.drp)
            me.drp.hide();
          else if (event.keyCode === ENTER && target) {
            // Invoke click to select the cell.
            me.invokeDrpCellClick(target);
            me.drpCellClicked = true;
          }
        }
      });
    }
  }

  private getDrpContainer(): HTMLElement {
    let els = jQuery('body > bs-daterangepicker-container > div.bs-datepicker > div.bs-datepicker-container');
    return els && els.length ? els[0] : null;
  }

  private getFirstButtonChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('button');
    return els && els.length ? els[0] : null;
  }

  private getLastCellChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('table > tbody > tr > td > span:not(.is-other-month)');
    return els && els.length ? els[els.length - 1] : null;
  }

  private delayFocusFirstButtonOfDrpContainer(origin?: FocusOrigin): void {
    let me = this;
    setTimeout(() => {
      let firstButton = me.getFirstButtonChild(me.drpContainer);
      if (firstButton)
        me.focusMonitor.focusVia(firstButton, origin || 'mouse');
    }, 500);
  }

  private focusElement(el: HTMLElement, origin: FocusOrigin): void {
    if (el)
      this.focusMonitor.focusVia(el, origin);
  }
}


