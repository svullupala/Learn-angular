import {JsonObject, JsonProperty} from 'json2typescript/index';
import { HasPersistentJson } from 'core';

@JsonObject
export class HrefNameModel implements HasPersistentJson {
  @JsonProperty('href', String, true)
  public href: string = '';

  @JsonProperty('name', String, true)
  public name: string = '';

  getPersistentJson() {
    return {
      href: this.href,
      name: this.name
    };
  }
}
