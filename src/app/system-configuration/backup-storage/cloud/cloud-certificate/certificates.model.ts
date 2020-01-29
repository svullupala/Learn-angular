import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import { DatasetModel, HasAPI } from 'shared/models/dataset.model';
import { CertificateModel } from './certificate.model';

@JsonObject
export class CertificatesModel extends DatasetModel<CertificateModel> implements HasAPI {

  public static CERTIFICATE_API: string = 'api/security/certificate';

  @JsonProperty('certificates', [CertificateModel])
  public certificates: Array<CertificateModel> = [];


  public getRecords(): Array<CertificateModel> {
    return this.certificates;
  }

  public api(): string {
    return 'api/security/certificate';
  }
}
