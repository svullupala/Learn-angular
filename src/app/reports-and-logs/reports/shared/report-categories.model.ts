import {JsonObject, JsonProperty} from 'json2typescript';
import {ReportCategoryModel} from './report-category.model';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';

@JsonObject
export class ReportCategoriesModel extends DatasetModel<ReportCategoryModel> implements HasAPI {

  @JsonProperty('categories', [ReportCategoryModel])
  public categories: Array<ReportCategoryModel> = [];

  protected getRecords(): Array<ReportCategoryModel> {
    return this.categories;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/endeavour/report/categories';
  }
}
