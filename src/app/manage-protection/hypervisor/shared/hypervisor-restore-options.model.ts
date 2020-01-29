import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class HypervisorRestoreOptionsModel {

  @JsonProperty('poweron', Boolean, true)
  public poweron: boolean = false;

  @JsonProperty('allowvmoverwrite', Boolean, true)
  public allowvmoverwrite: boolean = false;

  @JsonProperty('continueonerror', Boolean, true)
  public continueonerror: boolean = true;

  @JsonProperty('autocleanup', Boolean, true)
  public autocleanup: boolean = true;

  @JsonProperty('allowsessoverwrite', Boolean, true)
  public allowsessoverwrite: boolean = true;

  @JsonProperty('restorevmtag', Boolean, true)
  public restorevmtag: boolean = undefined;

  @JsonProperty('mode', String, true)
  public mode: string = 'test';

  @JsonProperty('vmscripts', Boolean, true)
  public vmscripts: boolean = false;

  @JsonProperty('protocolpriority', String, true)
  public protocolpriority: string = 'iSCSI';

  @JsonProperty('vmNameSuffix', String, true)
  public vmNameSuffix: string = undefined;

  @JsonProperty('vmNamePrefix', String, true)
  public vmNamePrefix: string = undefined;

  @JsonProperty('IR', Boolean, true)
  public IR: boolean = undefined;

  @JsonProperty('streaming', Boolean, true)
  public streaming: boolean = false;

  json(): Object {
    let me = this;
    return {
      poweron: me.poweron,
      allowvmoverwrite: me.allowvmoverwrite,
      continueonerror: me.continueonerror,
      autocleanup: me.autocleanup,
      allowsessoverwrite: me.allowsessoverwrite,
      restorevmtag: me.restorevmtag,
      vmNameSuffix: me.vmNameSuffix,
      vmNamePrefix: me.vmNamePrefix,
      mode: me.mode,
      vmscripts: me.vmscripts,
      protocolpriority: me.protocolpriority,
      IR: me.IR,
      streaming: me.streaming
    };
  }
}
