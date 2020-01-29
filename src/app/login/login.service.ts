import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/of';
import {RestService} from 'core';
import {PreferenceService} from 'shared/preference.service';
import {isObject} from 'rxjs/util/isObject';
import {Base64} from 'shared/util/base64';

@Injectable()
export class LoginService {
  isLoggedIn: boolean = false;

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  constructor(private rest: RestService, private preference: PreferenceService) {
  }

  /**
   * Login method.
   *
   * @param credentials {Object} credential containing 'username' and 'password'
   * @returns {Observable<T>}
   */
  login(credentials): Observable<Object> {
    // return Observable.of(true).delay(1000).do(val => this.isLoggedIn = true);
    let authorization = 'Basic ' + this.encodeBase64(credentials.username, credentials.password);
    this.rest.extraHeaders([{key: 'Authorization', value: authorization}]);
    return this.rest.post('api/endeavour/session?screenInfo=1', {}).do(data => {
        this.rest.extraHeaders();
        this.isLoggedIn = true;
      });
  }

  /**
   * Lifecycle Ping method.
   *
   * @returns {Observable<T>}
   */
  lifecyclePing(): Observable<Object> {
    let me = this, result;
    me.rest.setUseAuditHeader(false);
    result = me.rest.getAll('api/lifecycle/ping');
    me.rest.setUseAuditHeader(true);
    return result;
  }

  /**
   * Login method - Change password.
   *
   * @param config {Object} config containing 'username' and 'password' and 'newPassword'
   * @returns {Observable<T>}
   */
  changePassword(config): Observable<Object> {
    let authorization = 'Basic ' + this.encodeBase64(config.username, config.password);
    this.rest.extraHeaders([{key: 'Authorization', value: authorization}]);
    return this.rest.post('api/endeavour/session?changePassword=true&screenInfo=1', {
      newPassword: config.newPassword,
      oldUsername: config.username,
      newUsername: config.newUsername ? config.newUsername : ''
    }).do(data => {
      this.rest.extraHeaders();
      this.isLoggedIn = true;
    });
  }

  /**
   * Login method - Change username.
   *
   * @param config {Object} config containing 'username' and 'password' and 'newPassword'
   * @returns {Observable<T>}
   */
  changeUsername(config): Observable<Object> {
    let authorization = 'Basic ' + this.encodeBase64(config.username, config.password);
    this.rest.extraHeaders([{key: 'Authorization', value: authorization}]);
    return this.rest.post('api/endeavour/session?changeUsername=true&screenInfo=1', {
      oldUsername: config.username,
      newUsername: config.newUsername,
      newPassword: config.password,
    }).do(data => {
      this.rest.extraHeaders();
      this.isLoggedIn = true;
    });
  }

  /**
   * Login method - Change OS password.
   * @param appUsername {string} App username.
   * @param appPassword {string} App password.
   * @param config {Object} config containing 'username', 'password', 'newPassword' & 'repeatNewPassword'.
   * @returns {Observable<T>}
   */
  changeOsPassword(appUsername: string, appPassword: string, config): Observable<Object> {
    let authorization = 'Basic ' + this.encodeBase64(appUsername, appPassword);
    this.rest.extraHeaders([{key: 'Authorization', value: authorization}]);
    return this.rest.post('api/endeavour/session?changeOsPassword=true&screenInfo=1', {
      osOldPassword: config.password,
      osNewPassword: config.newPassword,
      osConfirmNewPassword: config.repeatNewPassword
    }).do(data => {
      this.rest.extraHeaders();
    });
  }

  /**
   * Base64 encode
   *
   * @param inputString string that needs to be encoded with Base64
   * @return Base64 encoded string
   */
  encodeBase64(username, password): string {
    return Base64.encode(username + ':' + password);
  }

  /**
   * Checks if the server is ready via making a POST api/endeavour/session call with a fake credential,
   * and to examine if the error code comes back with
   * 1) 400 Bad request (that indicates bad credential)
   * 2) 401 Unauthorized (that indicates XSBAuthenticationException)
   * 3) 404 Not Found (that indicates server is not ready & being brought up)
   * 4) Any other error (we can assume that indicates server is not ready as well)
   *
   * @method checkServerIsReady
   * @private
   */
  checkServerIsReady(): Observable<boolean> {
    let me = this, observable: Observable<Object>, result: Observable<boolean>;
    observable = me.lifecyclePing();
    if (observable) {
      result = observable.map((data: Object) => {
          return true;
        }
      ).catch((err: HttpErrorResponse) => {
        // let status = isObject(err) ? err.status || 0 : 0;
        // console.log('checkServerIsReady()...status=' + status);
        return Observable.of(false);
      });
    }
    return result;
  }

  getPasswordMinLength(): Observable<number> {
    return this.preference.getMinPasswordLength();
  }

  /**
   * Determines if the given status code indicates that server is ready.
   *
   * @method readyStatus
   * @param {Number} status
   * @return {Boolean}
   * @private
   */
  readyStatus(status): boolean {
    return status === 400 || status === 401;
  }

  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.rest.getBaseUrl();
  }
}
