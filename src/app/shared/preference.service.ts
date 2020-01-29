import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {RestService, SessionService} from 'core';

@Injectable()
export class PreferenceService {
  private static coreAPI = 'api/endeavour/preference';

  constructor(private rest: RestService) {
  }

  getPreference(id: string): Observable<any> {
    return this.rest.get(PreferenceService.coreAPI, id);
  }

  getMinPasswordLength(): Observable<number> {
    let observable: Observable<any>, result: Observable<number>;

    if (!SessionService.getInstance().isAuthenticated) {
      return Observable.of(0);
    }
    
    observable=this.getPreference('pref.security.user.passwordrule.minimumLength');

    if (observable) { 
      result = observable.map((data) => {
        return (data.value.value) ? data.value.value : data.value.defaultValue;
      });
    }
    
    return (result) ? result : Observable.of(0);
  }
}
