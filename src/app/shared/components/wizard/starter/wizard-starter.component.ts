import {
  Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {WizardAllowedCategory, WizardCategory} from 'shared/components/wizard/wizard-registry';

export type WizardStartEventParam = {
  category: WizardCategory;
  preventNextEvent?: boolean; // Set to true to prevent next event.
};

@Component({
  selector: 'wizard-starter',
  templateUrl: './wizard-starter.component.html',
  styleUrls: ['./wizard-starter.component.scss']
})
export class WizardStarterComponent implements OnInit, OnDestroy, OnChanges {

  @Input() categories: WizardCategory[];

  @Input() allowedCategories: WizardAllowedCategory[];

  /**
   * Fires before the start event occurs, the listener can prevent start event if necessary.
   * @type {EventEmitter<WizardStartEventParam>}
   */
  @Output() beforeStartEvent: EventEmitter<WizardStartEventParam> = new EventEmitter<WizardStartEventParam>();

  /**
   * Fires when the category is selected, the starter will start pages for the wizard.
   * @type {EventEmitter<WizardStartEventParam>}
   */
  @Output() startEvent: EventEmitter<WizardStartEventParam> = new EventEmitter<WizardStartEventParam>();


  protected subRef: Subject<void> = new Subject<void>();
  protected entries: WizardCategory[] = [];

  get hasAllowedCategory(): boolean {
    return this.allowedCategories && this.allowedCategories.length > 0;
  }

  ngOnInit(): void {
    let me = this;

    if (!me.categories || me.categories.length < 1) {
      console.error('[WizardStarter] categories property is required & should have one category at least.');
    }
    me.initEntries();
  }

  ngOnDestroy() {
    if (this.subRef)
      this.subRef.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['categories'] && !changes['categories'].isFirstChange()) {
      me.initEntries();
    }
  }

  addListener(event: EventEmitter<any>, fn: Function, single: boolean, scope?: any): void {
    let me = this, observable = event.takeUntil(me.subRef).subscribe((params) => {
      fn.call(scope || me, params);
      if (single)
        observable.unsubscribe();
    });
  }

  protected onCategorySelected(item: WizardCategory): void {
    let me = this, target: WizardCategory, payload: WizardStartEventParam, categories = me.categories;

    categories.forEach(function (category) {
      if (category.type === item.type && category.subType === item.subType) {
        category.selected = true;
        target = category;
      } else {
        category.selected = false;
      }
    });

    if (target) {
      payload = me.createStartEventParam(item);

      me.beforeStartEvent.emit(payload);

      if (!payload.preventNextEvent)
        me.startPages(payload);
    }
  }

  /**
   * Starts the pages of the given category wizard.
   *
   * @method startPages
   */
  protected startPages(payload: WizardStartEventParam) {
    this.startEvent.emit(payload);
  }

  protected initEntries(): void {
    let me = this, entries = [];
    (me.categories || []).forEach(function (category) {
      if (me.isAllowedCategory(category)) {
        if (entries.findIndex(function (entry) {
          return entry.type === category.type;
        }) === -1) {
          entries.push(category);
        }
      }
    });
    me.entries = entries;
  }

  private isAllowedCategory(category: WizardCategory): boolean {
    let me = this, hasAllowedCategory = me.hasAllowedCategory;
    if (!hasAllowedCategory)
      return true;

    return me.allowedCategories.findIndex(function (item) {
      return item.type === category.type && item.subType === category.subType;
    }) !== -1;
  }

  private createStartEventParam(item: WizardCategory): WizardStartEventParam {
    let me = this;
    return {
      category: item
    };
  }
}
