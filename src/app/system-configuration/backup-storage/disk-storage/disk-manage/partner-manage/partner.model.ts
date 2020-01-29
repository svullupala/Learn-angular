import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class PartnerModel extends BaseModel {

  @JsonProperty('address', String)
  public address: string = undefined;

  @JsonProperty('resourceType', String)
  public resourceType: string = undefined;

  @JsonProperty('storageId', String)
  public storageId: string = undefined;

  @JsonProperty('siteId', String)
  public siteId: string = undefined;

  @JsonProperty('creationTime', Number)
  public creationTime: number = undefined;

  @JsonProperty('updatedTime', Number)
  public updatedTime: number = undefined;

  public getPartnerPostBody(partnerId: string) {
    return { 'partnerStorageId': partnerId };
  }
}
