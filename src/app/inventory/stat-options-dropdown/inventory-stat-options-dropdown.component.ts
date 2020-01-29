import {
  Component, OnInit, OnDestroy, Output, Input, EventEmitter, ElementRef
} from '@angular/core';
import {BsDropdownDirective} from 'ngx-bootstrap';
import {InventoryStatOptionCategoriesModel} from '../inventory.model';
import {NvPairModel} from 'shared/models/nvpair.model';

@Component({
  selector: 'inventory-stat-options-dropdown',
  styleUrls: ['./inventory-stat-options-dropdown.component.scss'],
  templateUrl: './inventory-stat-options-dropdown.component.html'
})

export class InventoryStatOptionsDropdownComponent implements OnInit, OnDestroy {
  @Input() options: InventoryStatOptionCategoriesModel[] = [];
  @Input() menuWidth: string;

  @Output() cancel = new EventEmitter();
  @Output() apply = new EventEmitter<InventoryStatOptionCategoriesModel[]>();

  constructor(private element: ElementRef) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  focusElement(el: HTMLElement): void {
    setTimeout(() => {
      if (el) {
        el.focus();
      }
    }, 500);
  }

  focusContainer(): void {
    let container = this.getDropdownContainer();
    if (container)
      this.focusElement(container);
  }

  onHidden(dropdownComponent: BsDropdownDirective, el: HTMLElement): void {
    this.onApply(dropdownComponent);
    this.focusElement(el);
  }

  onClickOutside(event: MouseEvent, dropdownComponent: BsDropdownDirective): void {
    let targetElement = event.target as Element, container = this.getDropdownContainer();
    if (!targetElement || !container)
      return;

    const clickedInside = container.contains(targetElement);
    if (clickedInside)
      return;

    if (dropdownComponent.isOpen)
      dropdownComponent.hide();
  }

  private onApply(dropdownComponent: BsDropdownDirective): void {
    if (dropdownComponent)
      dropdownComponent.hide();
    this.apply.emit(this.options);
  }

  private onSelectChange(option: InventoryStatOptionCategoriesModel, category: NvPairModel): void {
    let me = this, target = (me.options || []).find(function (item) {
      return item.header.value === option.header.value;
    });
    if (target) {
      target.selection = (target.categories || []).find(function (item) {
        return item.value === category.value;
      });
    }
  }

  private isSelected(option: InventoryStatOptionCategoriesModel, category: NvPairModel): boolean {
    return (this.options || []).findIndex(function (item) {
      return item.header.value === option.header.value && item.selection && item.selection.value === category.value;
    }) !== -1;
  }

  private getDropdownContainer(): HTMLElement {
    let els = jQuery(this.element.nativeElement).find('.dropdown > .dropdown-menu');
    return els && els.length ? els[0] : null;
  }

  private hasTooltip(option: InventoryStatOptionCategoriesModel): boolean {
    return !!option.tooltip;
  }
}
