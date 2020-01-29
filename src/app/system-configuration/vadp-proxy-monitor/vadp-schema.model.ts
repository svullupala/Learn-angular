import {JsonObject, JsonProperty} from 'json2typescript';
import {VadpParameterModel} from './vadp-parameter.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class VadpSchemaModel extends DatasetModel<VadpParameterModel> {

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('options', [VadpParameterModel])
  public options: Array<VadpParameterModel> = [];

  protected getRecords(): Array<VadpParameterModel> {
    return this.options;
  }
}
