import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class ReportInstanceModel extends BaseModel {

  @JsonProperty('reportName', String, true)
  public reportName: string = undefined;

  @JsonProperty('category', String, true)
  public category: string = undefined;

  @JsonProperty('fileDate', Number, true)
  public fileDate: number = undefined;
}
