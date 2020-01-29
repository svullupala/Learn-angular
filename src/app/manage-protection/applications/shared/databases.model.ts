import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';

import { DatasetModel } from 'shared/models/dataset.model';
import { DatabaseModel } from './database.model';

@JsonObject
export class DatabasesModel extends DatasetModel<DatabaseModel> {

  @JsonProperty('databases', [DatabaseModel])
  public databases: Array<DatabaseModel> = [];

  public getRecords(): Array<DatabaseModel> {
    return this.databases;
  }
}
