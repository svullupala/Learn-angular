import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class AppServerVmModel extends BaseModel {

  @JsonProperty('appServerId', String, true)
  public appServerId: string = '';

  @JsonProperty('appServerName', String, true)
  public appServerName: string = '';
}

@JsonObject
export class AppServerVmsModel {

  @JsonProperty('appservervms', [AppServerVmModel])
  public appservervms: Array<AppServerVmModel> = [];
}
