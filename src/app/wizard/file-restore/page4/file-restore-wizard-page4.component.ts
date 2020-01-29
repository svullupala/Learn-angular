import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {FileRestoreWizardModel} from '../file-restore-wizard.model';

@Component({
  selector: 'file-restore-wizard-page4',
  templateUrl: './file-restore-wizard-page4.component.html',
  styleUrls: ['./file-restore-wizard-page4.component.scss']
})
export class FileRestoreWizardPage4Component extends WizardPage<FileRestoreWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property4;
  }
  ngOnInit(): void {
    console.log('destination ngOnInit.');
  }
}
