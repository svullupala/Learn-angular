import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';

import { DatasetModel } from 'shared/models/dataset.model';
import { InstanceModel } from './instance.model';

@JsonObject
export class InstancesModel extends DatasetModel<InstanceModel> {

  public static INSTANCE_API_ENDPOINT: string = 'api/application/{0}/instance?from={1}';
  public static APPLICATION_VIEW: string = 'applicationview';
  public static DATABASE_GROUP_VIEW: string = 'databasegroupview';
  public static LABEL_VIEW: string = 'labelview';

  @JsonProperty('instances', [InstanceModel])
  public instances: Array<InstanceModel> = [];

  public getRecords(): Array<InstanceModel> {
    return this.instances;
  }
}
