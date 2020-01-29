import {JsonObject, JsonProperty} from 'json2typescript';
import {ReportParameterModel} from './report-parameter.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class ReportParametersModel extends DatasetModel<ReportParameterModel> {

  @JsonProperty('parameters', [ReportParameterModel])
  public parameters: Array<ReportParameterModel> = [];

  protected getRecords(): Array<ReportParameterModel> {
    return this.parameters;
  }
}
