import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {SmtpModel} from './smtp.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class SmtpsModel extends DatasetModel<SmtpModel> {

  @JsonProperty('smtps', [SmtpModel], true)
  public smtps: Array<SmtpModel> = [];

  public getRecords(): Array<SmtpModel> {
    return this.smtps;
  }
}
