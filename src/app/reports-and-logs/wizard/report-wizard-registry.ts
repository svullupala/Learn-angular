import {ComponentFactory, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {
  ConfigurationReportWizardModel,
  WIZARD_CATEGORY_CONFIGURATION_REPORT
} from './system/configuration/configuration-report-wizard.model';
import {
  ConfigurationReportWizardPageComponent, ConfigurationReportWizardRegistry
} from './system/configuration/configuration-report-wizard-registry';

import {Observable} from 'rxjs/Observable';

export type ReportWizardModel = ConfigurationReportWizardModel;

export type ReportWizardPageComponent =  ConfigurationReportWizardPageComponent;

@Injectable()
export class ReportWizardRegistry extends WizardRegistry {

  title: string = 'wizard.report.textTitle';

  constructor(private configurationReportRegistry: ConfigurationReportWizardRegistry) {

    super(true, [].concat(
      configurationReportRegistry.categories
      ));
  }

  getModelClazz(category: WizardCategory): { new(): ReportWizardModel } {
    let me = this, clazz: { new(): ReportWizardModel };

    switch (category.type) {
      case WIZARD_CATEGORY_CONFIGURATION_REPORT:
        clazz = me.configurationReportRegistry.getModelClazz(category);
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory, pageIdx: number): ComponentFactory<ReportWizardPageComponent> {
    let me = this, factory: ComponentFactory<ReportWizardPageComponent>;

    switch (category.type) {
        case WIZARD_CATEGORY_CONFIGURATION_REPORT:
        factory = me.configurationReportRegistry.getPageComponentFactory(category, pageIdx);
        break;
      default:
        break;
    }
    return factory;
  }
}
