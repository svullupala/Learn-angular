import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';

import { DatasetModel } from 'shared/models/dataset.model';
import { AppServerModel } from './appserver.model';

@JsonObject
export class AppServersModel extends DatasetModel<AppServerModel> {

  @JsonProperty('appservers', [AppServerModel])
  public appservers: Array<AppServerModel> = [];

  public getRecords(): Array<AppServerModel> {
    return this.appservers;
  }

  api(): string {
    return AppServerModel.CORE_APP_SERVER_API_ENDPOINT;
  }
}
