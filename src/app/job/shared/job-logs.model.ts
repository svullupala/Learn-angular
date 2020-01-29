import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {JobLogModel} from './job-log.model';

@JsonObject
export class JobLogsModel extends DatasetModel<JobLogModel> implements HasAPI {

  @JsonProperty('logs', [JobLogModel])
  public logs: Array<JobLogModel> = [];

  protected getRecords(): Array<JobLogModel> {
    return this.logs;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/log/job';
  }
}
