import { JsonConvert, JsonObject, JsonProperty } from 'json2typescript';
import { DatasetModel, HasAPI } from 'shared/models/dataset.model';
import { ReportModel } from './report.model';
import { BaseModel } from 'shared/models/base.model';
import { NodeService, SessionService } from 'core';

@JsonObject
export class ReportsModel extends DatasetModel<ReportModel> implements HasAPI {
  @JsonProperty('reports', [ReportModel])
  public reports: Array<ReportModel> = [];

  protected getRecords(): Array<ReportModel> {
    return this.reports;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/report';
  }
}

@JsonObject
export class ReportsModelNgp extends BaseModel {
  @JsonProperty('reports', [ReportModel])
  public reports: Array<ReportModel> = [];

  public static getReports(proxy: NodeService, filters?) {
    const userId = SessionService.getInstance().getUserId();
    return proxy
      .getAll('ngp/report?userId=' + userId, filters)
      .map(dataset => JsonConvert.deserializeObject(dataset.response[0], ReportsModelNgp));
  }
}
