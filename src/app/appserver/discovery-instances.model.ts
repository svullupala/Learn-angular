import {JsonObject, JsonProperty} from 'json2typescript';
import { DiscoveryInstanceModel } from 'appserver/discovery-instance.model';

@JsonObject
export class DiscoveryInstancesModel {

  @JsonProperty('instances', [DiscoveryInstanceModel], true)
  public instances: Array<DiscoveryInstanceModel> = [];

  @JsonProperty('databases', [DiscoveryInstanceModel], true)
  public databases: Array<DiscoveryInstanceModel> = [];

  public getRecords(): Array<DiscoveryInstanceModel> {
    return this.instances;
  }

  public getDatabases(): Array<DiscoveryInstanceModel> {
    return this.databases;
  }
}
