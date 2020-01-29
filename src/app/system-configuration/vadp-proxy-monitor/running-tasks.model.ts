import { JsonObject, JsonProperty } from 'json2typescript/index';
import { JobModel } from 'job/shared/job.model';
import { VadpDiskModel } from './vadp-disk.model';

@JsonObject
export class RunningTasksModel extends JobModel {

  @JsonProperty('jobSessionId', Number, true)
  public jobSessionId: number = 0;

  @JsonProperty('vmName', String, true)
  public vmName: string = '';

  @JsonProperty('disks', [VadpDiskModel], true)
  public disks: Array<VadpDiskModel> = [];
}
