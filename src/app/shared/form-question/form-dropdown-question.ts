import { RegistrationFormQuestion } from './form-question';

export class FormDropdownQuestion extends RegistrationFormQuestion {
  controlType = 'dropdown';
  options: {key: string, value: any, label: string}[] = [];

  constructor(options: {} = {}) {
    super(options);
    this.options = options['options'] || [];
  }
}
