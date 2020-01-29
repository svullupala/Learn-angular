import {JsonObject, JsonProperty} from 'json2typescript';
import {HasProxy, RestService} from 'core';

@JsonObject
export class HypervisorBackupOptionsModel implements HasProxy {

  public proxy: RestService;

  @JsonProperty('options', Object, true)
  public options: {
    makeApplicationConsistent?: boolean,
    fallbackToUnquiescedSnapshot?: boolean,
    snapshotRetries?: number,
    priority?: number,
    fullcopymethod?: string,
    proxySelection?: string,
    skipReadonlyDS?: boolean,
    skipIAMounts?: boolean,
    includeVMsOnMultDatastores?: boolean,
    enableFH?: boolean,
    enableLogTruncate?: boolean,
    username?: string,
    password?: string,
    FHExcludedPath?: string,
    user?: {
      href: string
    }
  } = {};


  get makeApplicationConsistent(): boolean {
    return this.options.makeApplicationConsistent;
  }

  set makeApplicationConsistent(value: boolean) {
    this.options.makeApplicationConsistent = value;
  }

  get fallbackToUnquiescedSnapshot(): boolean {
    return this.options.fallbackToUnquiescedSnapshot;
  }

  set fallbackToUnquiescedSnapshot(value: boolean) {
    this.options.fallbackToUnquiescedSnapshot = value;
  }

  get snapshotRetries(): number {
    return this.options.snapshotRetries;
  }

  set snapshotRetries(value: number) {
    this.options.snapshotRetries = value;
  }

  get priority(): number {
    return this.options.priority;
  }

  set priority(value: number) {
    this.options.priority = value;
  }

  get fullcopymethod(): string {
    return this.options.fullcopymethod;
  }

  set fullcopymethod(value: string) {
    this.options.fullcopymethod = value;
  }

  get proxySelection(): string {
    return this.options.proxySelection;
  }

  set proxySelection(value: string) {
    this.options.proxySelection = value;
  }

  get skipReadonlyDS(): boolean {
    return this.options.skipReadonlyDS;
  }

  set skipReadonlyDS(value: boolean) {
    this.options.skipReadonlyDS = value;
  }

  get FHExcludedPath(): string {
    return this.options.FHExcludedPath;
  }

  set FHExcludedPath(value: string) {
    this.options.FHExcludedPath = value;
  }

  get includeVMsOnMultDatastores(): boolean {
    return this.options.includeVMsOnMultDatastores;
  }

  set includeVMsOnMultDatastores(value: boolean) {
    this.options.includeVMsOnMultDatastores = value;
  }

  get skipIAMounts(): boolean {
    return this.options.skipIAMounts;
  }

  set skipIAMounts(value: boolean) {
    this.options.skipIAMounts = value;
  }

  get enableFH(): boolean {
    return this.options.enableFH;
  }

  set enableFH(value: boolean) {
    this.options.enableFH = value;
  }

  get enableLogTruncate(): boolean {
    return this.options.enableLogTruncate;
  }

  set enableLogTruncate(value: boolean) {
    this.options.enableLogTruncate = value;
  }

  get username(): string {
    return this.options.username;
  }

  set username(value: string) {
    this.options.username = value;
  }

  get password(): string {
    return this.options.password;
  }

  set password(value: string) {
    this.options.password = value;
  }

  get user(): {href: string} {
    return this.options.user;
  }

  set user(value: {href: string}) {
    this.options.user = value;
  }

  hasUser(): boolean {
    return !!(this.user && this.user.href && this.user.href.length > 0);
  }

  /**
   * Checks if there are any properties on the options.
   * @return {Boolean} true if there no properties on the object.
   */
  isEmpty(): boolean {
    let me = this, object = this.options || {};
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
}
