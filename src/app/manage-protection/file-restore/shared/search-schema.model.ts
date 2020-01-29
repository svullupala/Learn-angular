import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class SearchSchemaFilterEntryModel {

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('allowDecimals', Boolean, true)
  public allowDecimals: boolean = false;

  @JsonProperty('decimalPrecision', undefined, true)
  public decimalPrecision: any = undefined;

  @JsonProperty('array', Boolean, true)
  public array: boolean = false;

  @JsonProperty('readOnly', Boolean, true)
  public readOnly: boolean = false;

  @JsonProperty('allowRange', Boolean, true)
  public allowRange: boolean = false;

  @JsonProperty('required', Boolean, true)
  public required: boolean = true;

  @JsonProperty('promptText', String, true)
  public promptText: string = undefined;

  @JsonProperty('helpText', String, true)
  public helpText: string = undefined;

  @JsonProperty('unit', String, true)
  public unit: string = undefined;

  @JsonProperty('minValue', undefined, true)
  public minValue: any = undefined;

  @JsonProperty('maxValue', undefined, true)
  public maxValue: any = undefined;

  @JsonProperty('incrementValue', undefined, true)
  public incrementValue: any = undefined;

  @JsonProperty('unitText', String, true)
  public unitText: string = undefined;
}

@JsonObject
export class SearchSchemaModel extends BaseModel {

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('catalogProvider', String, true)
  public catalogProvider: string = undefined;

  @JsonProperty('catalogProviderName', String, true)
  public catalogProviderName: string = undefined;

  @JsonProperty('documentTypeName', String, true)
  public documentTypeName: string = undefined;

  @JsonProperty('filter', Object, true)
  public filter: { [key: string]: SearchSchemaFilterEntryModel } = undefined;

}
