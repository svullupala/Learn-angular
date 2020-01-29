import { Injectable } from '@angular/core';
import { AccessUserModel } from '../accounts/users/user.model';
import { JsonConvert } from 'json2typescript/index';
import { LicenseModel } from '../license/license.model';

export enum ScreenId {
  REPORTS = 5,
  DASHBOARD = 9,
  FILERESTORE = 10,
  POLICYOVERVIEW = 13,
  BACKUP_STORAGE = 14,
  CLOUD = 14,
  REPOSITORY = 14,
  JOBSOPS = 17,
  SCRIPTS = 18,
  SPP_BACKUP = 19,
  SPP_RESTORE = 20,
  SPP_RETENTION = 21,
  VADPMONITOR = 22,
  SITE = 23,
  LDAPSMTP = 24,
  AUDITLOG = 26,
  USER = 27,
  ROLE = 28,
  RESOURCEGROUPS = 29,
  IDENTITY = 30,
  KEYSCERTS = 31,
  VMWARE_BACKUP = 100,
  VMWARE_RESTORE = 101,
  HYPERV_BACKUP = 110,
  HYPERV_RESTORE = 111,
  AWSEC2_BACKUP = 120,
  AWSEC2_RESTORE = 121,
  ORACLE_BACKUP = 200,
  ORACLE_RESTORE = 201,
  SQL_BACKUP = 210,
  SQL_RESTORE = 211,
  EXCH_BACKUP = 220,
  EXCH_RESTORE = 221,
  DB2_BACKUP = 230,
  DB2_RESTORE = 231,
  MONGO_BACKUP = 240,
  MONGO_RESTORE = 241,
  EXCHONLINE_BACKUP = 250,
  EXCHONLINE_RESTORE = 251,
  KUBERNETES_BACKUP = 260,
  KUBERNETES_RESTORE = 261
}

@Injectable()
export class SessionService {

  private static _instance: SessionService = null;
  private _context: Object = null;
  private _sessionId: string = '';
  private _screens: Array<any> = [];

  /**
   * Singleton method.
   * @returns {SessionService}
   */
  public static getInstance() {
    if (!this._instance)
      this._instance = new SessionService();

    return this._instance;
  }

  get screens(): Array<any> {
    return this._screens;
  }

  set screens(value: Array<any>) {
    this._screens = value;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  set sessionId(value: string) {
    this._sessionId = value;
  }

  get context(): Object {
    return this._context;
  }

  set context(value: Object) {
    this._context = value;
  }

  get isAuthenticated(): boolean {
    return this._sessionId && this._sessionId.length > 0 ? true : false;
  }

  get rbacReady(): boolean {
    return this.routerPathsAllowed !== undefined;
  }

  get routerPathsAllowed(): string[] {
    return this._context ? this._context['routerPathsAllowed'] : undefined;
  }

  set routerPathsAllowed(paths: string[]) {
    if (this._context)
      this._context['routerPathsAllowed'] = paths;
  }

  set license(license: LicenseModel) {
    if (this._context)
      this._context['license'] = license;
  }

  get license(): LicenseModel {
    return this._context && this._context['license'];
  }

  /**
   * Returns the name of the logged in Account.
   *
   * @method getAccountName
   * @return {string}
   */
  getAccountName(): string {
    return this._context['user'].name;
  }

  /**
   * Returns the id of the logged in Account.
   *
   * @method getAccountId
   * @return {string}
   */
  getAccountId(): string {
    return this._context['user'].id;
  }

  /**
   * Returns true if logged in user is a LDAP user.
   *
   * @method isLDAPUser
   * @return {boolean}
   */
  isLDAPUser(): boolean {
      return SessionService.getInstance().context['user'].type === 'LDAP_USER';
  }

  /**
   * Returns a UserId we construct for an LDAP account
   *
   * @return {string}
   */
  getUserId(): string {
    if (this.isLDAPUser()) {
      return this._context['userGroups'][0] + '_' + this._context['user'].name;
    } else {
      return this._context['user'].id;
    }
  }

  /**
   * Returns UserModel constructed from session response user object.
   *
   * @return {AccessUserModel}
   */
  getUserModel(): AccessUserModel {
    let userModel;
    try {
      // Cast the JSON object to AccessUserModel instance.
      userModel = JsonConvert.deserializeObject(this._context['user'], AccessUserModel);
    } catch (e) {
      console.error('Error converting session user object to AccessUserModel.');
    }

    return userModel;
  }

  /**
   * Syncs metadata item for current user.
   * @param {string} key
   * @param value
   */
  syncMetadata(key: string, value: any) {
    let me = this, metadata;
    try {
      me._context['user'].metadata = me._context['user'].metadata || {};
      metadata = me._context['user'].metadata;
      metadata[key] = value;
    } catch (e) {
      console.error('Error syncing metadata for current user.');
    }
  }

  /**
   * Returns true if there is a valid session.
   *
   * @method isValidSession
   * @return {boolean}
   */
  isValidSession(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Returns true if current user in session is native admin the comes with the product
   * @method isBuiltInAdminUser
   * @return {boolean}
   */
  isBuiltInAdminUser(): boolean {
    return SessionService.getInstance().context['user'].id === '1000';
  }

  hasScreenPermission(value: any): boolean {
    let screen = SessionService.getInstance().screens.find((element) => {
        return element.id == value;
      });

    return screen !== undefined;
  }

  /**
   * Returns true if there is a valid(NOT empty) session context.
   *
   * @method isValidSession
   * @return {boolean}
   */
  isValidContext(): boolean {
    return !!this.context;
  }

  private constructor() {
  }
}
