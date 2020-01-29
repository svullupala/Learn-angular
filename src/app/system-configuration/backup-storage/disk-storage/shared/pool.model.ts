import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class PoolModel extends BaseModel {

  @JsonProperty('resourceType', String)
  public resourceType: string = undefined;

  @JsonProperty('name', String)
  public name: string = undefined;

  @JsonProperty('id', String)
  public id: string = undefined;

  @JsonProperty('status', String)
  public status: string = undefined;

  @JsonProperty('storageType', String)
  public storageType: string = undefined;

  @JsonProperty('storageId', String)
  public storageId: string = undefined;

  @JsonProperty('storageServerId', String)
  public storageServerId: string = undefined;

  @JsonProperty('diskgroupSize', Number)
  public diskgroupSize: number = undefined;

  @JsonProperty('poolType', String)
  public poolType: string = undefined;

  @JsonProperty('sizeTotal', Number, true) // might be unused, if it's added
  public sizeTotal: number = undefined;

  @JsonProperty('sizeFree', Number, true)
  public sizeFree: number = undefined;

  @JsonProperty('sizeUsed', Number, true)
  public sizeUsed: number = undefined;

  @JsonProperty('compression', Boolean, true)
  public compression: boolean = false;

  @JsonProperty('compressionRatio', String, true)
  public compressionRatio: string = '1.00';

  @JsonProperty('deduplication', Boolean, true)
  public deduplication: boolean = false;

  @JsonProperty('deduplicationRatio', String, true)
  public deduplicationRatio: string = '1.00';

  // @JsonProperty('maxStreams', Number, true)
  // public maxStreams: number = null;

  // @JsonProperty('syncWrite', Boolean, true)
  // public syncWrite: boolean = true;

  @JsonProperty('encryption', Object, true)
  public encryption: Object = undefined;

  // public selectedStreamValue = -1;

  // public streamOptions: Array<Object> = [
  //   { id: -1, name: 'storage.textUnlimited' },
  //   { id: 0, name: 'storage.textPause' },
  //   { id: 1, name: 'storage.textLimit' }
  // ];

  // public streamValue = 1000;
  
  public init(): void {
    // '==' checks for both null and undefined. 
    // if (this.maxStreams == null || this.selectedStreamValue == null) {
    //   return;
    // }

    // if (this.maxStreams > 0) {
    //   this.selectedStreamValue = 1;
    //   this.streamValue = this.maxStreams;
    // } else {
    //   this.selectedStreamValue = this.maxStreams;
    // }
  }

  public getManagementOptionsJson(): Object {
    return {
      compression: this.compression,
      deduplication: this.deduplication,
      // maxStreams: (this.selectedStreamValue === 1) ? this.streamValue : this.selectedStreamValue
      // syncWrite: this.syncWrite
    };
  }
}
