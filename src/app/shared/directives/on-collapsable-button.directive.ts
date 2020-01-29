import {
  Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnDestroy, OnInit, Output,
  Renderer2
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import {ENTER} from '@angular/cdk/keycodes';

@Directive({
  selector: 'button[onCollapsableButtonDirective], i[onCollapsableButtonDirective]'
})

/*
    Usage
 *   <button type="button"
          onCollapsableButtonDirective
          [collapsableElementRef]="yourElementRef"
          [collapsableSubject]="yourSubject"
          >
     </button>

 * Purpose is to manipulate the passed in element DOM using the button and switch classes on the button element itself.
 * @Property collapsableElementRef: Optional: Useful to pass it in to the directive in order to hide and show it.
 * @property collapsableSubject: Optional: Userful to handle a use case wherethe user does not explicitly click on the button. Ex: edit mode.
 * @property useArrow: Optional: Instead of using a plus/minus symbol, we can use the arrow symbol. True or false value.
 * @property ...class: Optional: Allows more customization by providing different classes but achieves the same end goal.
 */

export class OnCollapsableButtonDirective implements OnInit, OnDestroy {
  @Output() clickEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() onShowClickEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() onHideClickEvent: EventEmitter<any> = new EventEmitter<any>();
  @Input() collapsableElementRef: ElementRef;
  @Input() collapsableSubject: Subject<boolean>;
  @Input() useArrow: boolean = false;
  @Input() arrowRightClass: string = 'btn btn-primary btn-xs ion-chevron-right';
  @Input() arrowDownClass: string = 'btn btn-primary btn-xs ion-chevron-down';
  @Input() buttonPlusClass: string = 'btn btn-primary btn-xs ion-plus';
  @Input() buttonMinusClass: string = 'btn btn-primary btn-xs ion-minus';
  @Input() collapsbleClass: string = 'collapse';
  @Input() collapseInClass: string = 'in';

  @HostBinding('class') buttonClass;

  private onButtonClickFlag: boolean = false;
  private subs: Subject<void> = new Subject<void>();

  @HostListener('click') onButtonClick() {
    this.onToggleButtonClass();
    if (this.collapsableElementRef) {
      this.onCollapseElement();
    }
    this.clickEvent.emit();
  }

  @HostListener('keydown', ['$event'])
  onButtonKeydown(event: KeyboardEvent) {
    let target: any = event.srcElement ? event.srcElement : event.target;
    if (target && event.keyCode === ENTER) {
      this.invokeClick(target);
    }
  }

  private get hasCollapseInClass(): boolean {
    return this.collapsableElementRef && this.collapsableElementRef.nativeElement
      && this.collapsableElementRef.nativeElement.classList.contains(this.collapseInClass);
  }

  constructor(private renderer: Renderer2, private btn: ElementRef) {}

  ngOnInit() {
    this.buttonClass = this.useArrow ? this.arrowRightClass : this.buttonPlusClass;
    if (this.collapsableElementRef) {
      if (!(this.collapsableElementRef instanceof ElementRef)) {
        this.collapsableElementRef = new ElementRef(this.collapsableElementRef);
      }
      this.renderer.addClass(this.collapsableElementRef.nativeElement, this.collapsbleClass);
    }
    if (this.collapsableSubject) {
      this.collapsableSubject.takeUntil(this.subs).
      subscribe((collapse: boolean) => this.collapseSubjectCallback(collapse));
    }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private onToggleButtonClass(collapse?: boolean): void {
    let force = collapse !== undefined;
    this.onButtonClickFlag = force ? !collapse : !this.onButtonClickFlag;

    if (this.useArrow) {
      this.onButtonClickFlag
        ? (this.buttonClass = this.arrowDownClass)
        : (this.buttonClass = this.arrowRightClass);
    } else {
      this.onButtonClickFlag
        ? (this.buttonClass = this.buttonMinusClass)
        : (this.buttonClass = this.buttonPlusClass);
    }
    if (this.onButtonClickFlag) {
      this.onShowClickEvent.emit();
    } else {
      this.onHideClickEvent.emit();
    }
  }

  private onCollapseElement(): void {
    if (this.hasCollapseInClass) {
      this.renderer.removeClass(this.collapsableElementRef.nativeElement, this.collapseInClass);
    } else {
      this.renderer.addClass(this.collapsableElementRef.nativeElement, this.collapseInClass);
    }
  }

  private collapseSubjectCallback(collapse: boolean = false): void {
    if (collapse) {
      this.renderer.removeClass(this.collapsableElementRef.nativeElement, this.collapseInClass);
      this.onToggleButtonClass(collapse);
    } else {
      if (!this.hasCollapseInClass) {
        this.renderer.addClass(this.collapsableElementRef.nativeElement, this.collapseInClass);
        this.onToggleButtonClass(collapse);
      }
    }
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokeClick(cell: HTMLElement) {
    if (cell && this.renderer)
      this.invokeElementMethod(cell, 'click');
  }
}
