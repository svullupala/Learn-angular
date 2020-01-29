import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {CatalogModel} from './catalog.model';

@JsonObject
export abstract class CatalogsModel<T extends CatalogModel> extends DatasetModel<T> implements HasAPI {

  @JsonProperty('indexSize', Number, true)
  public indexSize: number = 0;

  // Temporarily assume that "hits" is an equivalent of "total".
  // TODO: Change it when Global File Search API contract has other explicit definition.
  @JsonProperty('hits', Number, true)
  public total: number = 0;

  @JsonProperty('searchTime', Number, true)
  public searchTime: number = 0;

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/search';
  }
}
