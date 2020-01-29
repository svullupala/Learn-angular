import {JsonObject, JsonProperty} from 'json2typescript';
import {SlapolicyModel} from './slapolicy.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class SlapoliciesModel extends DatasetModel<SlapolicyModel> {

  @JsonProperty('slapolicies', [SlapolicyModel])
  public slapolicies: Array<SlapolicyModel> = [];

  protected getRecords(): Array<SlapolicyModel> {
    return this.slapolicies;
  }
}
