import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {KeyModel} from './key.model';

@JsonObject
export class KeysModel extends DatasetModel<KeyModel> implements HasAPI {

  @JsonProperty('keys', [KeyModel])
  public keys: Array<KeyModel> = [];

  public getRecords(): Array<KeyModel> {
    return this.keys;
  }

  public api(): string {
    return 'api/identity/key';
  }
}
