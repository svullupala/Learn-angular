import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {NvPairModel} from 'shared/models/nvpair.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {HasProxy, RestService} from 'core';
import {isNumber, isObject} from 'util';

@JsonObject
export class VadpParameterNvPairModel extends NvPairModel implements HasProxy {

  proxy: RestService;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('value', undefined, true)
  public value: any = undefined;

  constructor(name?: string, value?: any) {
    super(name || '', value || '');
    this.name = name;
    this.value = value;
  }
}

@JsonObject
export class VadpParameterValuesModel extends DatasetModel<VadpParameterNvPairModel> {

  @JsonProperty('values', [VadpParameterNvPairModel])
  public values: Array<VadpParameterNvPairModel> = [];

  protected getRecords(): Array<VadpParameterNvPairModel> {
    return this.values;
  }
}

@JsonObject
export class VadpParameterDependency {

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('selectedValue', [undefined], true)
  public selectedValue: any[] = undefined;

  public selectedValueExistIn(param: VadpParameterModel): boolean {
    let me = this, idx, value = (me.selectedValue && me.selectedValue.length > 0) ? me.selectedValue[0] : null;

    if (param.allowMultipleValues) {
      idx = (param.value || []).findIndex(function(item) {
        if (item instanceof VadpParameterNvPairModel)
          return item.value === value;
        else
          return item === value;
      });
      return idx !== -1;
    } else {
      if (isObject(param.value))
        return param.value.value === value;
      else
        return param.value === value;
    }
  }
}

@JsonObject
export class VadpParameterModel extends BaseModel {

  @JsonProperty('links', Object, true)
  public links: Object = null;

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('unit', String, true)
  public unit: string = undefined;

  @JsonProperty('defaultValue', undefined, true)
  public defaultValue: any = undefined;

  @JsonProperty('readOnly', Boolean, true)
  public readOnly: boolean = false;

  @JsonProperty('required', Boolean, true)
  public required: boolean = true;

  @JsonProperty('array', Boolean, true)
  public array: boolean = false;

  @JsonProperty('allowDecimals', Boolean, true)
  public allowDecimals: boolean = false;

  @JsonProperty('decimalPrecision', Number, true)
  public decimalPrecision: number = 2;

  @JsonProperty('promptText', String, true)
  public promptText: string = undefined;

  @JsonProperty('dependencies', [VadpParameterDependency], true)
  public dependencies: VadpParameterDependency[] = undefined;

  @JsonProperty('selectAllValue', String, true)
  public selectAllValue: string = undefined;

  @JsonProperty('allowMultipleValues', Boolean, true)
  public allowMultipleValues: boolean = false;

  @JsonProperty('values', [VadpParameterNvPairModel], true)
  public values: Array<VadpParameterNvPairModel> = [];

  @JsonProperty('minValue', Number, true)
  public minValue: number = 0;

  @JsonProperty('maxValue', Number, true)
  public maxValue: number = undefined;

  @JsonProperty('incrementValue', Number, true)
  public incrementValue: number = 1;

  @JsonProperty('minLength', Number, true)
  public minLength: number = 0;

  @JsonProperty('maxLength', Number, true)
  public maxLength: number = undefined;

  @JsonProperty('regex', String, true)
  public regex: string = undefined;

  @JsonProperty('maskRe', String, true)
  public maskRe: string = undefined;

  @JsonProperty('selectedValue', undefined, true)
  public selectedValue: any = undefined;

  @JsonProperty('password', Boolean, true)
  public password: boolean = false;

  public get key(): string {
    return this.name;
  }

  public set key(val: string) {
    this.name = val;
  }

  public value: any = undefined;

  valueContains(pair: VadpParameterNvPairModel): boolean {
    let me = this, idx;
    if (me.allowMultipleValues) {
      idx = (me.value || []).findIndex(function(item) {
        if (item instanceof VadpParameterNvPairModel)
          return item.value === pair.value;
        else
          return item === pair.value;
      });
      return (idx !== -1);
    } else {
      if (isObject(me.value))
        return me.value.value === pair.value;
      else
        return me.value == pair.value;
    }
  }

  selectedValueIndexOf(pair: VadpParameterNvPairModel): number {
    let me = this, idx;
    if (me.allowMultipleValues) {
      idx = (me.selectedValue || []).findIndex(function(item) {
        if (item instanceof VadpParameterNvPairModel)
          return item.value === pair.value;
        else
          return item === pair.value;
      });
      return idx;
    } else {
      if (isObject(me.selectedValue))
        return me.selectedValue.value === pair.value ? 0 : -1;
      else
        return me.selectedValue === pair.value ? 0 : -1;
    }
  }

  schemaJson(): Object {
    let me = this;
    return {
      name: me.name,
      type: me.type,
      promptText: me.promptText,
      readOnly: me.readOnly,
      required: me.required,
      array: me.array,
      allowDecimals: me.allowDecimals,
      decimalPrecision: me.decimalPrecision,
      allowMultipleValues: me.allowMultipleValues
    };
  }

  hasMaxValue(): boolean {
    return isNumber(this.maxValue);
  }

  dependency(): VadpParameterDependency {
    let me = this, depend: VadpParameterDependency,
      hasDepends = me.dependencies && me.dependencies.length > 0;
    if (hasDepends)
      depend = me.dependencies[0];
    return depend;
  }

  isAvailable(records: Array<VadpParameterModel>): boolean {
    let me = this, idx: number, depend = me.dependency();

    if (!depend)
      return true;

    idx = (records || []).findIndex(function (item) {
      return item.name === depend.name && depend.selectedValueExistIn(item);
    });
    return idx !== -1;
  }

  getDependItems(records: Array<VadpParameterModel>): Array<VadpParameterModel> {
    let me = this;
    return (records || []).filter(function (item: VadpParameterModel) {
      let depend = item.dependency();
      return depend && depend.name === me.name;
    }) || [];
  }
}
