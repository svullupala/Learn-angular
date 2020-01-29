import {JsonObject, JsonProperty} from 'json2typescript';
import {PartnerModel} from './partner.model';
import {DatasetModel} from 'shared/models/dataset.model';

@JsonObject
export class PartnersModel extends DatasetModel<PartnerModel> {

  @JsonProperty('partners', [PartnerModel])
  public partners: Array<PartnerModel> = [];

  public getPartnerPostBody(partnerId: string) {
    return { 'partnerStorageId': partnerId };
  }

  protected getRecords(): Array<PartnerModel> {
    return this.partners;
  }
}
