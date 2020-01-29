import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {NvPairModel} from 'shared/models/nvpair.model';
import {DatasetModel} from 'shared/models/dataset.model';
import {HasProxy, RestService} from 'core';
import {isNumber, isObject} from 'util';

@JsonObject
export class JobParameterNvPairModel extends NvPairModel implements HasProxy {

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
export class JobParameterValuesModel extends DatasetModel<JobParameterNvPairModel> {

  @JsonProperty('values', [JobParameterNvPairModel])
  public values: Array<JobParameterNvPairModel> = [];

  protected getRecords(): Array<JobParameterNvPairModel> {
    return this.values;
  }
}

@JsonObject
export class JobParameterModel extends BaseModel {

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

  @JsonProperty('values', [undefined], true)
  public values: Array<JobParameterNvPairModel | any> = [];

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


  public key: string = undefined;
  public value: any = undefined;

  valueContains(pair: JobParameterNvPairModel): boolean {
    let me = this, idx;
    if (me.allowMultipleValues) {
      idx = (me.value || []).findIndex(function(item) {
        if (item instanceof JobParameterNvPairModel)
          return item.value === pair.value;
        else
          return item === pair.value;
      });
      return (idx !== -1);
    } else {
      if (isObject(me.value))
        return me.value.value === pair.value;
      else
        return me.value === pair.value;
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
}
