import {Component, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {RegistrationFormQuestion} from 'shared/form-question/form-question';
import {BasicDynamicForm} from 'shared/basic-dynamic-form/basic-dynamic-form.component';
import {LdapModel} from '../ldap.model';
import {UserModel} from '../user.model';

@Component({
  selector: 'ldap-register',
  templateUrl: './ldap-register.component.html'
})
export class LdapRegisterComponent  {
  @Output() onSubmit = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Input() formLabel: string = undefined;
  @Input() users: UserModel[] = [];
  @ViewChild(BasicDynamicForm) basicForm: BasicDynamicForm;

  private value: LdapModel = undefined;
  private formQuestions: RegistrationFormQuestion[];

  constructor() { }

  onSubmitEvent(values: any) {
    if (this.value) {
      values.id = this.value.id;
    }
    this.onSubmit.emit(values);
  }

  onCancelEvent() {
    this.onCancel.emit();
  }

  public setForm(formQuestions: RegistrationFormQuestion[], value: LdapModel) {
    this.value = value;
    this.formQuestions = formQuestions;
    this.basicForm.setForm(formQuestions);
  }
}

