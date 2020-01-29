import {JsonObject, JsonProperty} from 'json2typescript';
import {ReportInstanceModel} from './report-instance.model';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';

@JsonObject
export class ReportInstancesModel extends DatasetModel<ReportInstanceModel> implements HasAPI {

  @JsonProperty('reportInstances', [ReportInstanceModel])
  public reportInstances: Array<ReportInstanceModel> = [];

  protected getRecords(): Array<ReportInstanceModel> {
    return this.reportInstances;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/reportInstance';
  }
}
