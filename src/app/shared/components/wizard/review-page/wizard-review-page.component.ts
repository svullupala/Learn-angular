import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {WizardModel} from 'shared/components/wizard/wizard.model';

@Component({
  selector: 'wizard-review-page',
  templateUrl: './wizard-review-page.component.html',
  styleUrls: ['./wizard-review-page.component.scss']
})
export class WizardReviewPageComponent extends WizardPage<WizardModel> {
  validate(silent: boolean): boolean {
    return true;
  }
}
