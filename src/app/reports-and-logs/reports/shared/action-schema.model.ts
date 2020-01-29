import {JsonObject, JsonProperty} from 'json2typescript';
import {HateoasModel} from 'shared/models/hateoas.model';
import {ReportParameterModel} from './report-parameter.model';
import {HasProxy, RestService} from 'core';

@JsonObject
export class ActionSchemaParamValuesModel {
  @JsonProperty('promptText', String, true)
  public promptText: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('objectSchema', Object, true)
  public objectSchema: Object = undefined;

  getObjectSchemaItem(key: string): ReportParameterModel {
    return this.objectSchema ? this.objectSchema[key] : undefined;
  }

  setObjectSchemaItem(key: string, item: ReportParameterModel): void {
    if (this.objectSchema)
      this.objectSchema[key] = item;
  }
}

@JsonObject
export class ActionSchemaParameterModel {
  @JsonProperty('promptText', String, true)
  public promptText: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('paramValues', ActionSchemaParamValuesModel, true)
  public paramValues: ActionSchemaParamValuesModel = undefined;
}

@JsonObject
export class ActionSchemaModel extends HateoasModel implements HasProxy {
  proxy: RestService;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('parameter', ActionSchemaParameterModel, true)
  public parameter: ActionSchemaParameterModel = undefined;
}
