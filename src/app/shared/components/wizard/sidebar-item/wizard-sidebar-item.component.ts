import {
  Component, EventEmitter, Input, Output, TemplateRef, ViewChild
} from '@angular/core';
import {WizardPageEntry, WizardTheme} from 'shared/components/wizard/wizard-registry';
import {SummaryEntry} from 'shared/components/wizard/wizard-page';


export type WizardSidebarItem = {
  title: string;
  page?: WizardPageEntry;
  done?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  prev?: WizardSidebarItem;
  next?: WizardSidebarItem;
  sortableKey?: number;
  summaryTitle?: string;
};

@Component({
  selector: 'wizard-sidebar-item',
  templateUrl: './wizard-sidebar-item.component.html',
  styleUrls: ['./wizard-sidebar-item.component.scss']
})
export class WizardSidebarItemComponent {
  @Input() model: WizardSidebarItem;
  @Input() selectableIfDone: boolean = false;
  @Input() theme: WizardTheme = 'standard';
  @Output() selectEvent: EventEmitter<WizardSidebarItem> = new EventEmitter<WizardSidebarItem>();

  @ViewChild('grpSummary', {read: TemplateRef})
  private _groupSummary: TemplateRef<any>;

  get optional(): boolean {
    return this.model.page && this.model.page.optional;
  }

  get hlInvisible(): boolean {
    return !this.model.page || !this.model.page.group;
  }

  get hasULink(): boolean {
    return !!this.model.prev;
  }

  get hasDLink(): boolean {
    return !!this.model.next;
  }

  get dlDisabled(): boolean {
    return this.hasDLink && this.model.next.disabled;
  }

  get hasPrev(): boolean {
    return !!this.model.prev;
  }

  get hasPrevSubtitle(): boolean {
    return this.model.prev && this.model.prev.page && this.model.prev.page.optional;
  }

  get hasPrevPageDone(): boolean {
    return this.model.prev && this.model.prev.page && this.model.prev.done;
  }

  get hasPrevPrevPageDone(): boolean {
    return this.model.prev && this.model.prev.prev &&
      this.model.prev.prev.page && this.model.prev.prev.done;
  }

  get hasPrevFirstGroup(): boolean {
    return this.model.prev && !this.model.prev.page && !this.model.prev.prev;
  }

  get isFirst(): boolean {
    return !this.hasPrev || this.hasPrevFirstGroup;
  }

  get isGroupWithCursor(): boolean {
    let result = false,
      group = !this.model.page,
      title: string,
      next: WizardSidebarItem;
    if (group) {
      title = this.model.title;
      next = this.model.next;
      while (next && next.page && next.page.group === title) {
        if (!next.disabled && !next.done) {
          result = true;
          break;
        }
        next = next.next;
      }
    }
    return result;
  }

  get isPageWithCursor(): boolean {
    return this.model.page && !this.model.disabled && !this.model.done;
  }

  get hasCursor(): boolean {
    return this.isPageWithCursor || this.isGroupWithCursor;
  }

  get groupSummary(): SummaryEntry {
    return {content: this._groupSummary};
  }

  get pageSummary(): SummaryEntry {
    return this.model.page.instance ? this.model.page.instance.summary : null;
  }

  get summary(): string | TemplateRef<any> {
    let summary = this.model.page ? this.pageSummary : this.groupSummary;
    return summary ? summary.content : '';
  }

  get summaryEntries(): SummaryEntry[] {
    let result: SummaryEntry[] = [],
      group = !this.model.page,
      title: string,
      next: WizardSidebarItem;
    if (group) {
      title = this.model.title;
      next = this.model.next;
      while (next && next.page && next.page.group === title) {
        if (next.page.instance && !next.disabled && !next.hidden) {
          result.push(next.page.instance.summary);
        }
        next = next.next;
      }
    }
    return result;
  }

  /**
   * Gets padding max style.
   * @deprecated
   * @return {boolean}
   */
  get paddingMax(): boolean {
    let hasPrev = this.hasPrev;
    return hasPrev && (!this.model.prev.page && !!this.model.page || this.model.prev.page && (!this.model.page ||
      this.model.page.group !== this.model.prev.page.group) ||
      this.model.prev.page && this.model.page && !this.model.page.group && !this.model.prev.page.group);
  }

  /**
   * Gets selectable status.
   *
   * @return {boolean}
   */
  get canSelect(): boolean {
    return this.selectableIfDone && !this.model.disabled
      && !!this.model.page && this.model.done;
  }

  /**
   * Invokes once this item is selected.
   *
   */
  onItemSelect(): void {
    this.selectEvent.emit(this.model);
  }
}
