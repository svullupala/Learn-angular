import { RegistrationFormQuestion } from './form-question';

export class FormTextQuestion extends RegistrationFormQuestion {
  controlType = 'text';
  type: {key: string, value: any}[] = [];
  placeholder: string = '';
  min: number = undefined;
  max: number = undefined;

  constructor(options: {} = {}) {
    super(options);
    this.type = options['type'] || '';
    this.placeholder = options['placeholder'] || '';
    if ( options['type'] === 'number') {
      this.min = options['min'];
      this.max = options['max'];
    }
  }
}
