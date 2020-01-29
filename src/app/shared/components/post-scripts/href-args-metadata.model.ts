import {JsonObject, JsonProperty} from 'json2typescript/index';
import { HasPersistentJson } from 'core';

@JsonObject
export class HrefArgsMetadataModel implements HasPersistentJson {

  @JsonProperty('href', String, true)
  public href: string = '';

  @JsonProperty('args', undefined, true)
  public args: Array<any> = [];

  @JsonProperty('metadata', undefined, true)
  public metadata: object = {name: ''};

  getPersistentJson() {
    return {
      href: this.href,
      args: this.args,
      metadata: this.metadata
    };
  }
}
