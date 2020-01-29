import {Component, OnInit} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {PolicyAssignmentsWizardModel} from '../policy-assignments-wizard.model';

@Component({
  selector: 'policy-assignments-resource-type',
  templateUrl: './policy-assignments-resource-type.component.html',
  styleUrls: ['./policy-assignments-resource-type.component.scss']
})
export class PolicyAssignmentsResourceTypeComponent extends WizardPage<PolicyAssignmentsWizardModel> implements OnInit {
  validate(silent: boolean): boolean {
    return !!this.model.property1;
  }

  ngOnInit(): void {
    console.log('ResourceType ngOnInit.');
    this.model.property1 = '111';
  }
}
