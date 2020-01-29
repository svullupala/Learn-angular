import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {FileRestoreWizardModel} from '../file-restore-wizard.model';

@Component({
  selector: 'file-restore-wizard-page1',
  templateUrl: './file-restore-wizard-page1.component.html',
  styleUrls: ['./file-restore-wizard-page1.component.scss']
})
export class FileRestoreWizardPage1Component extends WizardPage<FileRestoreWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property1;
  }
  ngOnInit(): void {
    console.log('page1 ngOnInit.');
    this.model.property1 = '111';
  }
}
