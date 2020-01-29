import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {JobSessionModel} from './job-session.model';

@JsonObject
export class JobSessionsModel extends DatasetModel<JobSessionModel> implements HasAPI {

  @JsonProperty('sessions', [JobSessionModel])
  public sessions: Array<JobSessionModel> = [];

  public getRecords(): Array<JobSessionModel> {
    return this.sessions;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/jobsession';
  }
}
