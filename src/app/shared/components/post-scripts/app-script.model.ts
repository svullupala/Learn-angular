import {JsonObject, JsonProperty} from 'json2typescript/index';
import { HasPersistentJson } from 'core';
import {HrefNameModel} from './href-name.model';
import {HrefArgsMetadataModel} from './href-args-metadata.model';

@JsonObject
export class AppScriptModel implements HasPersistentJson {

  @JsonProperty('appserver', HrefNameModel, true)
  public appserver: HrefNameModel = new HrefNameModel();

  @JsonProperty('script', HrefArgsMetadataModel, true)
  public script: HrefArgsMetadataModel = new HrefArgsMetadataModel();

  getPersistentJson() {
    return this.appserver && this.script ? {
      appserver: this.appserver.getPersistentJson(),
      script: this.script.getPersistentJson()
    } : null;
  }
}
