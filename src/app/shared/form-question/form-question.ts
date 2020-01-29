export class RegistrationFormQuestionDependency {
  constructor(public dependOn: RegistrationFormQuestion, public value: any) {}
}
export class RegistrationFormQuestion {

  public value: any;
  public key: string;
  public label: string;
  public required: boolean;
  public isFormGroup: boolean;
  public hidden: boolean;
  public controlType: string;
  public dependencies: RegistrationFormQuestionDependency[];
  public errorSuggestion: string;
  public disabled: boolean;

  constructor(options: {
    value?: any,
    key?: string,
    label?: string,
    required?: boolean,
    isFormGroup?: boolean,
    controlType?: string,
    dependencies?: RegistrationFormQuestionDependency[],
    hidden?: boolean,
    errorSuggestion?: string,
    disabled?: boolean
  } = {}) {
    this.value = options.value;
    this.key = options.key;
    this.label = options.label || '';
    this.required = options.required || false;
    this.isFormGroup = options.isFormGroup || false;
    this.controlType = options.controlType || 'text';
    this.dependencies = options.dependencies;
    this.hidden = options.hidden || false;
    this.disabled = options.disabled || false;
    this.errorSuggestion = options.errorSuggestion || (this.required ? 'common.textRequiredFieldSuggestion' : '');
  }
}
