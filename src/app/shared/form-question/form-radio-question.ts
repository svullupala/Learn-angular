import { RegistrationFormQuestion } from './form-question';

export class FormRadioQuestion extends RegistrationFormQuestion {
  controlType = 'radio';
  options: {label: string, value: any}[] = [];

  constructor(options) {
    super(options);
    this.options = options['options'];
  }
}
