import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {FileRestoreWizardModel} from '../file-restore-wizard.model';

@Component({
  selector: 'file-restore-wizard-page2',
  templateUrl: './file-restore-wizard-page2.component.html',
  styleUrls: ['./file-restore-wizard-page2.component.scss']
})
export class FileRestoreWizardPage2Component extends WizardPage<FileRestoreWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property2;
  }
  ngOnInit(): void {
    console.log('source ngOnInit.');
    if (this.model.property1 === '111')
      this.model.property2 = '222';
  }
}
