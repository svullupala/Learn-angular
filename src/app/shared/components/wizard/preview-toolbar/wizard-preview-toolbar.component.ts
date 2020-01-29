import {Component, Output, EventEmitter, OnInit} from '@angular/core';
import {WizardToolbarBtn} from '..';

@Component({
  selector: 'wizard-preview-toolbar',
  templateUrl: './wizard-preview-toolbar.component.html',
  styleUrls: ['./wizard-preview-toolbar.component.scss']
})
export class WizardPreviewToolbarComponent implements OnInit {

  @Output() close: EventEmitter<WizardToolbarBtn> = new EventEmitter<WizardToolbarBtn>();

  buttons: WizardToolbarBtn[] = [
    new WizardToolbarBtn('wizard.textClosePreview', 'close')
  ];

  message: string;

  protected skipOptionalPages: boolean = false;

  ngOnInit(): void {
  }

  /**
   * Disables the close button.
   *
   * @method disableCloseButton
   */
  disableCloseButton() {
    this.setButtonDisabled('close', true);
  }

  /**
   * Enables the close button.
   *
   * @method enableCloseButton
   */
  enableCloseButton() {
    this.setButtonDisabled('close', false);
  }

  /**
   * Enables/disables the given button.
   *
   * @method setButtonDisabled
   * @param btn {String} 'close'
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
   * @param btn {String} 'close'
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
   * @param btn {String} 'close'
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
   * @param btn {String} 'close'
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
   * @param btn {String} 'close' only currently.
   * @private
   */
  getButton(btn): WizardToolbarBtn {
    if (btn !== 'close')
      return null;

    return this.buttons.find(function (item) {
      return item.value === btn;
    });
  }

  onButtonClick(button: WizardToolbarBtn): void {
    let me = this;
    switch (button.value) {
      case 'close':
        me.close.emit(button);
        break;
      default:
        break;
    }
  }
}
