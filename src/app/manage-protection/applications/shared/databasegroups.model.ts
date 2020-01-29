import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';

import { DatasetModel } from 'shared/models/dataset.model';
import { DatabaseGroupModel } from './databasegroup.model';

@JsonObject
export class DatabaseGroupsModel extends DatasetModel<DatabaseGroupModel> {

  public static DATABASEGROUP_API_ENDPOINT: string = 'api/application/{0}/databasegroup?from={1}';

  @JsonProperty('databasegroups', [DatabaseGroupModel])
  public databasegroups: Array<DatabaseGroupModel> = [];


  public getRecords(): Array<DatabaseGroupModel> {
    return this.databasegroups;
  }
}
