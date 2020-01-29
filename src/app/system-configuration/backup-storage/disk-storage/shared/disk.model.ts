import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class DiskModel extends BaseModel {

  @JsonProperty('name', String)
  public name: string = undefined;

  @JsonProperty('model', String)
  public model: string = '1000';

  @JsonProperty('size', Number, true)
  public size: number = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('resourceType', String, true)
  public resourceType: string = undefined;

  @JsonProperty('vendor', String, true)
  public vendor: string = undefined;

  @JsonProperty('uuid', String, true)
  public uuid: string = undefined;

  @JsonProperty('selected', Boolean, true)
  public selected: boolean = false;

  @JsonProperty('usedAs', String, true) // probably don't need this since unused disks return from api directly
  public usedAs: string = undefined;

}
