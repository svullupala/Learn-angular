import {JsonObject, JsonProperty} from 'json2typescript';
import {AuditLogModel} from './audit-log.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class AuditLogsModel extends DatasetModel<AuditLogModel> {

  @JsonProperty('logs', [AuditLogModel])
  public logs: Array<AuditLogModel> = [];

  @JsonProperty('page')
  public page: number = undefined;

  @JsonProperty('total')
  public total: number = undefined;

  protected getRecords(): Array<AuditLogModel> {
    return this.logs;
  }
}
