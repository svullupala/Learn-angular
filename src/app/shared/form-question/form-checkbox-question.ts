import { RegistrationFormQuestion } from './form-question';

export class FormCheckboxQuestion extends RegistrationFormQuestion {
  controlType = 'checkbox';
  options: {key: string, value: string, disabled: boolean}[] = [];

  constructor(options: {} = {}) {
    super(options);
    this.options = options['type'] || '';
  }
}
