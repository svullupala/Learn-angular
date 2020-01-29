import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';

import { RestService } from 'core';
import { SorterModel } from 'shared/models/sorter.model';
import { FilterModel } from 'shared/models/filter.model';
import { CredentialsModel } from './credentials.model';

@Injectable()
export class CredentialService {
  constructor(private rest: RestService) {}

  public getCredentials(): Observable<CredentialsModel> {
    let sorters: SorterModel = new SorterModel('name', 'ASC'),
      typeFilter: FilterModel = new FilterModel('type', 'system');
    return this.rest.getAll(CredentialsModel.CREDENTIAL_API_ENDPOINT, [typeFilter], [sorters]).map(
      (response: Object) => {
          let data = response,
              credentials = JsonConvert.deserializeObject(data, CredentialsModel);
          return credentials;
      }
    ).catch((error: Response) => Observable.throw(error));
  }
}
