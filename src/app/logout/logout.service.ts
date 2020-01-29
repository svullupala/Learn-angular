import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';

@Injectable()
export class LogoutService {

  constructor(private rest: RestService) {
  }

  /**
   * Logout method.
   *
   * @returns {Observable<T>}
   */
  logout(): Observable<Object> {
    return this.rest.delete('api/endeavour/session', '');
  }
}
