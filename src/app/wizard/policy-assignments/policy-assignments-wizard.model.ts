import {WizardModel} from 'shared/components/wizard/wizard.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';

export const WIZARD_CATEGORY_POLICY_ASSIGNMENTS = 'policy-assignments';

export class PolicyAssignmentsWizardModel extends WizardModel {
  policy: SlapolicyModel;
  category: string = WIZARD_CATEGORY_POLICY_ASSIGNMENTS;

  property1: string = '';
  property2: string = '';
  property3: string = '';

  json(): object {
    return {
      policyName: this.policy ? this.policy.name : '',
      property1: this.property1,
      property2: this.property2,
      property3: this.property3
    };
  }
}
