import {
  Component, OnInit, OnDestroy, Output, Input, EventEmitter, ViewChild,
  ElementRef
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs/Subject';

/**
* DropdownComponent
*     Inputs:
*       values: Array<Object> - array of objects to populate the dropdown
*       key: string - property of Object to use as a display name
*       value: any - currently selected object[key] or string label.
*       isDisabled: boolean - set to true to disabled.
*       placeholder: string - if no value, then this string will be displayed.
*             Defaults to 'Click to select'
*       noSelectPlaceholder: string - if values is empty, then this string will be displayed.
*             Defaults to 'Nothing to select'
*       noBorder: boolean - true to not show border
*     Outputs:
*       onSelect.  $event is Object selected.
*
* Example usage:
*                <dropdown
*                   [values]="offloadTypes"
*                   [key]="'name'"
*                   [value]="selectedOffloadType"
*                   (onSelect)="onSelectTypeClick($event)"
*                ></dropdown>
*
**/
@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit, OnDestroy {
  @Input() value: any;
  @Input() placeholder: string = undefined;
  @Input() noSelectPlaceholder: string = undefined;
  @Input() values: Array<Object>;
  @Input() key: string = 'name';
  @Input() isDisabled: boolean = false;
  @Input() scrollableHolder: Element;
  @Input() id: string;
  @Input() dropMenuRight: boolean = false;
  @Input() scrollableHolderMargin: number = 0;
  @Input() noBorder: boolean = false;

  @Output() onSelect = new EventEmitter();
  @ViewChild('menu') menu: ElementRef;

  private defaultPlaceholder: string = '';
  private nothingPlaceholder: string = '';
  private subs: Subject<void> = new Subject<void>();

  constructor(private translate: TranslateService, private elementRef: ElementRef) {
  }

  ngOnInit() {
    this.defaultPlaceholder = (this.placeholder) ? this.placeholder : this._getLabel('common.textClickToSelect');
    this.nothingPlaceholder = (this.noSelectPlaceholder) ? this.noSelectPlaceholder : this._getLabel('common.textNothingToSelect');
  }

  // @HostListener('window:scroll')
  onClick(): void {
    let me = this, element = jQuery(me.elementRef.nativeElement);
    element.off('shown.bs.dropdown').on('shown.bs.dropdown', function () {
      let menu = me.menu ? me.menu.nativeElement : null, holder = me.scrollableHolder;
      if (menu && holder) {
        if (me.isCompletelyVisible(menu, holder)) {
          me.elementRef.nativeElement.classList.remove('dropup');
          me.elementRef.nativeElement.classList.add('dropdown');
        } else if (me.isCompletelyVisible(menu, holder, true)) {
          me.elementRef.nativeElement.classList.remove('dropdown');
          me.elementRef.nativeElement.classList.add('dropup');
        } else {
          me.elementRef.nativeElement.classList.remove('dropup');
          me.elementRef.nativeElement.classList.add('dropdown');
        }
      }
    });

    element.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
      let menu = me.menu ? me.menu.nativeElement : null;
      if (menu) {
        me.elementRef.nativeElement.classList.remove('dropup');
        me.elementRef.nativeElement.classList.add('dropdown');
      }
    });
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  onSelectEvent(item: Object) {
    this.onSelect.emit(item);
  }

  get disabled(): boolean {
    return this.isDisabled;
  }

  get empty(): boolean {
    return (this.values === undefined || this.values.length === 0) ;
  }

  get current(): string {
    if ((typeof this.value) === 'string') {
      return this.value;
    } else if (this.value) {
      return this.value[this.key];
    } else if (this.empty) {
      return this.nothingPlaceholder;
    } else {
      return this.defaultPlaceholder;
    }

  }

  private _getLabel(key: string): string {
    let retVal: string = undefined;
    this.translate.get([key]).takeUntil(this.subs).subscribe((resource: Object) => {
             retVal = resource[key];
          });
    return retVal;
  }

  private isCompletelyVisible(el: Element, holder: Element, up?: boolean): boolean {
    let margin = up ? 0 : this.scrollableHolderMargin || 0,
      elBcr = el.getBoundingClientRect(),
      holderBcr = holder.getBoundingClientRect(),
      elemTop = elBcr.top,
      elemBottom = elBcr.bottom,
      holderTop = holderBcr.top,
      holderBottom = holderBcr.bottom,
      isVisible;

    isVisible = up ? (holderTop + margin <= elemTop - elBcr.height - 35) : (elemBottom <= holderBottom - margin);

    return isVisible;
  }
}
