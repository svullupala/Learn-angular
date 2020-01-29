import {WizardModel} from 'shared/components/wizard/wizard.model';

export const WIZARD_CATEGORY_FILE_RESTORE = 'file-restore';

export class FileRestoreWizardModel extends WizardModel {
  property1: string = '';
  property2: string = '';
  property3: string = '';
  property4: string = '';
  property5: string = '';

  json(): object {
    return {
      property1: this.property1,
      property2: this.property2,
      property3: this.property3,
      property4: this.property4,
      property5: this.property5
    };
  }
}
