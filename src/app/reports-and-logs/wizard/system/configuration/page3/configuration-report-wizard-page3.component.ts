import {Component} from '@angular/core';
import {WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {ConfigurationReportWizardModel} from '../configuration-report-wizard.model';

@Component({
  selector: 'configuration-report-wizard-page3',
  templateUrl: './configuration-report-wizard-page3.component.html',
  styleUrls: ['./configuration-report-wizard-page3.component.scss']
})
export class ConfigurationReportWizardPage3Component extends WizardPage<ConfigurationReportWizardModel> {
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
