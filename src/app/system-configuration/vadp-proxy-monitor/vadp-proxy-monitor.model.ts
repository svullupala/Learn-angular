import { JsonObject, JsonProperty, JsonConvert } from 'json2typescript';
import { AuditLogModel } from './audit-log.model';
import { BaseModel } from 'shared';
import { VadpModel } from './vadp.model';

@JsonObject
export class VadpProxyMonitorModel extends BaseModel {

  @JsonProperty('discovery', Object, true)
  public discovery: any = undefined;

  @JsonProperty('installer', Object, true)
  public installer: any = undefined;

  @JsonProperty('vadps', [VadpModel], true)
  public vadps: Array<VadpModel> = [];

  @JsonProperty('enabled', [], true)
  public enabled: any = [];

  @JsonProperty('suspended', [], true)
  public suspended: any = [];

  @JsonProperty('available', [], true)
  public available: any = [];
}

