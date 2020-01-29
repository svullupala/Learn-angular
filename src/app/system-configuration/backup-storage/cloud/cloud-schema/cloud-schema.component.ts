import {
  Component, OnInit, Input, ViewChild, OnChanges, SimpleChanges, OnDestroy, EventEmitter, Output
} from '@angular/core';
import { CloudSchemaModel } from '../cloud-schema.model';
import { KeySelectorComponent } from '../../../../shared/components/key-selector/key-selector.component';
import { KeySelectModel } from '../../../../shared/components/key-selector/key-select.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CloudParameterModel } from '../cloud-parameter.model';
import { CloudModel } from 'cloud/cloud.model';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'cloud-schema',
  templateUrl: './cloud-schema.component.html',
})
export class CloudSchemaComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(KeySelectorComponent) keySelector: KeySelectorComponent;
  @Input() model: CloudSchemaModel;
  @Input() isAzure: boolean = false;
  @Input() credentialWarningText: string = undefined;
  @Input() hiddenParams: string[] = [];
  @Output() formValueChangesEvent: EventEmitter<object> = new EventEmitter<object>();
  private subs: Subject<void> = new Subject<void>();
  private parameters: Array<CloudParameterModel>;
  private keySelectModel: KeySelectModel;
  private form: FormGroup;
  private showWarning: boolean = false;

  constructor() {}

  ngOnInit() {
    let me = this;
    me.keySelectModel = me.keySelectModel || new KeySelectModel();
    me.form = new FormGroup({});
  }

  ngOnDestroy() {
    this.cleanUp();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && this.model) {
      this.parameters = this.model.getParameters().filter((param) => { 
        return this.hiddenParams.indexOf(param.name) == -1;
      });
      this.setSchemaForm();
    }
  }

  public setSchemaForm(): void {
    let params: Array<CloudParameterModel> = this.parameters,
      defaultVal: any;
    if (params && params.length > 0) {
      this.form = new FormGroup({});
      params.forEach((param: CloudParameterModel) => {
        defaultVal = param.type === 'integer' ? Number(param.defaultValue) : param.defaultValue;
        this.form.addControl(param.name, new FormControl(param.name));
        param.value = defaultVal;
        if (param.required) {
          this.form.controls[param.name].setValidators([Validators.minLength(1), Validators.required]);
        }
      });
      this.form.valueChanges.takeUntil(this.subs).subscribe(
        (values: object) => {
          this.showWarning = (values['endpoint'] && typeof values['endpoint'] === 'string' && values['endpoint'].endsWith('appdomain.com')) ? true : false;
          this.formValueChangesEvent.emit(values);
        }
      );
    }
  }

  public updateSchemaForm(cloud: CloudModel): void {
    let params: Array<CloudParameterModel> = this.parameters;
    this.reset();
    if (!params) {
      this.parameters = this.model && this.model.getParameters()
        .filter((param) => { return param.name !== 'accessKey'; });
      params = this.parameters || [];
    }
    params.forEach((param: CloudParameterModel) => {
      param.name === 'name'
        ? (param.value = cloud.name)
        : (param.value = cloud.properties && cloud.properties[param.name]);
      this.form.controls[param.name].setValue(param.value);
      if (['port', 'hostname', 'endpoint', 'region'].indexOf(param.name) !== -1 ) {
        this.form.controls[param.name].disable();
      }
    });
  }

  public getKeyModel(): KeySelectModel {
    return this.keySelector && this.keySelector.getValue();
  }

  public setKeyModel(href: string): void {
    if (this.keySelector)
      this.keySelector.setValue(href);
  }

  public resetKeyModel(): void {
    this.keySelectModel = new KeySelectModel();
    if (this.keySelector)
      this.keySelector.reset();
  }

  public refreshKeys(): void {
    if (this.keySelector) {
      this.keySelector.loadKeys();
    }
  }

  public isKeyValid(): boolean {
    return this.keySelector && this.keySelector.isValid();
  }

  public isValid(): boolean {
    // We do this because the form controls are also disabled during edit of the schema form.
    // The expectation that these fields are filled and they are not editable.
    if (this.form.status === 'DISABLED')
      return true;
    return this.form && this.form.valid;
  }

  public reset(): void {
    if (this.form) {
      this.resetToDefaultFormValue();
      this.form.enable();
    }
  }
  private resetToDefaultFormValue(): void {
    let params: Array<CloudParameterModel> = this.parameters || [],
      defaultVal: any;
    if (params && params.length > 0) {
      params.forEach((param: CloudParameterModel) => {
        defaultVal = param.type === 'integer' ? Number(param.defaultValue) : param.defaultValue;
        param.value = Object.assign(defaultVal);
        if (this.form.controls[param.name]) {
          this.form.controls[param.name].reset(param.value);
        }
      });
    }
  }

  private cleanUp(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private checkForControlValidity(control: FormControl): boolean {
    return control && control.valid && control.touched;
  }

  private checkForControlError(control: FormControl): boolean {
    return control && !control.valid && control.touched;
  }
}


