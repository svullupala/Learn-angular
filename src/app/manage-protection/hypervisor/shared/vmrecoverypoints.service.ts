import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {BaseHypervisorModel} from './base-hypervisor.model';
import {SnapshotModel} from './snapshot.model';
import {SnapshotsModel} from './snapshots.model';
import {BaseModel} from 'shared/models/base.model';
import {MD5} from 'shared/util/md5';
import {SharedService} from 'shared/shared.service';


@Injectable()
export class VmRecoveryPointsService {

  private recPointListURL: string = this.core.getBaseUrl() + 'api/hypervisor/copy?from=recovery&resourceType={0}';

  constructor(private core: RestService) {
  }

  /**
   * Get method.
   * @param api {String} The API.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  getAll(api: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>): Observable<Object> {
    return this.core.getAll(api, FilterModel.array2json(filters), SorterModel.array2json(sorters));
  }

  /**
   * GetByUrl method.
   * @param url {String} The URL.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Object>}
   */
  getByUrl(url: string, filters?: Array<FilterModel>, sorters?: Array<SorterModel>): Observable<Object> {
    return this.core.getByUrl(url, FilterModel.array2json(filters), SorterModel.array2json(sorters));
  }

  /**
   * Gets snapshots.
   *
   * @param resource {BaseHypervisorModel} the hypervisor resource model.
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @returns {Observable<Array<SnapshotModel>>}
   */
  getSnapshots(resource: BaseHypervisorModel, filters?: Array<FilterModel>,
               sorters?: Array<SorterModel>): Observable<Array<SnapshotModel>> {
    let me = this, observable: Observable<Object>, result, link = resource.getLink('copies');
    if (link) {
      observable = me.getByUrl(link.href, filters, sorters);
      result = observable.map((response: Object) => {
        const data = response;
        let dataset, records;
        if (data['copies'] !== undefined) {
          // Cast the JSON object to JobSessionsModel instance.
          dataset = JsonConvert.deserializeObject(data, SnapshotsModel);
          records = <Array<SnapshotModel>> dataset.records;
        }
        return records;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }

  getLatestSnapshots(resourceType: String, payload: object): Observable<Object> {
    let url = SharedService.formatString(this.recPointListURL, resourceType);
    return this.core.postByUrl(url, payload);
  }
}
