import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {ActiveCloneModel} from './activeclone.model';

@JsonObject
export class ActiveClonesModel extends DatasetModel<ActiveCloneModel> {

  @JsonProperty('jobs', [ActiveCloneModel])
  public jobs: Array<ActiveCloneModel> = [];

  protected getRecords(): Array<ActiveCloneModel> {
    return this.jobs;
  }
}
