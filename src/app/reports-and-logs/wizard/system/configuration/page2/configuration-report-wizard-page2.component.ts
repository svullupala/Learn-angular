import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {ConfigurationReportWizardModel} from '../configuration-report-wizard.model';

@Component({
  selector: 'configuration-report-wizard-page2',
  templateUrl: './configuration-report-wizard-page2.component.html',
  styleUrls: ['./configuration-report-wizard-page2.component.scss']
})
export class ConfigurationReportWizardPage2Component extends WizardPage<ConfigurationReportWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property2;
  }
  ngOnInit(): void {
    console.log('source ngOnInit.');
    if (this.model.property1 === '111')
      this.model.property2 = '222';
  }
}
