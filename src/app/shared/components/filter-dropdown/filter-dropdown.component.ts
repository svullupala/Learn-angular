import {
  Component, OnInit, OnDestroy, Output, Input, EventEmitter, AfterViewInit
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';
import { FilterCatagoriesModel, FilterCatagoryModel } from 'shared/components/filter-dropdown/filter-catagories.model';
import { selectorFactory, SelectorType } from 'shared/selector/selector.factory';
import { SelectorService } from 'shared/selector/selector.service';
import { BsDropdownDirective } from 'ngx-bootstrap';
import { FilterModel } from 'shared/models/filter.model';

@Component({
  selector: 'filter-dropdown',
  styleUrls: ['./filter-dropdown.component.scss'],
  templateUrl: './filter-dropdown.component.html',
  providers: [
    { provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType] },
    { provide: SelectorType, useValue: SelectorType.MULTIHIER }
  ]
})

export class FilterDropdownComponent implements OnInit, OnDestroy {
  @Input() filterCatagories: Array<FilterCatagoriesModel> = [];
  @Input() tooltipPlacement: string = 'right';

  @Output() onCancelEvent = new EventEmitter();
  @Output() onApplyEvent: EventEmitter<Array<object>> = new EventEmitter<Array<object>>();
  private subs: Subject<void> = new Subject<void>();
  private filterCategoryRef = []

  constructor(private translate: TranslateService, private selector: SelectorService<FilterCatagoryModel>) {
  }

  ngOnInit() {
    /*
       Init default selected filters
       TODO: Must fix. Weird workaround. In some cases input will not update
       when passed from the parent. Add a delay so it can update properly.
     */
    if (this.filterCatagories.length > 0) {
      this.traverseCatgories((catagory: FilterCatagoryModel) => {
        if (catagory.selected)
          this.selector.select(catagory);
      });
    } else {
      setTimeout(() => {
        this.traverseCatgories((catagory: FilterCatagoryModel) => {
          if (catagory.selected)
            this.selector.select(catagory);
        });
      }, 1000);
    }
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
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
    if (container) {
      this.focusElement(container);
      this.copyFilterCategoriesArray();
    }
  }

  copyFilterCategoriesArray() {
    for (let i = 0, len = this.filterCatagories[0].catagories.length; i < len; i++) {
      this.filterCategoryRef[i] = {};
      for (let prop in this.filterCatagories[0].catagories[i]) {
        this.filterCategoryRef[i][prop] = this.filterCatagories[0].catagories[i][prop];
      }
    }
  }

  public setValue(catagories: Set<string>): void {
    this.selector.deselectAll();
    this.traverseCatgories((catagory: FilterCatagoryModel) => {
      catagory.selected = false;
      if (catagories && catagories instanceof Set && catagories.has(catagory.value)) {
        catagory.selected = true;
        this.onSelectChange(catagory);
      }
    });
  }

  public getValue(dropdownComponent?: BsDropdownDirective): Array<FilterModel> {
    let filters: Array<FilterModel> = [];
    if (!this.isEmpty()) {
      this.selector.selection().forEach((catagory: FilterCatagoryModel) => {
        filters.push(catagory.getFilterModel());
      });
    }
    if (dropdownComponent)
      dropdownComponent.hide();
    return filters;
  }

  private onApply(dropdownComponent: BsDropdownDirective): void {
    let filters: Array<FilterModel> = this.getValue(dropdownComponent);
    this.onApplyEvent.emit(filters);
  }

  private onCancel(dropdownComponent: BsDropdownDirective): void {
    this.onCancelEvent.emit();
    if (dropdownComponent) {
      this.compareFiltersPreviousToCurrentSelection();
      dropdownComponent.hide();
    }
  }

  compareFiltersPreviousToCurrentSelection() {
    for (let i = 0, len = this.filterCatagories[0].catagories.length; i < len; i++) {
      if (this.filterCatagories[0].catagories[i].selected !== this.filterCategoryRef[i].selected) {
        this.filterCatagories[0].catagories[i].selected = this.filterCategoryRef[i].selected;
      }
    }
  }

  private onSelectAll(): void {
    this.traverseCatgories((catagory: FilterCatagoryModel) => {
      catagory.selected = true;
      this.onSelectChange(catagory);
    });
  }

  private onClearAll(): void {
    this.selector.deselectAll();
    this.traverseCatgories((catagory: FilterCatagoryModel) => {
      catagory.selected = false;
    });
  }

  private traverseCatgories(callback: Function): void {
    if (Array.isArray(this.filterCatagories) && this.filterCatagories.length > 0) {
      for (let i = 0; i < this.filterCatagories.length; i++) {
        if (Array.isArray(this.filterCatagories[i].catagories)
          && this.filterCatagories[i].catagories.length > 0 && !this.filterCatagories[i].hidden) {
          for (let j = 0; j < this.filterCatagories[i].catagories.length; j++) {
            if (typeof callback === 'function') {
              callback.call(this, this.filterCatagories[i].catagories[j]);
            }
          }
        }
      }
    }
  }

  private isEmpty(): boolean {
    return this.selector.count() === 0;
  }

  private onSelectChange(item: FilterCatagoryModel): void {
    let me = this;
    if (item.selected === true) {
      me.selector.select(item);
    } else {
      me.selector.deselect(item);
    }
  }

  private getDropdownContainer(): HTMLElement {
    let els = jQuery('body > bs-dropdown-container > .dropdown > .dropdown-menu');
    return els && els.length ? els[0] : null;
  }
}
