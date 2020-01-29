import {
  Component, OnInit, AfterViewInit, Input, Output, EventEmitter,
  ViewChild, SimpleChanges
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ModalDirective} from 'ngx-bootstrap';
import {VadpParameterDependency, VadpParameterModel, VadpParameterNvPairModel} from '../vadp-parameter.model';
import {VadpSchemaModel} from '../vadp-schema.model';
import {SharedService} from 'shared/shared.service';
import {isArray, isBoolean, isNumber, isObject} from 'util';
import {BooleanPipe} from 'shared/pipes/boolean.pipe';

export interface MultipleSelectItem {
  id: number;
  itemName: string;
  ctx: {
    pair: VadpParameterNvPairModel;
    param: VadpParameterModel;
  };
}

@Component({
  selector: 'vadp-action-schema',
  styleUrls: ['./vadp-action-schema.component.scss'],
  templateUrl: './vadp-action-schema.component.html',
})
export class VadpActionSchemaComponent implements OnInit, AfterViewInit {
  @Input() autoShow: boolean = true;
  @Input() model: VadpSchemaModel;
  @Input() textActionLabel: string;
  @Input() textActionOptions: string;
  @Output() run = new EventEmitter<Array<VadpParameterModel>>();
  @Output() abort = new EventEmitter();

  @ViewChild('modal') modal: ModalDirective;
  private textSelectParamTpl: string;
  private textSave: string;
  private records: Array<VadpParameterModel>;
  private booleanPipe: BooleanPipe;

  constructor(private translate: TranslateService) {
    this.booleanPipe = new BooleanPipe(translate);
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'vadpProxyMonitor.textSelectParamTpl',
      'common.textSave'
    ]).subscribe((resource: Object) => {
      me.textSelectParamTpl = resource['vadpProxyMonitor.textSelectParamTpl'];
      me.textSave = resource['common.textSave'];
      me.textActionLabel = me.textSave;
    });
  }

  ngOnChanges(currentValue: SimpleChanges): void {
    this.textActionLabel = (currentValue && currentValue['textActionLabel']
      && currentValue['textActionLabel'].currentValue) || this.textSave;
  }

  ngAfterViewInit() {
    this.autoShow ? this.show() : this.hide();
  }

  onItemSelect(item: MultipleSelectItem) {
    let me = this, disabled = false, pair = item.ctx.pair, param = item.ctx.param;
    if (pair.value === '(All)') {
      param.metadata['selectedItems'] = [item];

      if (param.allowMultipleValues) {
        param.value = param.value || [];
        param.value.splice(0);
        param.value.push(pair.value);
      } else {
        param.value = pair.value;
      }
    } else {
      if (param.allowMultipleValues) {
        param.value = param.value || [];
        param.value.push(pair.value);
        me.removeItemAll(param);
      } else {
        param.value = pair.value;
      }
    }

    me.stateDependItems(param);
  }

  OnItemDeSelect(item: MultipleSelectItem) {
    let me = this, pair = item.ctx.pair, param = item.ctx.param;
    if (param.allowMultipleValues)
      me.removeValueFromParam(param, pair.value);
    else
      param.value = undefined;

    me.stateDependItems(param);
  }

  public initParams(): void {
    let me = this, params = me.model ? me.model.options : [];
    me.records = params;
    params.forEach(function (param) {
      param.value = me.paramDefaultValue(param);
      me.initParamMetadata(param);
    });
  }

  public setModel(model: VadpSchemaModel): void {
    this.model = model;
  }

  show(): void {
    this.modal.show();
  }

  hide(): void {
    this.modal.hide();
  }

  private stateDependItems(param: VadpParameterModel): void {
    let me = this, dependItems = param.getDependItems(me.records);
    dependItems.forEach(function (di) {
      let dep = di.dependency(), hasSetting = isObject(di.metadata['dropdownSettings']),
        settings = hasSetting ? Object.assign({}, di.metadata['dropdownSettings']) : null;
      if (settings && dep) {
        settings.disabled = !dep.selectedValueExistIn(param);
        di.metadata['dropdownSettings'] = settings;
      }
    });
  }
  /**
   * Remove (All) item from selected items & param value (NOTE: Only for allowMultipleValues mode)
   * @param {VadpParameterModel} param
   */
  private removeItemAll(param: VadpParameterModel): void {
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
   * @param {VadpParameterModel} param
   */
  private removeValueFromParam(param: VadpParameterModel, value: any): void {
    let me = this, paramValue = param.value || [],
      idx = paramValue.findIndex(function (item) {
        return item === value;
      });
    if (idx !== -1)
      paramValue.splice(idx, 1);
  }

  private paramDefaultValue(param: VadpParameterModel): any {
    let me = this, allowMultipleValues = param.allowMultipleValues,
      hasValues = param.values && param.values.length > 0,
      hasDefaultValue = param.defaultValue !== undefined,
      hasSelectedValue = param.selectedValue !== undefined;
    return hasSelectedValue ? param.selectedValue : (
      hasDefaultValue ? param.defaultValue : (
        hasValues ? (allowMultipleValues ? [ param.values[0] ] :  param.values[0]) : undefined )
    );
  }

  private valueLabel(value: any) {
    let label: string = String(value);
    if (isBoolean(value))
      label = this.booleanPipe.transform(value);
    return label;
  }

  private initParamMetadata(param: VadpParameterModel) {
    let me = this, hasValue = param.value !== undefined, hasValues = param.values && param.values.length > 0,
      allowMultipleValues = param.allowMultipleValues,
      dropdownList = [], selectedItems = [], dropdownItem: MultipleSelectItem,
      dropdownSettings = {
        singleSelection: !allowMultipleValues,
        text: SharedService.formatString(me.textSelectParamTpl, param.promptText || param.name),
        enableSearchFilter: false,
        enableCheckAll: false,
        disabled: !param.isAvailable(me.records)
      };
    if (hasValues) {
      param.values.forEach(function (value: VadpParameterNvPairModel | any, index) {
        let item: VadpParameterNvPairModel;
        if (value instanceof VadpParameterNvPairModel) {
          item = value;
        } else if (isObject(value)) {
          item = new VadpParameterNvPairModel(value.name, value.value);
        } else {
          item = new VadpParameterNvPairModel(me.valueLabel(value), value);
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
        let item: VadpParameterNvPairModel;
        if (isObject(value))
          item = new VadpParameterNvPairModel(value.name, value.value);
        else
          item = new VadpParameterNvPairModel(me.valueLabel(value), value);
        dropdownItem = {
          id: index, itemName: item.name,
          ctx: {pair: item, param: param}
        };
        dropdownList.push(dropdownItem);
        selectedItems.push(dropdownItem);
      });
    }

    param.metadata['dropdownList'] = dropdownList;
    param.metadata['selectedItems'] = allowMultipleValues ? selectedItems.sort(function (a, b) {
      return param.selectedValueIndexOf(a.ctx.pair) - param.selectedValueIndexOf(b.ctx.pair);
    }) : selectedItems;
    param.metadata['dropdownSettings'] = dropdownSettings;
  }

  private isValid(): boolean {
    let me = this, params: Array<VadpParameterModel> = me.records || [],
    idx = params.findIndex(function (param) {
      return param.required && param.isAvailable(me.records) && (
        (param.allowMultipleValues && (!param.value || isArray(param.value) && param.value.length < 1)) ||
        (!param.allowMultipleValues && (param.value === undefined || param.value === null || param.value === '')));
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


