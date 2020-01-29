import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {ApplicationContentModel} from './application-content.model';

@JsonObject
export class ApplicationContentsModel extends DatasetModel<ApplicationContentModel> {

  @JsonProperty('contents', [ApplicationContentModel])
  public contents: Array<ApplicationContentModel> = [];

  protected getRecords(): Array<ApplicationContentModel> {
    return this.contents;
  }
}
