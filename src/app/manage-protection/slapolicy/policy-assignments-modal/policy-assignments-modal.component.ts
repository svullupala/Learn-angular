import {Component, ViewChild, Input, Output, EventEmitter, AfterViewInit} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {PolicyAssignmentsWizardComponent} from 'wizard/policy-assignments/policy-assignments-wizard.component';

@Component({
  selector: 'policy-assignments-modal',
  templateUrl: './policy-assignments-modal.component.html',
  styleUrls: ['./policy-assignments-modal.component.scss']
})
export class PolicyAssignmentsModalComponent implements AfterViewInit {
  @Input() autoShow: boolean = true;
  @Input() policy: SlapolicyModel;
  @Output() showEvent = new EventEmitter();
  @Output() hideEvent = new EventEmitter();
  @ViewChild('paModal') modal: ModalDirective;
  @ViewChild(PolicyAssignmentsWizardComponent) policyAssignments: PolicyAssignmentsWizardComponent;

  masked: boolean = false;

  get policyName(): string {
    return this.policy ? this.policy.name : '';
  }

  ngAfterViewInit() {
    this.autoShow ? this.wizard(this.policy) : this.hide();
  }

  close(): void {
    if (this.policyAssignments)
      this.policyAssignments.hide();
    this.hide();
  }

  wizard(policy: SlapolicyModel): void {
    if (this.policyAssignments) {
      this.policy = policy;
      this.policyAssignments.edit(policy);
      this.show();
    }
  }

  mask(): void {
    this.masked = true;
  }

  unmask(): void {
    this.masked = false;
  }

  protected show(): void {
    this.modal.show();
    this.showEvent.emit();
  }

  protected hide(): void {
    this.modal.hide();
    this.hideEvent.emit();
  }
}
