import {FormGroup, FormControl, Validators} from "@angular/forms";

export class FormQuestionService {

  public buildFormGroup(questions: any): FormGroup {
    let fGroup: any = {};

    if (questions && questions.length > 0) {
      questions.forEach((eachQuestion) => {
        if (eachQuestion.isFormGroup) {
          let fControls: any = this.createFormControlObj(eachQuestion.options);
          fGroup[eachQuestion.key] = new FormGroup(fControls);
        } else {
          fGroup[eachQuestion.key] = this.isFormControlRequired(eachQuestion.required, eachQuestion.value,
            eachQuestion.min, eachQuestion.max);
        }
      });
    }
    return new FormGroup(fGroup);
  }

  private isFormControlRequired(isRequired: boolean , value: any, min?: number, max?: number): FormControl {
    let validators = [];
    if (isRequired)
      validators.push(Validators.required);
    if (min !== undefined)
      validators.push(Validators.min(min));
    if (max !== undefined)
      validators.push(Validators.max(max));
    return validators.length > 0 ? new FormControl(value, validators) : new FormControl(value);
  }

  private createFormControlObj(arrOfOptions): any {
    let fControlObj: any = {};
    if (arrOfOptions && arrOfOptions.length > 0) {
      arrOfOptions.forEach((option) => {
        fControlObj[option.key] = this.isFormControlRequired(option.required, option.value);
      });
    }
    return fControlObj;
  }
}
