import {Component} from '@angular/core';
import {WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {PolicyAssignmentsWizardModel} from '../policy-assignments-wizard.model';

@Component({
  selector: 'policy-assignments-review',
  templateUrl: './policy-assignments-review.component.html',
  styleUrls: ['./policy-assignments-review.component.scss']
})
export class PolicyAssignmentsReviewComponent extends WizardPage<PolicyAssignmentsWizardModel> {
  validate(silent: boolean): boolean {
    return true;
  }

  restProperties(): void {
    if (this.model.property2 === '333')
      this.model.property3 = '888';
  }

  onActive(param: WizardPageEventParam): void {
    this.restProperties();
  }
}
