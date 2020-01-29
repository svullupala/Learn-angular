import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {TagModel} from './tag.model';

@JsonObject
export class TagsModel extends DatasetModel<TagModel> {

  @JsonProperty('tags', [TagModel])
  public tags: Array<TagModel> = [];

  protected getRecords(): Array<TagModel> {
    return this.tags;
  }
}
