import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpErrorResponse} from '@angular/common/http';
import {JsonConvert} from 'json2typescript';

import {RestService} from 'core';
import {NodeService} from 'core';
import {SharedService} from 'shared/shared.service';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {IdentityModel} from './identity.model';

@Injectable()
export class IdentitiesService {

  private static identitiesAPI: string = 'api/identity/user';

  constructor(private core: RestService, private node: NodeService) {}

  public getCredentials(sorters?: Array<SorterModel>,
                        filters?: Array<FilterModel>): Observable<Object> {
    let api = IdentitiesService.identitiesAPI;
    return this.core.getAll(api, FilterModel.array2json(filters), SorterModel.array2json(sorters));
  }

  public create(identity: IdentityModel): Observable<Object> {
    let api = IdentitiesService.identitiesAPI;
    return this.core.post(api, identity.getPersistentJson());
  }

  public delete(identity: IdentityModel): Observable<Object> {
    return this.core.deleteByUrl(identity.getUrl('delete'));
  }

  public edit(identity: IdentityModel): Observable<Object> {
    return this.core.putByUrl(identity.getUrl('edit'), identity.getUpdateJson());
  }
}
