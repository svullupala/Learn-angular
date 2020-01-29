import {Component} from '@angular/core';
import {WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {FileRestoreWizardModel} from '../file-restore-wizard.model';

@Component({
  selector: 'file-restore-wizard-page3',
  templateUrl: './file-restore-wizard-page3.component.html',
  styleUrls: ['./file-restore-wizard-page3.component.scss']
})
export class FileRestoreWizardPage3Component extends WizardPage<FileRestoreWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property3;
  }
  ngOnInit(): void {
    console.log('snapshot ngOnInit.');
  }
  restProperties(): void {
    if (this.model.property2 === '333')
      this.model.property3 = '888';
  }
  public onActive(param: WizardPageEventParam): void {
    this.restProperties();
  }
}
