import {
  Component, EventEmitter, Input, Output, QueryList, ViewChildren
} from '@angular/core';
import {SummaryEntry} from 'app/shared/components/wizard/wizard-page';
import {
  WizardSidebarItem, WizardSidebarItemComponent
} from 'app/shared/components/wizard/sidebar-item/wizard-sidebar-item.component';
import {WizardTheme} from 'shared/components/wizard/wizard-registry';

@Component({
  selector: 'wizard-sidebar',
  templateUrl: './wizard-sidebar.component.html',
  styleUrls: ['./wizard-sidebar.component.scss']
})
export class WizardSidebarComponent {
  @Input() theme: WizardTheme = 'standard';
  @Input() items: WizardSidebarItem[];
  @Input() doneItemSelectable: boolean = false;
  @Input() summaryTitle: string;
  @Output() itemSelectEvent: EventEmitter<WizardSidebarItem> = new EventEmitter<WizardSidebarItem>();

  @ViewChildren(WizardSidebarItemComponent) sbItems: QueryList<WizardSidebarItemComponent>;

  get summaryEntries(): SummaryEntry[] {
    let result: SummaryEntry[] = [], index = 0;
    if (this.sbItems && this.sbItems.length > 0) {
      this.sbItems.forEach(function (item, idx) {
        let model = item.model,
          group = !model.page,
          addGroupSummary = false,
          title: string,
          next: WizardSidebarItem;

        if (idx >= index) {
          index++;
          if (group) {
            title = model.title;
            next = model.next;
            while (next && next.page && next.page.group === title) {
              if (next.page.instance && !next.disabled && !addGroupSummary)
                addGroupSummary = true;
              next = next.next;
              index++;
            }
            if (addGroupSummary)
              result.push({content: item.summary});
          } else {
            if (model.page.instance && !model.disabled)
              result.push(model.page.instance.summary);
          }
        }
      });
    }
    return result;
  }

  onItemSelect(item: WizardSidebarItem): void {
    this.itemSelectEvent.emit(item);
  }
}
