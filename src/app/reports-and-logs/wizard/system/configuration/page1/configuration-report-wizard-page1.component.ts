import {Component} from '@angular/core';
import {WizardPage} from 'shared/components/wizard/wizard-page';
import {ConfigurationReportWizardModel} from '../configuration-report-wizard.model';

@Component({
  selector: 'configuration-report-wizard-page1',
  templateUrl: './configuration-report-wizard-page1.component.html',
  styleUrls: ['./configuration-report-wizard-page1.component.scss']
})
export class ConfigurationReportWizardPage1Component extends WizardPage<ConfigurationReportWizardModel> {
  validate(silent: boolean): boolean {
    return !!this.model.property1;
  }
  ngOnInit(): void {
    console.log('page1 ngOnInit.');
    this.model.property1 = '111';
  }
}
