import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import { CloudParameterModel } from './cloud-parameter.model';
import { BaseModel } from 'shared/models/base.model';
import { BucketModel } from 'cloud/bucket.model';

@JsonObject
export class CloudSchemaModel extends BaseModel {

  @JsonProperty('parameters', [CloudParameterModel])
  public parameters: Array<CloudParameterModel> = [];

  @JsonProperty('provider', String, true)
  public provider: string = '';

  @JsonProperty('type', String, true)
  public type: string = '';

  public accessPayload: any;

  public certificateHref: string;

  public selectedBucket: BucketModel;

  public selectedArchiveBucket: BucketModel;

  public getParameters(): Array<CloudParameterModel> {
    return this.parameters;
  }

  private storagePropertiesMembers = ['port', 'hostname', 'region', 'ssl', 'endpoint', 'enableDeepArchive'];
  private bucketPropertiesMembers = ['port', 'hostname', 'region', 'ssl', 'endpoint'];
  private storageUpdatePropertiesMembers = ['region', 'enableDeepArchive'];

  public getSchemaJson(): object {
    let schemaJson: object = {
      type: this.type,
      provider: this.provider,
      accesskey: this.accessPayload,
      properties: {
        type: this.type,
        certificate: this.certificateHref ? {href: this.certificateHref} : undefined
      }
    },
      params: Array<CloudParameterModel> = this.parameters || [];

    params.forEach((param: CloudParameterModel) => {
      let value = typeof param.value === 'string' ? param.value.trim() : param.value;
      if (param.name === 'name') {
        schemaJson[param.name] = value;
      } else if (this.storagePropertiesMembers.indexOf(param.name) !== -1) {
        schemaJson['properties'][param.name] = param.type === 'integer' ? Number(value) : value;
      }
    });
    if (this.selectedBucket)
      schemaJson['properties']['bucket'] = this.selectedBucket.name;

    if (this.selectedArchiveBucket)
      schemaJson['properties']['archiveBucket'] = this.selectedArchiveBucket.name;

    return schemaJson;
  }

  public getBucketJson(): object {
    let bucketJson: object = {
        provider: this.provider,
        accesskey: {},
        properties: {}
      },
      params: Array<CloudParameterModel> = this.parameters || [];

    params.forEach((param: CloudParameterModel) => {
      let value = typeof param.value === 'string' ? param.value.trim() : param.value;
      if (this.bucketPropertiesMembers.indexOf(param.name) !== -1) {
        bucketJson['properties'][param.name] = param.type === 'integer' ? Number(value) : value;
      }
    });

    if (typeof this.accessPayload === 'object') {
      bucketJson['properties']['accessKey'] = this.accessPayload['access'];
      bucketJson['properties']['secretKey'] = this.accessPayload['secret'];
    } else if (typeof this.accessPayload === 'string') {
      bucketJson['accesskey'] = {href: this.accessPayload};
    }
    return bucketJson;
  }


  public getUpdateJson(bucket?: BucketModel): object {
    let returnVal: object = {
      accesskey: this.accessPayload,
      properties: {},
      name: ''
    }, params: Array<CloudParameterModel> = this.parameters;
    if (this.certificateHref) {
      returnVal['properties']['certificate'] = {href: this.certificateHref};
    }
    if (params)
      params.forEach((param: CloudParameterModel) => {
        let value = typeof param.value === 'string' ? param.value.trim() : param.value;
        if (param.name === 'name') {
          returnVal[param.name] = value;
        } else if (this.storageUpdatePropertiesMembers.indexOf(param.name) !== -1) {
          returnVal['properties'][param.name] = value;
        }
      });

      if (this.selectedBucket)
      returnVal['properties']['bucket'] = this.selectedBucket.name;

      if (this.selectedArchiveBucket)
      returnVal['properties']['archiveBucket'] = this.selectedArchiveBucket.name;

    return returnVal;
  }
}
