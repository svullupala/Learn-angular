import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {FileRestoreWizardModel} from '../file-restore-wizard.model';

@Component({
  selector: 'file-restore-wizard-page5',
  templateUrl: './file-restore-wizard-page5.component.html',
  styleUrls: ['./file-restore-wizard-page5.component.scss']
})
export class FileRestoreWizardPage5Component extends WizardPage<FileRestoreWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property5;
  }
  ngOnInit(): void {
    console.log('run-type ngOnInit.');
  }
}
