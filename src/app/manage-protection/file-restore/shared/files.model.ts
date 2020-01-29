import {JsonObject, JsonProperty} from 'json2typescript';
import {FileModel} from './file.model';
import {SearchResultsModel} from './search-results.model';

@JsonObject
export class FilesModel extends SearchResultsModel<FileModel> {

  @JsonProperty('results', [FileModel])
  public files: Array<FileModel> = [];

  protected getRecords(): Array<FileModel> {
    return this.files;
  }
}
