import {WizardModel} from 'app/shared/components/wizard/wizard.model';
import {WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {WizardPreviewEntry} from 'shared/components/wizard/wizard-registry';

export const WIZARD_PREVIEW_PAGE_IDX = -8;
export const WIZARD_PREVIEW_PAGE_KEY = 'preview';

export type WizardPreviewEventParam = {
  inPreview?: boolean; // In preview or not.
  activePage: string; // Active wizard page key.
};

export abstract class WizardPreview<T extends WizardModel> extends WizardPage<T> {

  entry: WizardPreviewEntry;

  readonly pageKey: string = WIZARD_PREVIEW_PAGE_KEY;

  readonly review: boolean = false;

  readonly justForEdit: boolean = false;

  validate(silent: boolean): boolean {
    return true;
  }

  /**
   * The default ngAfterViewInit handles the pending activate logic.
   *
   */
  ngAfterViewInit(): void {
    let me = this;
    if (me.activatePending) {
      setTimeout(() => {
        me.onActive(me.activateParam, true);
        me.activatePending = false;
        me.activateParam = undefined;
        me.viewReady = true;
      }, 20);
    } else {
      setTimeout(() => {
        me.viewReady = true;
      }, 20);
    }
  }

  /**
   * Activate method which makes sure this page's onActive is called after its view is ready.
   *
   * @param {WizardPageEventParam} param The page event parameter.
   */
  public activate(param: WizardPageEventParam): void {
    this.wizard = param.wizard;
    if (this.viewReady) {
      this.onActive(param, false);
    } else {
      this.activatePending = true;
      this.activateParam = param;
    }
  }
}
