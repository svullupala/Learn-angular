import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {PolicyAssignmentsWizardModel, WIZARD_CATEGORY_POLICY_ASSIGNMENTS} from './policy-assignments-wizard.model';
import {PolicyAssignmentsResourceTypeComponent} from './resource-type/policy-assignments-resource-type.component';
import {PolicyAssignmentsResourcesComponent} from './resources/policy-assignments-resources.component';
import {PolicyAssignmentsReviewComponent} from './review/policy-assignments-review.component';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';

export type PolicyAssignmentsWizardPageComponent = PolicyAssignmentsResourceTypeComponent
  | PolicyAssignmentsResourcesComponent
  | PolicyAssignmentsReviewComponent;

@Injectable()
export class PolicyAssignmentsWizardRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_POLICY_ASSIGNMENTS, title: 'wizard.policyAssignments.textTitle',
      description: 'wizard.policyAssignments.textDesc',
      icon: 'bidi-wizard-policy-assignments',
      pages: [
        {key: 'resource-type', title: 'wizard.policyAssignments.textResourceType'},
        {key: 'resources', title: 'wizard.policyAssignments.textResources'},
        {key: 'review', title: 'wizard.textReview'},
      ]
    }
  ];

  constructor(private resolver: ComponentFactoryResolver) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): PolicyAssignmentsWizardModel } {
    let clazz: { new(): PolicyAssignmentsWizardModel };

    switch (category.type) {
      case WIZARD_CATEGORY_POLICY_ASSIGNMENTS:
        clazz = PolicyAssignmentsWizardModel;
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory,
                          pageIdx: number,
                          pageKey: string): ComponentFactory<PolicyAssignmentsWizardPageComponent> {
    let me = this, factory: ComponentFactory<PolicyAssignmentsWizardPageComponent>;

    switch (category.type) {
      case WIZARD_CATEGORY_POLICY_ASSIGNMENTS:
        factory = me.getPolicyAssignmentsPageComponentFactory(pageKey);
        break;
      default:
        break;
    }
    return factory;
  }

  getPolicyAssignmentsPageComponentFactory(pageKey: string): ComponentFactory<PolicyAssignmentsWizardPageComponent> {
    let factory: ComponentFactory<PolicyAssignmentsWizardPageComponent>;
    switch (pageKey) {
      case 'resource-type':
        factory = this.resolver.resolveComponentFactory<PolicyAssignmentsResourceTypeComponent>(
          PolicyAssignmentsResourceTypeComponent);
        break;
      case 'resources':
        factory = this.resolver.resolveComponentFactory<PolicyAssignmentsResourcesComponent>(
          PolicyAssignmentsResourcesComponent);
        break;
      case 'review':
        factory = this.resolver.resolveComponentFactory<PolicyAssignmentsReviewComponent>(
          PolicyAssignmentsReviewComponent);
        break;
      default:
        break;
    }
    return factory;
  }

  pickEditMode(policy: SlapolicyModel): PolicyAssignmentsWizardModel {
    let me = this,
      result = new PolicyAssignmentsWizardModel();
    super.pickEditMode(policy);
    result.editMode = true;
    result.policy = policy;
    me.playback(result);
    return result;
  }


  private playback(model: PolicyAssignmentsWizardModel): void {
    // Add playback logic when needed.
  }
}
