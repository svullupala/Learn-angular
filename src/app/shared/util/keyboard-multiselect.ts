import {
  Directive,
  ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Renderer2
} from '@angular/core';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Subject} from 'rxjs/Subject';
import {ENTER, ESCAPE} from '@angular/cdk/keycodes';
import {AngularMultiSelect} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {applyMixins} from 'rxjs/util/applyMixins';

export class FixedAngularMultiSelect {

  activeChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  public isActive: boolean = false;
  public settings: { maxHeight: number };

  toggleDropdown(evt?: any) {
    this.isActive = !this.isActive;
    evt.preventDefault();
    this.activeChange.emit(this.isActive);
  }

  closeDropdown() {
    this.isActive = false;
    this.activeChange.emit(this.isActive);
  }
}

@Directive({
  selector: '[keyboardMultiselect]'
})
export class KeyboardMultiselect implements OnDestroy, OnInit {

  @Input() multiselect: FixedAngularMultiSelect | any;

  protected selectorContainer: HTMLElement;
  protected selectorFocusOrigin: FocusOrigin;
  protected selectorCellClicked: boolean = false;
  protected subs: Subject<void> = new Subject<void>();

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              protected element: ElementRef) {
  }

  ngOnInit() {
    this.focusMonitor.monitor(this.element.nativeElement)
      .subscribe(origin => this.ngZone.run(() => {
        if (origin === 'keyboard' && this.multiselect) {
          if (this.multiselect.isActive)
            this.delayFocusFirstItemOfSelectorContainer(origin);
          else {
            this.selectorFocusOrigin = origin;
            this.multiselect.toggleDropdown(null);
          }
        }
      }));
    this.multiselect.activeChange = new EventEmitter<boolean>();
    this.multiselect.activeChange.takeUntil(this.subs)
      .subscribe(isActive => {
        if (isActive) {
          this.monitorSelectorContainer(this.selectorFocusOrigin);
          this.selectorFocusOrigin = undefined;
        } else {
          this.stopMonitoringSelectorContainer();
        }
      });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.element.nativeElement);
    this.stopMonitoringSelectorContainer();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.keyCode === ESCAPE && this.multiselect) {
      this.multiselect.closeDropdown();
      event.stopPropagation();
    }
  }


  protected setSelectorContainerCellsFocusable(): void {
    let me = this;

    me.setCellsFocusable('.selected-list > button > .c-list > .c-token > span.fa-remove', '0',
      true);

    me.setCellsFocusable('.dropdown-list li.pure-checkbox', '0', true, true);

    me.setCellsFocusable('.dropdown-list li.pure-checkbox input[type="checkbox"]', '-1');

  }

  private setCellsFocusable(subSelector: string, tabindexValue: string,
                            handleKeyup?: boolean,
                            refocusFirstItem?: boolean): void {
    let me = this, container = me.selectorContainer,
      cells = jQuery(container).find(subSelector);
    if (cells && cells.length > 0) {
      cells.attr('tabindex', tabindexValue);
      if (handleKeyup) {
        cells.off('keyup').keyup(function (event) {
          let target = event ? event.target : null;
          if (event) {
            if (event.keyCode === ESCAPE && me.multiselect)
              me.multiselect.closeDropdown();
            else if (event.keyCode === ENTER && target) {
              // Invoke click to select the cell.
              me.invokeSelectorCellClick(target);
              if (refocusFirstItem)
                me.selectorCellClicked = true;
            }
          }
        });
      }
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokeSelectorCellClick(cell: HTMLElement) {
    if (cell && this.renderer)
      this.invokeElementMethod(cell, 'click');
  }

  private monitorSelectorContainer(focusOrigin: FocusOrigin): void {
    let container = this.getSelectorContainer();
    if (container) {
      this.selectorContainer = container;
      this.onEscQuitSelectorContainer();
      this.delaySetSelectorContainerCellsFocusable();
      this.delayFocusFirstItemOfSelectorContainer(focusOrigin);
      this.focusMonitor.monitor(this.selectorContainer, true)
        .subscribe(origin => this.ngZone.run(() => {
          if (!origin) {
            this.delaySetSelectorContainerCellsFocusable();
            if (this.selectorCellClicked) {
              this.selectorCellClicked = false;
              this.delayFocusFirstItemOfSelectorContainer('keyboard');
            }
          }
        }));
    }
  }

  private stopMonitoringSelectorContainer(): void {
    if (this.selectorContainer) {
      this.focusMonitor.stopMonitoring(this.selectorContainer);
      this.selectorContainer = null;
    }
  }

  private onEscQuitSelectorContainer(): void {
    let me = this, container = me.selectorContainer;
    jQuery(container).off('keydown').keydown(function (event) {
      if (event && event.keyCode === ESCAPE && me.multiselect)
        me.multiselect.closeDropdown();
    });
  }

  private getSelectorContainer(): HTMLElement {
    let els = jQuery(this.element.nativeElement).find('angular2-multiselect > .cuppa-dropdown');
    return els && els.length ? els[0] : null;
  }

  private getFirstItemChild(container: HTMLElement): HTMLElement {
    let els = jQuery(container).find('.dropdown-list li.pure-checkbox');
    return els && els.length ? els[0] : null;
  }

  private delaySetSelectorContainerCellsFocusable(): void {
    setTimeout(() => {
      this.setSelectorContainerCellsFocusable();
    }, 500);
  }

  private delayFocusFirstItemOfSelectorContainer(origin?: FocusOrigin): void {
    setTimeout(() => {
      let firstItem = this.getFirstItemChild(this.selectorContainer);
      if (firstItem)
        this.focusMonitor.focusVia(firstItem, origin || 'mouse');
    }, 500);
  }
}

applyMixins(AngularMultiSelect, [FixedAngularMultiSelect]);
