import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import {DatasetModel} from 'shared/models/dataset.model';
import {CertificateModel} from './certificate.model';

@JsonObject
export class CertificatesModel extends DatasetModel<CertificateModel> {

  @JsonProperty('certificates', [CertificateModel])
  public certificates: Array<CertificateModel> = [];

  public getRecords(): Array<CertificateModel> {
    return this.certificates;
  }
}
