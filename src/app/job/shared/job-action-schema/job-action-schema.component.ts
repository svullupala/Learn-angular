import {
  Component, OnInit, AfterViewInit, Input, Output, EventEmitter,
  ViewChild
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ModalDirective} from 'ngx-bootstrap';
import {AngularMultiSelect} from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import {JobParameterModel, JobParameterNvPairModel} from '../job-parameter.model';
import {JobSchemaModel} from '../job-schema.model';
import {SharedService} from 'shared/shared.service';
import {isArray, isBoolean, isNumber, isObject} from 'util';
import {BooleanPipe} from 'shared/pipes/boolean.pipe';

export interface MultipleSelectItem {
  id: number;
  itemName: string;
  ctx: {
    pair: JobParameterNvPairModel;
    param: JobParameterModel;
  };
}

@Component({
  selector: 'job-action-schema',
  styleUrls: ['./job-action-schema.component.scss'],
  templateUrl: './job-action-schema.component.html',
})
export class JobActionSchemaComponent implements OnInit, AfterViewInit {
  @Input() autoShow: boolean = true;
  @Input() model: JobSchemaModel;
  @Input() textActionOptions: string;
  @Output() run = new EventEmitter<Array<JobParameterModel>>();
  @Output() abort = new EventEmitter();

  @ViewChild('modal') modal: ModalDirective;
  private textSelectParamTpl: string;
  private records: Array<JobParameterModel>;
  private booleanPipe: BooleanPipe;

  constructor(private translate: TranslateService) {
    this.booleanPipe = new BooleanPipe(translate);
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'job.textSelectParamTpl'
    ]).subscribe((resource: Object) => {
      me.textSelectParamTpl = resource['job.textSelectParamTpl'];
    });
    me.initParams();
  }

  ngAfterViewInit() {
    this.autoShow ? this.show() : this.hide();
  }

  onItemSelect(item: MultipleSelectItem, ams: AngularMultiSelect) {
    let me = this, pair = item.ctx.pair, param = item.ctx.param;
    if (pair.value === '(All)') {
      param.metadata['selectedItems'] = [item];

      if (param.allowMultipleValues) {
        param.value = param.value || [];
        param.value.splice(0);
        param.value.push(pair);
      } else {
        param.value = pair;
      }
    } else {
      if (param.allowMultipleValues) {
        param.value = param.value || [];
        param.value.push(pair);
        me.removeItemAll(param);
      } else {
        param.value = pair;
      }
    }
    if (!param.allowMultipleValues)
      ams.closeDropdown();
  }

  OnItemDeSelect(item: MultipleSelectItem, ams: AngularMultiSelect) {
    let me = this, pair = item.ctx.pair, param = item.ctx.param;
    if (param.allowMultipleValues)
      me.removeValueFromParam(param, pair.value);
    else
      param.value = undefined;

    if (!param.allowMultipleValues)
      ams.closeDropdown();
  }

  show(): void {
    this.modal.show();
  }

  hide(): void {
    this.modal.hide();
  }

  /**
   * Remove (All) item from selected items & param value (NOTE: Only for allowMultipleValues mode)
   * @param {JobParameterModel} param
   */
  private removeItemAll(param: JobParameterModel): void {
    let me = this, selectedItems = param.metadata['selectedItems'] || [],
      idx = selectedItems.findIndex(function (item: MultipleSelectItem) {
        return item.ctx.pair.value === '(All)';
      });
    if (idx !== -1)
      selectedItems.splice(idx, 1);

    me.removeValueFromParam(param, '(All)');
  }

  /**
   * Remove a value from the given param (NOTE: Only for allowMultipleValues mode)
   * @param {JobParameterModel} param
   */
  private removeValueFromParam(param: JobParameterModel, value: any): void {
    let me = this, paramValue = param.value || [],
      idx = paramValue.findIndex(function (item) {
        return item === value;
      });
    if (idx !== -1)
      paramValue.splice(idx, 1);
  }

  private paramDefaultValue(param: JobParameterModel): any {
    let me = this,
      hasValues = param.value && param.values.length > 0;
    return hasValues ? param.values[0] : param.defaultValue;
  }

  private initParams(): void {
    let me = this, params = me.model ? me.model.parameterItems : [];
    me.records = params;
    params.forEach(function (param) {
      param.value = me.paramDefaultValue(param);
      me.initParamMetadata(param);
    });
  }

  private valueLabel(value: any) {
    let label: string = String(value);
    if (isBoolean(value))
      label = this.booleanPipe.transform(value);
    return label;
  }

  private initParamMetadata(param: JobParameterModel) {
    let me = this, hasValue = !!param.value, hasValues = param.values && param.values.length > 0,
      allowMultipleValues = param.allowMultipleValues,
      dropdownList = [], selectedItems = [], dropdownItem: MultipleSelectItem,
      dropdownSettings = {
        singleSelection: !allowMultipleValues,
        text: SharedService.formatString(me.textSelectParamTpl, param.promptText || param.name),
        enableSearchFilter: false,
        enableCheckAll: false
      };
    if (hasValues) {
      param.values.forEach(function (value: JobParameterNvPairModel | any, index) {
        let item: JobParameterNvPairModel;
        if (value instanceof JobParameterNvPairModel) {
          item = value;
        } else if (isObject(value)) {
          item = new JobParameterNvPairModel(value.name, value.value);
        } else {
          item = new JobParameterNvPairModel(me.valueLabel(value), value);
        }
        dropdownItem = {id: index, itemName: item.name, ctx: {pair: item, param: param}};
        dropdownList.push(dropdownItem);
        if (hasValue) {
          if (param.valueContains(item))
            selectedItems.push(dropdownItem);
        }
      });
    } else if (hasValue) {
      (allowMultipleValues ? param.value : [param.value]).forEach(function (value: any, index) {
        let item: JobParameterNvPairModel;
        if (isObject(value))
          item = new JobParameterNvPairModel(value.name, value.value);
        else
          item = new JobParameterNvPairModel(me.valueLabel(value), value);
        dropdownItem = {
          id: index, itemName: item.name,
          ctx: {pair: item, param: param}
        };
        dropdownList.push(dropdownItem);
        selectedItems.push(dropdownItem);
      });
    }

    param.metadata['dropdownList'] = dropdownList;
    param.metadata['selectedItems'] = selectedItems;
    param.metadata['dropdownSettings'] = dropdownSettings;
  }

  private isValid(): boolean {
    let me = this, params: Array<JobParameterModel> = me.records || [],
    idx = params.findIndex(function (param) {
      return param.required && (
        (param.allowMultipleValues && (!param.value || isArray(param.value) && param.value.length < 1)) ||
        (!param.allowMultipleValues && (param.value === undefined || param.value === null)));
    });
    return idx === -1;
  }

  private onRunClick(): void {
    this.hide();
    this.run.emit(this.records);
  }

  private onAbort(): void {
    this.hide();
    this.abort.emit();
  }
}


