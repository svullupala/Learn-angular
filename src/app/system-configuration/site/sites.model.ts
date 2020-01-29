import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {SiteModel} from './site.model';

@JsonObject
export class SitesModel extends DatasetModel<SiteModel> implements HasAPI {

  @JsonProperty('sites', [SiteModel])
  public sites: Array<SiteModel> = [];

  protected getRecords(): Array<SiteModel> {
    return this.sites;
  }


  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/site';
  }
}
