import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {WizardCategory, WizardRegistry} from 'shared/components/wizard/wizard-registry';
import {FileRestoreWizardModel, WIZARD_CATEGORY_FILE_RESTORE} from './file-restore-wizard.model';
import {FileRestoreWizardPage1Component} from './page1/file-restore-wizard-page1.component';
import {FileRestoreWizardPage2Component} from './page2/file-restore-wizard-page2.component';
import {FileRestoreWizardPage3Component} from './page3/file-restore-wizard-page3.component';
import {FileRestoreWizardPage4Component} from './page4/file-restore-wizard-page4.component';
import {FileRestoreWizardPage5Component} from './page5/file-restore-wizard-page5.component';

export type FileRestoreWizardPageComponent = FileRestoreWizardPage1Component
  | FileRestoreWizardPage2Component
  | FileRestoreWizardPage3Component
  | FileRestoreWizardPage4Component
  | FileRestoreWizardPage5Component;

@Injectable()
export class FileRestoreWizardRegistry extends WizardRegistry {

  categories: WizardCategory[] = [
    {
      type: WIZARD_CATEGORY_FILE_RESTORE, title: 'wizard.job.textFileRestoreTitle',
      description: 'wizard.job.textFileRestoreDescription',
      icon: 'bidi-wizard-file-restore',
      pages: [
        {key: 'page1', title: 'wizard.job.textPage1Title', group: 'wizard.job.textGroupSelectDataSources'},
        {key: 'source', title: 'wizard.job.textPage2Title', group: 'wizard.job.textGroupSelectDataSources'},
        {key: 'snapshot', title: 'wizard.job.textPage3Title'},
        {key: 'destination', title: 'wizard.job.textPage4Title'},
        {key: 'run-type', title: 'wizard.job.textPage5Title'}
      ]
    }
  ];

  constructor(private resolver: ComponentFactoryResolver) {
    super(false);
  }

  getModelClazz(category: WizardCategory): { new(): FileRestoreWizardModel } {
    let clazz: { new(): FileRestoreWizardModel };

    switch (category.type) {
      case WIZARD_CATEGORY_FILE_RESTORE:
        clazz = FileRestoreWizardModel;
        break;
      default:
        break;
    }
    return clazz;
  }

  getPageComponentFactory(category: WizardCategory, pageIdx: number): ComponentFactory<FileRestoreWizardPageComponent> {
    let me = this, factory: ComponentFactory<FileRestoreWizardPageComponent>;

    switch (category.type) {
      case WIZARD_CATEGORY_FILE_RESTORE:
        factory = me.getFileRestorePageComponentFactory(pageIdx);
        break;
      default:
        break;
    }
    return factory;
  }

  getFileRestorePageComponentFactory(pageIdx: number): ComponentFactory<FileRestoreWizardPageComponent> {
    let factory: ComponentFactory<FileRestoreWizardPageComponent>;
    switch (pageIdx) {
      case 0:
        factory = this.resolver.resolveComponentFactory<FileRestoreWizardPage1Component>(
          FileRestoreWizardPage1Component);
        break;
      case 1:
        factory = this.resolver.resolveComponentFactory<FileRestoreWizardPage2Component>(
          FileRestoreWizardPage2Component);
        break;
      case 2:
        factory = this.resolver.resolveComponentFactory<FileRestoreWizardPage3Component>(
          FileRestoreWizardPage3Component);
        break;
      case 3:
        factory = this.resolver.resolveComponentFactory<FileRestoreWizardPage4Component>(
          FileRestoreWizardPage4Component);
        break;
      case 4:
        factory = this.resolver.resolveComponentFactory<FileRestoreWizardPage5Component>(
          FileRestoreWizardPage5Component);
        break;
      default:
        break;
    }
    return factory;
  }
}
