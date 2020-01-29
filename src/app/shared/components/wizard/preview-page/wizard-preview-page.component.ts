import {Component} from '@angular/core';
import {WizardModel} from 'shared/components/wizard/wizard.model';
import {WizardPreview} from 'shared/components/wizard/wizard-preview';

@Component({
  selector: 'wizard-preview-page',
  templateUrl: './wizard-preview-page.component.html',
  styleUrls: ['./wizard-preview-page.component.scss']
})
export class WizardPreviewPageComponent extends WizardPreview<WizardModel> {
}
