import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class StorageSnapshotModel extends BaseModel {

  @JsonProperty('resourceType', String)
  public resourceType: string = undefined;

  @JsonProperty('name', String)
  public name: string = undefined;

  @JsonProperty('primaryKey', String)
  public primaryKey: string = undefined;

  @JsonProperty('storageType', String)
  public storageType: string = undefined;

  @JsonProperty('storageId', String)
  public storageId: string = undefined;

  @JsonProperty('storageServerId', String)
  public storageServerId: string = undefined;

  @JsonProperty('slaPolicyName', String)
  public slaPolicyName: string = undefined;

  @JsonProperty('creationTime', Number)
  public creationTime: number = undefined;

  @JsonProperty('snapshotType', String, true)
  public snapshotType: string = undefined;
}
