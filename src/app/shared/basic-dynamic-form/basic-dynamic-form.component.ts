import {
  Component, OnInit, Input, EventEmitter, Output, ElementRef,
  Renderer, QueryList, ViewChildren, OnDestroy
} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {Subscription} from "rxjs/Subscription";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {FormQuestionService} from "../form-question/form-question.service";
import {RegistrationFormQuestion} from '../form-question/form-question';

@Component({
  selector: 'basic-dynamic-form',
  templateUrl: 'basic-dynamic-form.component.html',
  styleUrls: ['basic-dynamic-form.component.scss']
})

export class BasicDynamicForm implements OnInit, OnDestroy {

  @Input() formLabel: string;
  @Input('saveButtonText') saveText: string;
  @Input() formValues;
  @Input() enableSaveButton: boolean = true;
  @Input() enableCancelButton: boolean = true;
  @Input() enableCardLayout: boolean = true;
  @Input() idPrefix: string = '';
  @Output() onSubmitEvent: EventEmitter<any> = new EventEmitter();
  @Output() onCancelEvent: EventEmitter<any> = new EventEmitter();
  @ViewChildren('textfield') textfields: QueryList<any>;

  public form: FormGroup;
  private cancelText: string;
  private translateSub: Subscription;

  constructor(private formQuestionService: FormQuestionService,
              private elementRef: ElementRef,
              private translate: TranslateService,
              private renderer: Renderer) {}

  ngOnInit() {
    this.translateSub = this.translate.get([
      'common.cancelText',
      'common.textSave'
    ]).subscribe((resource: Object) => {
      this.cancelText = resource['common.cancelText'];
      this.saveText = this.saveText ? this.saveText : resource['common.textSave'];
    });
    this.setForm(this.formValues);
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
  }

  public setForm(formValues) {
    this.form = this.formQuestionService.buildFormGroup(formValues);
  }

  public getValue(): any {
    return this.form && this.form.value;
  }

  public isValid(): boolean {
    return this.form && this.form.valid;
  }

  public getForm() {
    return this.form;
  }

  public patchValue(value: any): void {
    if (this.form) {
      this.form.patchValue(value);
    }
  }

  public cancel(): void {
    if (this.form) {
      this.form.reset();
    }
    this.onCancelEvent.emit();
  }

  public getFormControl(name: string) {
    return this.form && this.form.controls[name];
  }

  public hideElement(name: string): void {
    this.setFormValue(name, 'hidden', true);
  }

  public showElement(name: string): void {
    this.setFormValue(name, 'hidden', false);
  }

  public setFormValue(name: string, key: string, setValue: any): void {
    let idx: number = this.formValues.findIndex((item: RegistrationFormQuestion) => {
      return name === item.key;
    });
    if (idx !== -1) {
      this.formValues[idx][key] = setValue;
    }
  }

  public disableFormControl(name: string): void {
    this.getFormControl(name).disable();
  }

  public enableFormControl(name: string): void {
    this.getFormControl(name).enable();
  }

  public setFormControlValidators(name: string, validators: Array<any>) {
    let formControl = this.getFormControl(name);

    if (formControl !== undefined) {
      formControl.setValidators(Validators.compose(validators));
    }
  }

  public setDropdownOptions(itemsArr: any, key: string, value: string) {
    if (Array.isArray(this.formValues) && key && value && Array.isArray(itemsArr)) {
      for (let i = 0; this.formValues.length; i++) {
        if (this.formValues[i].key === key && this.formValues[i].controlType === 'dropdown') {
          this.formValues[i].options = this.configureDropdownOptions(itemsArr, key, value);
          break;
        }
      }
    }
  }

  private disableToolTip(control: FormControl): boolean {
    return (control.valid && control.touched) ? true : (!(!control.valid && control.touched));
  }

  private configureDropdownOptions(itemsArr, key: string, value: string) {
    let optionsArr = [];
    if (itemsArr && itemsArr.length > 0) {
      for (const item of itemsArr) {
        optionsArr.push({
          label: item[key],
          value: item[value]
        });
      }
    }
    return optionsArr;
  }

  private onSubmit() {
    this.onSubmitEvent.emit(this.getValue());
  }

  private dependenciesValid(item: RegistrationFormQuestion): boolean {
    let me = this, idx, deps = item.dependencies;
    if (deps) {
      return deps.findIndex(function (dep) {
        let dependOnValue =  me.form.controls[dep.dependOn.key].value;
        return dep.value !== dependOnValue;
      }) === -1;
    }
    return true;
  }

  private idWithPrefix(item: RegistrationFormQuestion): string {
    return (this.idPrefix || '') + item.key;
  }

  private rowKey(item: RegistrationFormQuestion): string {
    return 'basic-dynamic-form-row-key-' + this.idWithPrefix(item);
  }

  private onChange(item: RegistrationFormQuestion): void {
    let me = this;
    if (item && Array.isArray(me.formValues)) {
      me.formValues.forEach(function(entry: RegistrationFormQuestion) {
        let target, element;
        if (entry && Array.isArray(entry.dependencies)) {
          target = entry.dependencies.find(function (dep) {
            return item === dep.dependOn;
          });
          if (target) {
            element = jQuery('#' + me.rowKey(entry));
            if (element) {
              if (me.dependenciesValid(entry))
                element.removeClass('hidden');
              else
                element.addClass('hidden');
            }
          }
        }
      });
    }
  }
}
