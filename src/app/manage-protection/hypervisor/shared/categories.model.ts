import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {CategoryModel} from './category.model';

@JsonObject
export class CategoriesModel extends DatasetModel<CategoryModel> {

  @JsonProperty('categories', [CategoryModel])
  public categories: Array<CategoryModel> = [];

  protected getRecords(): Array<CategoryModel> {
    return this.categories;
  }
}
