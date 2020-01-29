import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {ConfigurationReportWizardModel, WIZARD_CATEGORY_CONFIGURATION_REPORT} from './configuration-report-wizard.model';
import {ConfigurationReportWizardPage1Component} from './page1/configuration-report-wizard-page1.component';
import {ConfigurationReportWizardPage2Component} from './page2/configuration-report-wizard-page2.component';
import {ConfigurationReportWizardPage3Component} from './page3/configuration-report-wizard-page3.component';

export type ConfigurationReportWizardPageComponent = ConfigurationReportWizardPage1Component
  | ConfigurationReportWizardPage2Component
  | ConfigurationReportWizardPage3Component;

@Injectable()
export class ConfigurationReportWizardRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_CONFIGURATION_REPORT, title: 'wizard.report.textConfigurationTitle',
      description: 'wizard.report.textConfigurationDesc',
      icon: 'fa fal fa-archive',
      pages: [
        {key: 'page1', title: 'wizard.job.textPage1Title', group: 'wizard.job.textGroupSelectDataSources'},
        {key: 'source', title: 'wizard.job.textPage2Title', group: 'wizard.job.textGroupSelectDataSources'},
        {key: 'snapshot', title: 'wizard.job.textPage3Title'},
      ]
    }
  ];

  constructor(private resolver: ComponentFactoryResolver) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): ConfigurationReportWizardModel } {
    let clazz: { new(): ConfigurationReportWizardModel };

    switch (category.type) {
      case WIZARD_CATEGORY_CONFIGURATION_REPORT:
        clazz = ConfigurationReportWizardModel;
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory, pageIdx: number): ComponentFactory<ConfigurationReportWizardPageComponent> {
    let me = this, factory: ComponentFactory<ConfigurationReportWizardPageComponent>;

    switch (category.type) {
      case WIZARD_CATEGORY_CONFIGURATION_REPORT:
        factory = me.getFileRestorePageComponentFactory(pageIdx);
        break;
      default:
        break;
    }
    return factory;
  }

  getFileRestorePageComponentFactory(pageIdx: number): ComponentFactory<ConfigurationReportWizardPageComponent> {
    let factory: ComponentFactory<ConfigurationReportWizardPageComponent>;
    switch (pageIdx) {
      case 0:
        factory = this.resolver.resolveComponentFactory<ConfigurationReportWizardPage1Component>(
          ConfigurationReportWizardPage1Component);
        break;
      case 1:
        factory = this.resolver.resolveComponentFactory<ConfigurationReportWizardPage2Component>(
          ConfigurationReportWizardPage2Component);
        break;
      case 2:
        factory = this.resolver.resolveComponentFactory<ConfigurationReportWizardPage3Component>(
          ConfigurationReportWizardPage3Component);
        break;
      default:
        break;
    }
    return factory;
  }
}
