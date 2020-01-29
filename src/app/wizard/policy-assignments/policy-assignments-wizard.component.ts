import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AlertComponent} from 'app/shared/components';
import {SessionService} from 'core';
import {PolicyAssignmentsWizardModel} from './policy-assignments-wizard.model';
import {PolicyAssignmentsWizardRegistry} from './policy-assignments-wizard-registry';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {WizardPageEventParam} from 'shared/components/wizard/wizard-page';

@Component({
  selector: 'policy-assignments-wizard',
  templateUrl: './policy-assignments-wizard.component.html',
  styleUrls: []
})
export class PolicyAssignmentsWizardComponent implements OnInit {
  @Input() textBackToTarget: string;
  @Input() model: PolicyAssignmentsWizardModel;

  @Output() cancelEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() submitEvent: EventEmitter<PolicyAssignmentsWizardModel> = new EventEmitter<PolicyAssignmentsWizardModel>();

  active: boolean = false;
  private alert: AlertComponent;

  constructor(public registry: PolicyAssignmentsWizardRegistry) {
  }

  ngOnInit(): void {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  onWizardCancel(): void {
    this.hide();
    this.cancelEvent.emit();
  }

  onWizardSubmit(model: PolicyAssignmentsWizardModel): void {
    let me = this;
    if (me.alert)
      me.alert.show('Wizard Result', JSON.stringify(model.json()));
    me.submitEvent.emit(model);
  }

  onWizardActivatePage(payload: WizardPageEventParam): void {
    switch (payload.page.pageKey) {
      case 'resource-type':
        payload.wizard.setButtonText('next', 'wizard.textNext');
        break;
      case 'resources':
        payload.wizard.setButtonText('next', 'wizard.policyAssignments.textSave');
        break;
      case 'review':
        payload.wizard.setButtonText('submit', 'wizard.policyAssignments.textFinishEditing');
        break;
      default:
        break;
    }
  }

  onWizardBeforeNext(payload: WizardPageEventParam): void {
    if (payload.page.pageKey === 'resources') {
      console.log(`before ${payload.page.pageKey} next.`);
      // TODO: If need to prevent next, simply set the preventNextEvent of payload to true.
      // Use this.model.property2 is not 'next' as an example below.
      // if (this.model.property2 !== 'next')
      //   payload.preventNextEvent = true;
    }
  }

  show(): void {
    this.active = true;
  }

  hide(): void {
    this.active = false;
  }

  edit(policy: SlapolicyModel): void {
    let me = this;
    me.model = me.registry.pickEditMode(policy);
    me.show();
  }
}
