import { JsonObject, JsonProperty } from 'json2typescript';

import { BaseApplicationModel } from 'applications/shared/base-application-model.model';
import {HrefNameModel} from 'shared/components/post-scripts/href-name.model';
import {ExchOnlineInstanceModel} from 'appserver/exchonline-instance.model';

@JsonObject
export class AppCredentialModel {
  @JsonProperty('id', String, true)
  public id: string = '';

  @JsonProperty('instanceName', String, true)
  public instanceName: string = '';

  @JsonProperty('credentialType', String, true)
  public credentialType: string = '';

  @JsonProperty('comment', String, true)
  public comment: string = '';

  @JsonProperty('appuser', Object, true)
  public appuser: object = {href: ''};

  @JsonProperty('useForAllInstances', Boolean, true)
  public useForAllInstances: boolean = false;
}

@JsonObject
export class AppServerModel extends BaseApplicationModel {

  public static CORE_APP_SERVER_API_ENDPOINT: string = 'api/appserver';
  public static CORE_APP_SERVER_API_DISCOVERY_ENDPOINT: string = 'api/appserver?action=discover';
  public static NODE_APP_SERVER_API_FIND_DISCOVERY_ENDPOINT: string = 'ngp/appserver?action=findDiscovery';
  public static NODE_APP_SERVER_API_ENDPOINT: string = 'ngp/appserver';

  public static defaultOpProperties = {
    maxConcurrency: 10
  };

  @JsonProperty('instances', [ExchOnlineInstanceModel], true)
  public instances: Array<ExchOnlineInstanceModel> = [];

  @JsonProperty('appCredentials', [AppCredentialModel], true)
  public appCredentials: Array<AppCredentialModel> = [];

  @JsonProperty('applicationType', String, true)
  public applicationType: string = '';

  @JsonProperty('catalogEligible', Boolean, true)
  public catalogEligible: boolean = false;

  @JsonProperty('application', Boolean, true)
  public application: boolean = false;

  @JsonProperty('script', Boolean, true)
  public script: boolean = false;

  @JsonProperty('comment', String)
  public comment: string = '';

  @JsonProperty('name', String)
  public name: string = '';

  @JsonProperty('hostAddress', String)
  public hostAddress: string = '';

  @JsonProperty('nodeId', undefined, true)
  public nodeId: string = '';

  @JsonProperty('osType', String)
  public osType: string = '';

  @JsonProperty('oskey', Object)
  public oskey: Object = {};

  @JsonProperty('osuser', Object)
  public osuser: Object = {};

  @JsonProperty('portNumber', undefined, true)
  public portNumber: number = 0;

  @JsonProperty('siteName', String, true)
  public siteName: string = '';

  @JsonProperty('useKeyAuthentication', Boolean, true)
  public useKeyAuthentication: boolean = false;

  @JsonProperty('vsphereId', String, true)
  public vsphereId: string = '';

  @JsonProperty('opProperties', Object, true)
  public opProperties: {
    maxConcurrency?: number,
  } = AppServerModel.defaultOpProperties;

  public unprotectedDbs: number = undefined;
  public totalDbs: number = undefined;

  public getAppserverHrefName(): HrefNameModel {
    let model: HrefNameModel = new HrefNameModel();
    model.href = this.getUrl('self');
    model.name = this.name;
    return model;
  }

  public get maxConcurrency(): number {
    return this.opProperties ? this.opProperties.maxConcurrency :
      AppServerModel.defaultOpProperties.maxConcurrency;
  }

  public set maxConcurrency(value: number) {
    this.opProperties = this.opProperties || {};
    this.opProperties.maxConcurrency = value;
  }
}
