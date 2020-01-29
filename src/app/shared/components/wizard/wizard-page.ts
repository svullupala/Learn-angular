import {AfterViewInit, TemplateRef} from '@angular/core';
import {WizardModel, WizardSubjectPubEntry, WizardSubjectSubEntry} from 'app/shared/components/wizard/wizard.model';
import {AlertComponent, ErrorHandlerComponent, WizardComponent} from 'shared/components';
import {Subscription} from 'rxjs/Subscription';

export type WizardPageEventParam = {
  page: WizardPage<WizardModel>;
  wizard: WizardComponent;
  index?: number;
  preventNextEvent?: boolean; // Set to true to prevent next event.
  back?: boolean; // Set to true to indicate the event comes from Back action,
                  // it is applicable for activatePageEvent & deactivatePageEvent.
  activateNext?: boolean; // Set to true to activate next(previous when back is true) page,
                          // it is applicable for activatePageEvent, beforePrevEvent & beforeNextEvent.
};

export type SummaryEntry = {
  title?: string;
  content: string | TemplateRef<any>;
};

export abstract class WizardPage<T extends WizardModel> implements AfterViewInit {

  alert: AlertComponent;
  errorHandler: ErrorHandlerComponent;
  viewReady: boolean = false;

  get editMode(): boolean {
    return this.model && this.model.editMode;
  }

  /**
   * The wizard associated with this page.
   */
  protected wizard: WizardComponent;
  protected activatePending: boolean = false;
  protected activateParam: WizardPageEventParam;

  /**
   * A unique identifier for this page. The wizard uses this value to
   * reference the page.
   *
   */
  public pageKey: string;

  /**
   * A model which is shared by all the pages of wizard,
   * each page is able to access(i.e. Read/Write) this model but just writes
   * some sections of it, usually these sections correspond to the things
   * this page renders.
   */
  public model: T;

  /**
   * A boolean to indicate if this is a review page or not.
   * @type {boolean}
   */
  public review: boolean = false;

  /**
   * A boolean to indicate if the review is just for edit or not, it is applicable only if the review property is true.
   * @type {boolean}
   */
  public justForEdit: boolean = false;

  /**
   * The summary entries for showing the review, it is applicable only if the review property is true.
   */
  public summaryEntries: SummaryEntry[];

  /**
   * An abstract method must be implemented by the derived class,
   * validates this page is valid or not.
   * Note: In order not to impact performance, we propose the validation process
   * is as simple as possible.
   *
   * @param {boolean} silent or not during the validation process.
   * @return {boolean} Returns true indicates this page is valid.
   */
  public abstract validate(silent: boolean): boolean;

  /**
   * The default ngAfterViewInit handles the pending activate logic.
   *
   */
  ngAfterViewInit(): void {
    let me = this;
    if (me.activatePending) {
      setTimeout(() => {
        let activateNext = me.activateParam.activateNext;
        me.onActive(me.activateParam, true);
        me.activatePending = false;
        me.activateParam = undefined;
        me.viewReady = true;
        if (activateNext && me.wizard)
          me.wizard.onNext(activateNext);
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
      if (param.activateNext && this.wizard) {
        param.back ? this.wizard.onPrevious(param.activateNext) : this.wizard.onNext(param.activateNext);
      }
    } else {
      this.activatePending = true;
      this.activateParam = param;
    }
  }

  /**
   * A callback method which will be called when this page is activated,
   * it can be overridden by the derived class as well.
   *
   * @param {WizardPageEventParam} param The page event parameter.
   * @param {boolean} firstTime A boolean indicates if this page is activated first time or not.
   */
  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
  }

  /**
   * A callback method which will be called when this page is deactivated,
   * it can be overridden by the derived class as well.
   *
   * @param {WizardPageEventParam} param The page event parameter.
   */
  public onDeactive(param: WizardPageEventParam): void {
  }

  /**
   * Content to be displayed as summary,
   * it can be overridden by the derived class.
   *
   * @return {SummaryEntry}
   */
  public get summary(): SummaryEntry {
    return {title: 'noSummary', content: ''};
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  /**
   * A shortcut to model.publish.
   *
   * @method publish<U>
   * @protected
   * @param {WizardSubjectPubEntry<U>} entry
   * @return {boolean | Subscription[]}
   */
  protected publish<U>(entry: WizardSubjectPubEntry<U>): boolean | Subscription[] {
    return this.model ? this.model.publish<U>(entry) : false;
  }

  /**
   * A shortcut to model.subscribe.
   *
   * @method subscribe<U>
   * @protected
   * @param {WizardSubjectSubEntry<U>} entry
   * @return {Subscription[]}
   */
  protected subscribe<U>(entry: WizardSubjectSubEntry<U>): Subscription[] {
    return this.model ? this.model.subscribe<U>(entry) : [];
  }

  /**
   * A shortcut to model.unsubscribe.
   *
   * @method unsubscribe
   * @protected
   * @param {Subscription[]} subscriptions
   */
  protected unsubscribe(subscriptions: Subscription[]): void {
    if (this.model)
      this.model.unsubscribe(subscriptions);
  }

  /**
   * A shortcut to model.notify.
   *
   * @method notify<U>
   * @protected
   * @param {string} subject
   * @param {U} value
   * @return {boolean}
   */
  protected notify<U>(subject: string, value: U): boolean {
    return this.model ? this.model.notify<U>(subject, value) : false;
  }

  /**
   * A shortcut to wizard.backToPage.
   *
   * @method backToPage
   * @protected
   * @param key {string} The page's key
   * @return {boolean} A boolean indicates success or failure.
   */
  protected backToPage(key: string): boolean {
    return this.wizard ? this.wizard.backToPage(key) : false;
  }

  /**
   * A shortcut to wizard.splicePages.
   *
   * @method splicePages
   * @protected
   * @param {string} startKey The page's key in the pages array of wizard category
   *              from which to start removing pages.
   * @param {number} deleteCount The number of pages to remove.
   * @param {string} items Page keys indicate which pages need to insert into
   *              the pages array in place of the deleted pages.
   * @return {string[]} Returns an array of key indicates the deleted pages.
   */
  protected splicePages(startKey: string, deleteCount?: number, ...items: string[]): string[] {
    return this.wizard ? this.wizard.splicePages(startKey, deleteCount, ...items) : [];
  }

  /**
   * A shortcut to call wizard.isOmitted method with pageKey as parameter.
   *
   * @method isOmitted
   * @return {boolean}
   */
  isOmitted(): boolean {
    return this.wizard ? this.wizard.isOmitted(this.pageKey) : false;
  }
}
