import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseHypervisorModel} from './base-hypervisor.model';

@JsonObject
export class HypervisorModel extends BaseHypervisorModel {

  public static TYPE_VMWARE: string = 'vmware';
  public static TYPE_HYPERV: string = 'hyperv';
  public static TYPE_AWSEC2: string = 'awsec2';

  public static defaultOpProperties = {
    snapshotConcurrency: 3
  };

  public static defaultOpPropertiesEx = {
    snapshotConcurrency: 3,
    veServerInfo: {
      hostAddress: undefined,
      osType: 'windows',
      username: undefined,
      password: undefined,
      osuser: undefined
    }
  };

  @JsonProperty('hostAddress', String, true)
  public hostAddress: string = undefined;

  @JsonProperty('portNumber', Number, true)
  public portNumber: number = 443;

  @JsonProperty('username', String, true)
  public username: string = undefined;

  @JsonProperty('password', String, true)
  public password: string = undefined;

  @JsonProperty('sslConnection', Boolean, true)
  public sslConnection: boolean = true;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('properties', Object, true)
  public properties: Object = undefined;

  @JsonProperty('productName', String, true)
  public productName: string = undefined;

  @JsonProperty('cloudType', String, true)
  public cloudType: string = undefined;

  @JsonProperty('location', String, true)
  public location: string = undefined;

  @JsonProperty('user', Object, true)
  public user: {
    href: string
  } = undefined;

  @JsonProperty('uniqueId', String, true)
  public uniqueId: string = undefined;

  // The backend doesn't return useVEServer field.
  // @JsonProperty('useVEServer', Boolean, true)
  public useVEServer: boolean = false;
  public unprotectedVms: number = undefined;
  public totalVms: number = undefined;

  @JsonProperty('opProperties', Object, true)
  public opProperties: {
    snapshotConcurrency?: number,
    veServerInfo?: {
      hostAddress?: string,
      osType?: string,
      username?: string,
      password?: string,
      osuser?: {
        href: string
      }
    }
  } = HypervisorModel.defaultOpProperties;

  public get snapshotConcurrency(): number {
    return this.opProperties ? this.opProperties.snapshotConcurrency :
      HypervisorModel.defaultOpProperties.snapshotConcurrency;
  }

  public set snapshotConcurrency(value: number) {
    this.opProperties = this.opProperties || {};
    this.opProperties.snapshotConcurrency = value;
  }

  public get hasVeHostAddress(): boolean {
    return !!(this.opProperties && this.opProperties.veServerInfo &&
      this.opProperties.veServerInfo.hostAddress);
  }

  public get veHostAddress(): string {
    return this.opProperties && this.opProperties.veServerInfo ? this.opProperties.veServerInfo.hostAddress :
      HypervisorModel.defaultOpPropertiesEx.veServerInfo.hostAddress;
  }

  public set veHostAddress(value: string) {
    this.opProperties = this.opProperties || {};
    this.opProperties.veServerInfo = this.opProperties.veServerInfo || {};
    this.opProperties.veServerInfo.hostAddress = value;
  }

  public get veOSType(): string {
    return (this.opProperties && this.opProperties.veServerInfo) ? (this.opProperties.veServerInfo.osType ||
      HypervisorModel.defaultOpPropertiesEx.veServerInfo.osType) :
      HypervisorModel.defaultOpPropertiesEx.veServerInfo.osType;
  }

  public set veOSType(value: string) {
    this.opProperties = this.opProperties || {};
    this.opProperties.veServerInfo = this.opProperties.veServerInfo || {};
    this.opProperties.veServerInfo.osType = value;
  }

  public get veUsername(): string {
    return this.opProperties && this.opProperties.veServerInfo ? this.opProperties.veServerInfo.username :
      HypervisorModel.defaultOpPropertiesEx.veServerInfo.username;
  }

  public set veUsername(value: string) {
    this.opProperties = this.opProperties || {};
    this.opProperties.veServerInfo = this.opProperties.veServerInfo || {};
    this.opProperties.veServerInfo.username = value;
  }

  public get vePassword(): string {
    return this.opProperties && this.opProperties.veServerInfo ? this.opProperties.veServerInfo.password :
      HypervisorModel.defaultOpPropertiesEx.veServerInfo.password;
  }

  public set vePassword(value: string) {
    this.opProperties = this.opProperties || {};
    this.opProperties.veServerInfo = this.opProperties.veServerInfo || {};
    this.opProperties.veServerInfo.password = value;
  }

  public get veUser(): {
    href: string
  } {
    return this.opProperties && this.opProperties.veServerInfo ? this.opProperties.veServerInfo.osuser :
      HypervisorModel.defaultOpPropertiesEx.veServerInfo.osuser;
  }

  public set veUser(value: {
    href: string
  }) {
    this.opProperties = this.opProperties || {};
    this.opProperties.veServerInfo = this.opProperties.veServerInfo || {};
    this.opProperties.veServerInfo.osuser = value;
  }

  public get osType(): string {
    let me = this, os = '';
    if (me.properties && me.properties['sysinfoOs'])
      os = me.properties['sysinfoOs']['value'] || '';
    return os;
  }

  constructor(type?: string) {
    super();
    this.type = type || HypervisorModel.TYPE_VMWARE;
    if (this.type === HypervisorModel.TYPE_HYPERV)
      this.sslConnection = false;

    this.portNumber = this.getDefaultPort();
  }

  public isVMware(): boolean {
    return this.type === HypervisorModel.TYPE_VMWARE;
  }

  public isHyperV(): boolean {
    return this.type === HypervisorModel.TYPE_HYPERV;
  }

  public isAwsec2(): boolean {
    return this.type === HypervisorModel.TYPE_AWSEC2;
  }

  public getDefaultPort(): number {
    return this.isHyperV() ? (this.sslConnection ? 5986 : 5985) : (this.isVMware() ? 443 : 0);
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    let me = this;
    return {
      hostAddress: me.hostAddress,
      portNumber: me.portNumber || me.getDefaultPort(),
      username: me.username,
      password: me.password,
      sslConnection: me.sslConnection,
      type: me.type,
      opProperties: {
        snapshotConcurrency: me.snapshotConcurrency
      }
    };
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    let me = this, result: any = me.getPersistentJson();
    if (me.hasVeHostAddress && me.useVEServer) {
      result.opProperties.veServerInfo = {
        hostAddress: me.veHostAddress,
        osType: me.veOSType,
        username: me.veUsername,
        password: me.vePassword
      };
    }
    return result;
  }

  public hasUser(): boolean {
    return !!(this.user && this.user.href && this.user.href.length > 0);
  }

  public hasVeUser(): boolean {
    return !!(this.veUser && this.veUser.href && this.veUser.href.length > 0);
  }

  /**
   * Constructs a copy of this model.
   * Don't use deep-copy(clone) because of performance concern.
   *
   * @returns {HypervisorModel}
   */
  public copy(): HypervisorModel {
    let target = new HypervisorModel();
    Object.assign(target, this);
    target.useVEServer = false;
    if (this.opProperties) {
      target.opProperties = Object.assign({}, this.opProperties);
      if (this.opProperties.veServerInfo) {
        target.opProperties.veServerInfo = Object.assign({}, this.opProperties.veServerInfo);
        target.useVEServer = this.opProperties.veServerInfo.hostAddress ? true : false;
      }
    }
    return target;
  }
}
