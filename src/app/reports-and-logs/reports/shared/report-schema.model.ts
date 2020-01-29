import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {ReportParameterModel} from './report-parameter.model';


@JsonObject
export class ReportSchemaModel extends BaseModel {

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('parameter', Object, true)
  public parameter: Object = undefined;

  getParameterItem(key: string): ReportParameterModel {
    let me = this,
      item;
    try {
      item = JsonConvert.deserializeObject(me.parameter[key], ReportParameterModel);
    }
    catch (e) {
      item = undefined;
    }
    return item;
  }

  setParameterItem(key: string, item: ReportParameterModel): void {
    if (this.parameter)
      this.parameter[key] = item.schemaJson();
  }

}
