import {JsonObject, JsonProperty} from 'json2typescript';
import { NvPairModel } from 'shared/models/nvpair.model';

@JsonObject
export class CloudParameterNvPairModel extends NvPairModel {

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
export class CloudParameterModel  {

  @JsonProperty('defaultValue', undefined, true)
  public defaultValue: any = undefined;

  @JsonProperty('required', Boolean, true)
  public required: boolean = true;

  @JsonProperty('promptText', String, true)
  public promptText: string = undefined;

  @JsonProperty('allowMultipleValues', Boolean, true)
  public allowMultipleValues: boolean = false;

  @JsonProperty('values', [CloudParameterNvPairModel], true)
  public values: Array<CloudParameterNvPairModel> = [];

  @JsonProperty('type', String, true)
  public type: string = '';

  @JsonProperty('name', String, true)
  public name: string = '';

  public value: any;
}
