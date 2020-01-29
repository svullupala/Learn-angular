import { JsonConvert, JsonObject, JsonProperty } from 'json2typescript/index';
import { BaseModel } from 'shared/models/base.model';

JsonConvert.ignorePrimitiveChecks = true;
@JsonObject
export class CertificateModel extends BaseModel {

  @JsonProperty('displayName', String, true)
  public displayName: string = '';

  @JsonProperty('storeId', String, true)
  public storeId: string = '';

  @JsonProperty('type', String, true)
  public type: string = '';

  @JsonProperty('lastUpdated', Number, true)
  public lastUpdated: number = 0;

  @JsonProperty('comment', String, true)
  public comment: string = '';
}
