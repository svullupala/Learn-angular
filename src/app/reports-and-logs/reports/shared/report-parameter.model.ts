import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {NvPairModel} from 'shared/models/nvpair.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {HasProxy, RestService} from 'core';
import {isNumber} from 'util';

@JsonObject
export class ReportParameterNvPairModel extends NvPairModel implements HasProxy {

  proxy: RestService;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('value', undefined, true)
  public value: any = undefined;

  constructor(name?: string, value?: any) {
    super(name || '', value || '');
  }
}

@JsonObject
export class ReportParameterValuesModel extends DatasetModel<ReportParameterNvPairModel> {

  @JsonProperty('values', [ReportParameterNvPairModel])
  public values: Array<ReportParameterNvPairModel> = [];

  protected getRecords(): Array<ReportParameterNvPairModel> {
    return this.values;
  }
}

@JsonObject
export class ReportParameterModel extends BaseModel {

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

  @JsonProperty('dependencies', [undefined], true)
  public dependencies: any[] = undefined;

  @JsonProperty('selectAllValue', String, true)
  public selectAllValue: string = undefined;

  @JsonProperty('allowMultipleValues', Boolean, true)
  public allowMultipleValues: boolean = false;

  @JsonProperty('values', [ReportParameterNvPairModel], true)
  public values: Array<ReportParameterNvPairModel> = [];

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

  public value: any = undefined;

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
}
