import { JsonObject, JsonProperty } from 'json2typescript';
import { BaseApplicationModel } from './base-application-model.model';


@JsonObject
export class DatabaseGroupModel extends BaseApplicationModel {

  @JsonProperty('association', undefined, true)
  public association = null;

  @JsonProperty('recoveryInfo', undefined, true)
  public recoveryInfo;

  @JsonProperty('recoveryPoint', undefined, true)
  public recoveryPoint;

  @JsonProperty('autoProvisionedsubPolicyName', undefined, true)
  public autoProvisionedsubPolicyName;

  @JsonProperty('rbacPathId', undefined, true)
  public rbacPathId;

  @JsonProperty('dbListener', undefined, true)
  public dbListener = {};

  @JsonProperty('primaryInstancePk', String, true)
  public primaryInstancePk: string = '';

  @JsonProperty('secondaryInstancePks', undefined, true)
  public secondaryInstancePks = [];

}
