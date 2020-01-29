import {WizardComponent} from 'app/shared/components/wizard/wizard.component';
import {WizardModel} from 'app/shared/components/wizard/wizard.model';
import {
  AfterViewChecked,
  Component, ComponentFactory, ComponentRef, EventEmitter, Input, OnDestroy, OnInit, ViewChild,
  ViewContainerRef
} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {WizardPage, WizardPageEventParam} from 'app/shared/components/wizard/wizard-page';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'wizard-page-container',
  templateUrl: './wizard-page-container.component.html',
  styleUrls: ['./wizard-page-container.component.scss']
})
export class WizardPageContainerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('pageContainer', {read: ViewContainerRef}) container: ViewContainerRef;

  componentRef: ComponentRef<WizardPage<WizardModel>>;

  /**
   * A unique identifier for this page. The wizard uses this value to
   * reference the page in the sidebar tool.
   *
   */
  @Input() key: string;

  /**
   * The wizard displays this in the panel title of the sidebar tool.
   */
  title: string;

  /**
   * The wizard displays this in the panel of the sidebar tool.
   * Note, this should not be used if navigatorItems are specified.
   *
   */
  text: string;


  /**
   * The wizard associated with this page.
   */
  wizard: WizardComponent;

  /**
   * Fires after the page had been added to the wizard.
   * @type {EventEmitter<WizardPageParam>}
   */
  pageAddedEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();


  get target(): WizardPage<WizardModel> {
    return this.componentRef ? this.componentRef.instance : undefined;
  }

  protected subRef: Subject<void> = new Subject<void>();
  protected bne: Subscription;
  protected bse: Subscription;

  ngOnInit(): void {
    let me = this;

    if (!me.key) {
      console.error('[WizardPageContainer] key property is required');
      return;
    }

    me.addListener(me.pageAddedEvent, me.onPageAdded, true);
  }

  ngOnDestroy() {
    if (this.subRef)
      this.subRef.unsubscribe();
    if (this.bne)
      this.bne.unsubscribe();
    if (this.bse)
      this.bse.unsubscribe();
    this.destroyComponent();
  }

  ngAfterViewChecked(): void {
    this.refreshNextSubmitState();
  }

  destroyComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
  }

  createComponent<T extends WizardModel, P extends WizardPage<T>>(model: T,
                                                                  factory: ComponentFactory<P>): P {
    let me = this;
    me.container.clear();
    me.destroyComponent();
    me.componentRef = me.container.createComponent<P>(factory);
    me.componentRef.instance.model = model;
    me.componentRef.instance.pageKey = me.key;
    return <P>me.componentRef.instance;
  }

  clearComponent(): void {
    let me = this;
    me.container.clear();
    me.destroyComponent();
  }

  /**
   * Returns the wizard associated with the page.
   *
   * @method getWizard
   * @returns {WizardComponent}
   */
  getWizard(): WizardComponent {
    return this.wizard;
  }

  /**
   * Sets the wizard associated with the page.
   *
   * @method setWizard
   * @param {WizardComponent} wizard The wizard
   */
  setWizard(wizard: WizardComponent) {
    this.wizard = wizard;
  }

  /**
   * Validates the page.
   *
   * This method should be overridden by its subclass.
   *
   * @method validate
   * @param silent {Boolean} True to provide no user feedback.
   * @return {Boolean} True if page is valid
   */
  validate(silent: boolean): boolean {
    let target = this.target;
    return target && target.viewReady && (target.isOmitted() || target.validate(silent));
  }

  addListener(event: EventEmitter<any>, fn: Function, single: boolean, scope?: any): void {
    let me = this, observable = event.takeUntil(me.subRef).subscribe((params) => {
      fn.call(scope || me, params);
      if (single)
        observable.unsubscribe();
    });
  }

  protected onPageAdded(param: WizardPageEventParam): void {
    let me = this, wizard = param.wizard;

    me.wizard = wizard;

    me.bne = wizard.addListener(wizard.beforeNextEvent, function (payload: WizardPageEventParam) {
      if (payload.page !== this.target)
        return true;

      if (!payload.page.viewReady || !payload.activateNext && payload.page.validate(false) !== true)
        payload.preventNextEvent = true;

    }, false, me);

    me.bse = wizard.addListener(wizard.beforeSubmitEvent, function (payload: WizardPageEventParam) {

      if (!this.validate(false))
        payload.preventNextEvent = true;

    }, false, me);
  }

  /**
   * Refreshes the state of the next & submit buttons.
   *
   * @method refreshNextSubmitState
   */
  protected refreshNextSubmitState() {
    let wizard = this.getWizard();
    if (wizard)
      wizard.refreshNextSubmitState();
  }
}
