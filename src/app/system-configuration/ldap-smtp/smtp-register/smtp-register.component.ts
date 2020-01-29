import {Component, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {RegistrationFormQuestion} from 'shared/form-question/form-question';
import {BasicDynamicForm} from 'shared/basic-dynamic-form/basic-dynamic-form.component';
import {SmtpModel} from '../smtp.model';
import {UserModel} from '../user.model';

@Component({
  selector: 'smtp-register',
  styles: [],
  templateUrl: './smtp-register.component.html'
})
export class SmtpRegisterComponent {
  @Output() onSubmit = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Input() formLabel: string = undefined;
  @Input() users: UserModel[] = [];
  @ViewChild(BasicDynamicForm) basicForm: BasicDynamicForm;

  private value: SmtpModel = undefined;
  private formQuestions: RegistrationFormQuestion[];

  constructor() { }

  onSubmitEvent(values: any)  {
    if (this.value) {
      values.id = this.value.id;
    }
    this.onSubmit.emit(values);
  }

  onCancelEvent() {
    this.onCancel.emit();
  }

  public setForm(formQuestions: RegistrationFormQuestion[], value: SmtpModel) {
    this.value = value;
    this.formQuestions = formQuestions;
    this.basicForm.setForm(formQuestions);
  }
}
