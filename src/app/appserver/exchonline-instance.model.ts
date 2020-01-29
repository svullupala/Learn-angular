import {JsonObject, JsonProperty} from 'json2typescript';
import {JsonConvert} from 'json2typescript/index';
import {HasPersistentJson} from 'core';

JsonConvert.ignorePrimitiveChecks = true;

@JsonObject
export class ExchOnlineInstanceModel implements HasPersistentJson {

  @JsonProperty('name', String, true)
  public name: string = '';

  @JsonProperty('keytype', String, true)
  public keytype: string = 'exch_key';

  @JsonProperty('tenant', String, true)
  public tenant: string = '';

  @JsonProperty('tenantID', String, true)
  public tenantID: string = '';

  @JsonProperty('clientID', String, true)
  public clientID: string = '';

  @JsonProperty('clientSecret', String, true)
  public clientSecret: string = '';

  public getPersistentJson(): object {
    return {
      name: this.name,
      keytype: this.keytype,
      tenant: this.tenant,
      tenantID: this.tenantID,
      clientID: this.clientID,
      clientSecret: this.clientSecret
    };
  }
}
