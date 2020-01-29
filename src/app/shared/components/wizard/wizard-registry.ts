import {ComponentFactory, TemplateRef} from '@angular/core';
import {WizardModel, Workflow} from 'app/shared/components/wizard/wizard.model';
import {WizardPage} from 'app/shared/components/wizard/wizard-page';
import {JobModel} from 'job/shared/job.model';
import {WizardPreview} from 'shared/components/wizard/wizard-preview';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';

export type WizardTheme = 'standard' | 'pop';

export type WizardPageEntry = {
  key: string;
  title: string;
  active?: boolean;
  group?: string;
  groupSummaryTitle?: string;
  optional?: boolean;
  advanced?: boolean;
  review?: boolean; // If true will use the built-in review page.
  justForEdit?: boolean; // If true, the review page is just for edit.
  workflow?: boolean; // If true will use the built-in workflow selector.
  instance?: WizardPage<WizardModel>;
};

export type WizardPreviewEntry = {
  title: string;
  description?: string;
  instance?: WizardPreview<WizardModel>;
};

export type WizardCategory = {
  type: string;
  subType?: Workflow;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  pages: WizardPageEntry[];
  preview?: WizardPreviewEntry;
};

export type WizardAllowedCategory = {
  type: string;
  subType: Workflow;
};

export abstract class WizardRegistry {

  /**
   * Edit mode flag.
   * @type {boolean}
   */
  protected editMode: boolean = false;

  /**
   * Gets wizard categories.
   *
   * @return {WizardCategory[]} Returns the categories template.
   */
  getCategories(): WizardCategory[] {
    return this.categories || [];
  }

  /**
   * Resets the active status of pages.
   * @param {WizardCategory} category The category instance.
   * @param {boolean} workflow Is resetting the workflow or not.
   */
  resetPagesActive(category: WizardCategory, workflow?: boolean): void {
    return (category.pages || []).forEach(function (item, idx) {
      item.active = workflow ? !!item.workflow : idx === 0;
    });
  }

  /**
   * Gets the offset of gage index.
   * @param {WizardCategory} category The category instance.
   * @return {number}
   */
  getPageIndexOffset(category: WizardCategory): number {
    let origin = this.getCategories().find(function (item) {
        return item.type === category.type && item.subType === category.subType;
      }),
      originPageLen = origin && origin.pages ? origin.pages.length : 0,
      targetPageLen = category.pages ? category.pages.length : 0;
    return originPageLen - targetPageLen;
  }

  /**
   * Gets the model class associated with wizard, note: all wizard pages can share this model instance.
   * @param {WizardCategory} category
   * @return {{new() => WizardModel}}
   */
  abstract getModelClazz(category: WizardCategory): { new(): WizardModel };

  /**
   * Gets the factory of wizard page component.
   * Note: A wizard page must be a dynamic component which added
   * into the 'entryComponents' & 'declarations' sections of the associated module.
   *
   * @param {WizardCategory} category The category instance.
   * @param {number} pageIdx The page index.
   * @param {string} pageKey The page key.
   * @return {ComponentFactory<WizardPage<WizardModel>>}
   */
  abstract getPageComponentFactory(category: WizardCategory,
                                   pageIdx: number,
                                   pageKey: string): ComponentFactory<WizardPage<WizardModel>>;

  /**
   * Picks edit mode from job model.
   * @param {JobModel | SlapolicyModel} model
   */
  pickEditMode(model: JobModel | SlapolicyModel): void | WizardModel {
    this.editMode = true;
    this.hasStarter = false;
  }

  /**
   * Picks create mode.
   * @param {boolean} hasStarter
   */
  pickCreateMode(hasStarter: boolean): void {
    this.editMode = false;
    this.hasStarter = hasStarter;
  }

  constructor(public hasStarter: boolean,
              public categories?: WizardCategory[],
              public title?: string,
              public description?: string | TemplateRef<any>) {
  }
}
