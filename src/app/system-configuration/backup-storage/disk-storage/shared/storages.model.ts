import {JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {StorageModel} from './storage.model';

@JsonObject
export class StoragesModel extends DatasetModel<StorageModel> implements HasAPI {

  @JsonProperty('storages', [StorageModel])
  public storages: Array<StorageModel> = [];

  protected getRecords(): Array<StorageModel> {
    return this.storages;
  }

  public contains(storage: StorageModel): boolean {
    for (let i = 0; i < this.storages.length; i++)  {
      if (this.storages[i].id === storage.id) {
        return true;
      }
    }

    return false;
  }

  public updateAll(storages: StorageModel[]) {
    for (let i = 0; i < storages.length; i++) {
      if (!this.update(storages[i])) {
        this.storages.push(storages[i]);
      }
    }
  }

  public update(storage: StorageModel): boolean {
    for (let i = 0; i < this.storages.length; i++) {
      if (this.storages[i].id === storage.id) {
        this.storages[i] = storage;
        return true;
      }
    }

    return false;
  }


  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/storage';
  }
}
