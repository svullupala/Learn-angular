import {Injectable} from '@angular/core';
import {RestService} from 'core';
import { Observable } from 'rxjs';

@Injectable()
export class TriggerService {

  private static coreAPI = 'api/endeavour';
  private coreTriggerAPI = 'api/endeavour/trigger';

  constructor(private core: RestService) {
  }

  getTriggers(url: string): Observable<any> {
    return this.core.getByUrl(url);
  }

  updateTrigger(id: string, putPayload: Object): Observable<any> {
    if (id && putPayload) {
      return this.core.put(this.coreTriggerAPI, id, putPayload);
    }
  }

}
