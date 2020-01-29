import {Component, Input} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {WizardModel} from 'shared/components/wizard/wizard.model';

@Component({
  selector: 'wizard-summary-page',
  templateUrl: './wizard-summary-page.component.html',
  styleUrls: ['./wizard-summary-page.component.scss']
})
export class WizardSummaryPageComponent extends WizardPage<WizardModel> {
  @Input() summaryEntries: SummaryEntry[];
  @Input() textDesc: string;
  @Input() model: WizardModel;

  get hasSummaryEntries(): boolean {
    return this.summaryEntries && this.summaryEntries.length > 0;
  }

  get prettyDetails(): string {
    return JSON.stringify(this.model.json(), null, '\t');
  }

  validate(silent: boolean): boolean {
    return true;
  }
}
