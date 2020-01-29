import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {NvPairModel} from 'shared/models/nvpair.model';


export class WizardToolbarBtn extends NvPairModel {

  constructor(public text: string,
              public value: any, public hidden?: boolean, public disabled?: boolean) {
    super(text, value);
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  setText(text: string): void {
    this.name = text;
    this.text = text;
  }

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }
}

@Component({
  selector: 'wizard-toolbar',
  templateUrl: './wizard-toolbar.component.html',
  styleUrls: ['./wizard-toolbar.component.scss']
})
export class WizardToolbarComponent implements OnInit {

  @Input() alwaysHideCancel: boolean = false;

  @Input() alwaysHideNext: boolean = false;

  @Input() allowSkipOptionalPages: boolean = false;

  @Output() previous: EventEmitter<WizardToolbarBtn> = new EventEmitter<WizardToolbarBtn>();

  @Output() next: EventEmitter<WizardToolbarBtn> = new EventEmitter<WizardToolbarBtn>();

  @Output() submit: EventEmitter<WizardToolbarBtn> = new EventEmitter<WizardToolbarBtn>();

  @Output() cancel: EventEmitter<WizardToolbarBtn> = new EventEmitter<WizardToolbarBtn>();

  @Output() skipOptional: EventEmitter<boolean> = new EventEmitter<boolean>();

  buttons: WizardToolbarBtn[] = [
    new WizardToolbarBtn('wizard.textCancel', 'cancel'),
    new WizardToolbarBtn('wizard.textBack', 'back'),
    new WizardToolbarBtn('wizard.textNext', 'next'),
    new WizardToolbarBtn('wizard.textSubmit', 'submit')
  ];

  message: string;

  protected skipOptionalPages: boolean = false;

  ngOnInit(): void {
    let me = this;
    if (me.alwaysHideCancel)
      me.setButtonVisible('cancel', false);
  }

  /**
   * Sets the message in the bar.
   *
   * @method setMessage
   * @param msg {String} The message to display
   */
  setMessage(msg: string) {
    this.message = msg;
  }

  /**
   * Removes any message from the bar.
   *
   * @method clearMessage
   */
  clearMessage() {
    this.setMessage('');
  }

  /**
   * Disables the back button.
   *
   * @method disableBackButton
   */
  disableBackButton() {
    this.setButtonDisabled('back', true);
  }

  /**
   * Enables the back button.
   *
   * @method enableBackButton
   */
  enableBackButton() {
    this.setButtonDisabled('back', false);
  }

  /**
   * Disables the next button.
   *
   * @method disableNextButton
   */
  disableNextButton() {
    this.setButtonDisabled('next', true);
  }

  /**
   * Enables the next button.
   *
   * @method enableNextButton
   */
  enableNextButton() {
    this.setButtonDisabled('next', false);
  }

  /**
   * Disables the submit button.
   *
   * @method disableSubmitButton
   */
  disableSubmitButton() {
    this.setButtonDisabled('submit', true);
  }

  /**
   * Enables the submit button.
   *
   * @method enableSubmitButton
   */
  enableSubmitButton() {
    this.setButtonDisabled('submit', false);
  }

  /**
   * Disables the cancel button.
   *
   * @method disableCancelButton
   */
  disableCancelButton() {
    this.setButtonDisabled('cancel', true);
  }

  /**
   * Enables the cancel button.
   *
   * @method enableCancelButton
   */
  enableCancelButton() {
    this.setButtonDisabled('cancel', false);
  }

  /**
   * Enables/disables the given button.
   *
   * @method setButtonDisabled
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @param disabled {Boolean} True to disable, False to enable
   */
  setButtonDisabled(btn, disabled) {
    let me = this,
      button = me.getButton(btn);

    if (button)
      button.setDisabled(disabled);
  }

  /**
   * Shows/Hides the given button.
   *
   * @method setButtonVisible
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @param visible {Boolean} True to show, False to hide
   */
  setButtonVisible(btn, visible) {
    let me = this,
      button = me.getButton(btn);

    if (button)
      button.setVisible(visible);
  }

  /**
   * Sets the text of given button.
   *
   * @method setButtonText
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @param text {String} The button text
   */
  setButtonText(btn, text) {
    let me = this,
      button = me.getButton(btn);

    if (button)
      button.setText(text);
  }

  /**
   * Gets the text of given button.
   *
   * @method getButtonText
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @return {String} The button text
   */
  getButtonText(btn) {
    let me = this,
      text = '',
      button = me.getButton(btn);

    if (button)
      text = button.name;
    return text;
  }

  /**
   * Returns the given button
   *
   * @method getButton
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @private
   */
  getButton(btn): WizardToolbarBtn {
    if (btn !== 'back' &&
      btn !== 'next' &&
      btn !== 'submit' &&
      btn !== 'cancel')
      return null;

    return this.buttons.find(function (item) {
      return item.value === btn;
    });
  }

  onButtonClick(button: WizardToolbarBtn): void {
    let me = this;
    switch (button.value) {
      case 'cancel':
        me.cancel.emit(button);
        break;
      case 'back':
        me.previous.emit(button);
        break;
      case 'next':
        me.next.emit(button);
        break;
      case 'submit':
        me.submit.emit(button);
        break;
      default:
        break;
    }
  }

  onSkipOptionalPagesChange(): void {
    this.skipOptional.emit(this.skipOptionalPages);
  }
}
