import { JsonObject, JsonProperty } from 'json2typescript';
import {ApplicationVersionModel, VersionModel} from './version.model';
import { DatasetModel } from 'shared/models/dataset.model';

@JsonObject
export class VersionsModel extends DatasetModel<VersionModel> {
  @JsonProperty('copies', [VersionModel])
  public versions: Array<VersionModel> = [];

  protected getRecords(): Array<VersionModel> {
    return this.versions;
  }
}

@JsonObject
export class ApplicationVersionsModel extends DatasetModel<ApplicationVersionModel> {
  @JsonProperty('versions', [ApplicationVersionModel])
  public versions: Array<ApplicationVersionModel> = [];

  protected getRecords(): Array<ApplicationVersionModel> {
    return this.versions;
  }
}
