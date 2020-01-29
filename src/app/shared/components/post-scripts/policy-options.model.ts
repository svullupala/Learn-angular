import {JsonObject, JsonProperty} from 'json2typescript/index';
import { HasPersistentJson } from 'core';

@JsonObject
export class PolicyOptionsModel implements HasPersistentJson {

  @JsonProperty('excluderesources', String, true)
  public excluderesources: string = '';

  @JsonProperty('forcebaseresources', String, true)
  public forcebaseresources: string = '';

  @JsonProperty('protectionInventoryWaitTimeout', Number, true)
  public protectionInventoryWaitTimeout: number = 10;

  @JsonProperty('runInventory', Boolean, true)
  public runInventory: boolean = false;

  public isValid(): boolean {
    if (this.runInventory === false) {
      return true;
    }

    if ((this.protectionInventoryWaitTimeout > 0 && this.protectionInventoryWaitTimeout <= 60)
        || (this.protectionInventoryWaitTimeout === undefined)) {
      return true;
    }

    return false;
  }

  getPersistentJson() {
    return {
      excluderesources: this.excluderesources,
      forcebaseresources: this.forcebaseresources,
      protectionInventoryWaitTimeout: this.protectionInventoryWaitTimeout,
      runInventory: this.runInventory
    };
  }
}
