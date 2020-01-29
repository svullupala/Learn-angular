import {Component, OnInit} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {PolicyAssignmentsWizardModel} from '../policy-assignments-wizard.model';

@Component({
  selector: 'policy-assignments-resources',
  templateUrl: './policy-assignments-resources.component.html',
  styleUrls: ['./policy-assignments-resources.component.scss']
})
export class PolicyAssignmentsResourcesComponent extends WizardPage<PolicyAssignmentsWizardModel> implements OnInit {
  validate(silent: boolean): boolean {
    return !!this.model.property2;
  }

  ngOnInit(): void {
    console.log('Resources ngOnInit.');
    if (this.model.property1 === '111')
      this.model.property2 = '222';
  }
}
