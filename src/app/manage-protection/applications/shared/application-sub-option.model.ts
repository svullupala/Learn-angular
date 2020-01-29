import { JsonObject, JsonProperty } from 'json2typescript';
import { HasPersistentJson } from 'core';
@JsonObject
export class ApplicationSubOptionModel implements HasPersistentJson {

  @JsonProperty('overwriteExistingDb', Boolean, true)
  public overwriteExistingDb: boolean = false;

  @JsonProperty('maxParallelStreams', Number, true)
  public maxParallelStreams: number = 1;

  @JsonProperty('recoveryType', String, true)
  public recoveryType: string = 'recovery';

  @JsonProperty('databaseMemory', Number, true)
  public databaseMemory: number = 0;

  // @JsonProperty('mountPointRename', String, true)
  // public mountPointRename: string = 'default';
  //
  // @JsonProperty('mountPointPrefix', String, true)
  // public mountPointPrefix: string = '';
  //
  // @JsonProperty('mountPointSuffix', String, true)
  // public mountPointSuffix: string = '';
  //
  // @JsonProperty('mountPointOldSubstring', String, true)
  // public mountPointOldSubstring: string = '';
  //
  // @JsonProperty('mountPointNewSubstring', String, true)
  // public mountPointNewSubstring: string = '';

  @JsonProperty('initParams', String, true)
  public initParams: string = 'source';

  @JsonProperty('initParamsTemplateFile', String, true)
  public initParamsTemplateFile: string = '';

  // @JsonProperty('leaveDbShutDown', Boolean, true)
  // public leaveDbShutDown: boolean = true;
  //
  // @JsonProperty('asmDiskName', String, true)
  // public asmDiskName: string = 'default';
  //
  // @JsonProperty('asmDiskCustomString', String, true)
  // public asmDiskCustomString: string = '';

  public applicationType: string;

  public getPersistentJson(): object {
    let appOptions: object = {
      overwriteExistingDb: this.overwriteExistingDb,
      recoveryType: this.recoveryType
    };
    if (typeof this.maxParallelStreams === 'number') {
      appOptions['maxParallelStreams'] = this.maxParallelStreams;
    }
    if (this.applicationType === 'oracle') {
      appOptions['initParams'] = this.initParams;
      if (this.initParams === 'template') {
        appOptions['initParamsTemplateFile'] = this.initParamsTemplateFile;
      }
    } else if (this.applicationType === 'db2') {
      appOptions['databaseMemory'] = this.databaseMemory;
    }
    return appOptions;
  }
}
