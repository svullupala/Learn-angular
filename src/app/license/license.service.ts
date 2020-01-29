import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {LicenseModel} from './license.model';
import {RestService} from 'core';

@Injectable()
export class LicenseService {

  private licenseApi: string = 'api/endeavour/license/ecx';

  constructor(private core: RestService) {}

  /**
   * Gets license information.
   *
   * @returns {Observable<Array<LicenseModel>>}
   */
  public getLicense(): Observable<LicenseModel> {
    let me = this;
      return me.core.getAll(me.licenseApi).map((res: Object) => {
        let data = res;
        try {
          // Cast the JSON object to LicenseModel instance.
          data = JsonConvert.deserializeObject(data, LicenseModel);
        } catch (e) {}
        return data;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }
}
