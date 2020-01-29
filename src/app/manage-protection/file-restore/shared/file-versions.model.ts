import {JsonObject, JsonProperty} from 'json2typescript';
import {FileVersionModel} from './file-version.model';
import {SearchResultsModel} from './search-results.model';

@JsonObject
export class FileVersionsModel extends SearchResultsModel<FileVersionModel> {

  @JsonProperty('copies', [FileVersionModel])
  public versions: Array<FileVersionModel> = [];

  protected getRecords(): Array<FileVersionModel> {
    return this.versions;
  }
}
