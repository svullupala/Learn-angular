import { JsonObject, JsonProperty } from 'json2typescript';
import {HateoasModel} from 'shared/models/hateoas.model';

@JsonObject
export class LicenseModel extends HateoasModel {

  @JsonProperty('expiryDate', Number, true)
  public expiryDate: number = 0;

  @JsonProperty('expireAfterNumberOfDays', Number, true)
  public expireAfterNumberOfDays = 0;

  @JsonProperty('licenseType', String, true)
  public licenseType: string = '';

  @JsonProperty('licenseVersion', String, true)
  public licenseVersion: string = '';

  @JsonProperty('inCompliance', Boolean, true)
  public inCompliance: boolean = undefined;

  @JsonProperty('complianceMessage', String, true)
  public complianceMessage: string = undefined;

  public isTrial(): boolean {
    return this.licenseType === 'TRIAL';
  }

  public getExpirationDate(): string {
    return this.expiryDate && new Date(this.expiryDate).toDateString();
  }
}
