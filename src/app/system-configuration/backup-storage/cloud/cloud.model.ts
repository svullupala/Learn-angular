import {JsonObject, JsonProperty} from 'json2typescript';
import { BaseModel } from 'shared/models/base.model';
import { BucketModel } from './bucket.model';

@JsonObject
class PropertiesModel {
  @JsonProperty('archiveBucket', String, true)
  public archiveBucket: string = '';

  @JsonProperty('bucket', String, true)
  public bucket: string = '';

  @JsonProperty('endpoint', String, true)
  public endpoint: string = '';

  @JsonProperty('region', String, true)
  public region: string = '';

  @JsonProperty('ssl', Boolean, true)
  public ssl: boolean = false;

  @JsonProperty('hostname', String, true)
  public hostname: string = '';

  @JsonProperty('port', Number, true)
  public port: number = 0;

  @JsonProperty('certificate', Object, true)
  public certificate: object = {href: ''};

  @JsonProperty('enableDeepArchive', Boolean, true)
  public enableDeepArchive: boolean = false;
}

@JsonObject
class AccessKeyModel {
  @JsonProperty('href', String, true)
  public href: string = '';
}

@JsonObject
export class CloudModel extends BaseModel {
  @JsonProperty('type', String, true)
  public type: string = '';

  @JsonProperty('provider', String, true)
  public provider: string = '';

  @JsonProperty('comment', String, true)
  public comment: string = '';

  @JsonProperty('accesskey', AccessKeyModel, true)
  public accesskey: AccessKeyModel = undefined;

  @JsonProperty('properties', PropertiesModel, true)
  public properties: PropertiesModel = undefined;

  @JsonProperty('wormProtected', Boolean, true)
  public wormProtected: boolean = false;

  @JsonProperty('defaultRetention', Number, true)
  public defaultRetention: number = undefined;

  @JsonProperty('archiveEnabled', Boolean, true)
  public archiveEnabled: boolean = false;

  @JsonProperty('offloadEnabled', Boolean, true)
  public offloadEnabled: boolean = true;

  @JsonProperty('buckets', [BucketModel], true)
  public buckets: Array<BucketModel> = [];

  constructor(type?: string, provider?: string) {
    super();
    this.type = type || '';
    this.provider = provider || '';
  }
}
