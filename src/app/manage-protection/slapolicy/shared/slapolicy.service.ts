import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {NodeService} from 'core';
import {RestService} from 'core';
import {SlapolicyModel} from './slapolicy.model';
import {SlapoliciesModel} from './slapolicies.model';
import {JobSessionModel} from 'job/shared/job-session.model';
import {JobSessionsModel} from 'job/shared/job-sessions.model';
import {SlapolicyNodeModel} from './slapolicy-node.model';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import { PostScriptsModel } from 'shared/components/post-scripts/post-scripts.model';

@Injectable()
export class SlapolicyService {

  private static nodeAPI = 'ngp/slapolicy';

  public slapolicySubject = new Subject<SlapolicyNodeModel>();

  constructor(private node: NodeService, private core: RestService) {
  }
  /**
   * Create method.
   *
   * @param policy {SlapolicyModel} Policy model containing info needs to be created.
   * @returns {Observable<T>}
   */
  create(policy: SlapolicyModel): Observable<Object> {
    return this.node.post(SlapolicyService.nodeAPI, policy.getPersistentJson());
  }

  /**
   * Delete method.
   *
   * @param policy {SlapolicyModel} Policy model containing info needs to be deleted.
   * @returns {Observable<T>}
   */
  delete(policy: SlapolicyModel): Observable<Object> {
    return this.node.deleteByUrl(policy.getUrl('delete'));
  }

  /**
   * Update method.
   *
   * @param policy {SlapolicyModel} An object containing vCenter info needs to be registered.
   * @returns {Observable<T>}
   */
  update(policy: SlapolicyModel): Observable<Object> {
    return this.node.put(SlapolicyService.nodeAPI, policy.id, policy.getPersistentJson());
  }

  /**
   * Apply scripts method.
   *
   * @param policy {SlapolicyModel} Policy model containing info to apply scripts.
   * @param script {PostScriptsModel} Script object that has required info for correct post body.
   * @param subtype {string} Subtype to determine what policy to apply scripts to Ex: vmare, hyperv, oracle ,etc.
   * @returns {Observable<T>}
   */
  applyScripts(policy: SlapolicyModel, script: PostScriptsModel,
               subtype: string, showOptions: boolean = false): Observable<Object> {
    let link: string = policy && policy.getUrl('applyOptions');
    if (link) {
      return this.node.postByUrl(link, script.getPersistentJson(showOptions))
        .catch((error: HttpErrorResponse) => Observable.throw(error));
    }
  }

  /**
   * Get SLA policies
   * @param filters {Array<FilterModel>} Optional filters.
   * @param sorters {Array<SorterModel>} Optional sorters.
   * @param pageStartIndex {number} The page start index.
   * @returns {Observable<Object>}
   */
  getSLAPolicies(filters?: Array<FilterModel>, sorters?: Array<SorterModel>,
    pageStartIndex?: number, subtype?: string): Observable<Object> {
      if (subtype) {
       return this.node.getPage(`ngp/slapolicy?subtype=${subtype}`, FilterModel.array2json(filters), SorterModel.array2json(sorters),
      pageStartIndex) } else {
       return this.node.getPage('ngp/slapolicy', FilterModel.array2json(filters), SorterModel.array2json(sorters),
       pageStartIndex);
      }
  }

  /**
   * Get SLA policy status.
   *
   * @param subtype {string} This defines the subtype that UI needs to fill the SLA policy status table.
   *  If we are calling this API in VMware backup screen, subtype will be "vmware".
   *  the value could be vmware|hyperv|storage|sql|oracle|saphana|iscache.
   * @returns {Observable<SlapoliciesModel>}
   */
  getSLAPolicyStatus(subtype: string, pageStartIndex?: number): Observable<SlapoliciesModel> {
    return this.node.getPage(`ngp/slapolicy?status=true&embedoptions=false&subtype=${subtype}`, undefined,
      undefined, pageStartIndex).map(
      (response: Object) => {
        const data = response;
        let dataset: SlapoliciesModel;
        try {
          // Cast the JSON object to SlapoliciesModel instance.
          dataset = <SlapoliciesModel>JsonConvert.deserializeObject(data, SlapoliciesModel);
        } catch (e) {
        }
        return dataset;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
  }

  /**
   * Gets job sessions.
   *
   * @param policy {SlapolicyModel} policy model.
   * @param subtype {string}
   * @returns {Observable<Array<JobSessionModel>>}
   */
  getJobSessions(policy: SlapolicyModel, subtype: string): Observable<Array<JobSessionModel>> {
    let me = this, observable: Observable<Object>, result, link = policy.getLink('jobsessions');
    observable = link ? me.node.getByUrl(link.href) :
      me.node.getAll(`ngp/slapolicy/jobsessions?name=${encodeURIComponent(policy.name)}&subtype=${subtype}`);
    result = observable.map((response: Object) => {
        const data = response;
        let dataset, records;
        if (data['sessions'] !== undefined) {
          // Cast the JSON object to JobSessionsModel instance.
          dataset = JsonConvert.deserializeObject(data, JobSessionsModel);
          records = <Array<JobSessionModel>> dataset.records;
        }
        return records;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    return result;
  }

  updateTable() {
    this.slapolicySubject.next();
  }

  /**
   * Gets the endpoint of NodeJS service.
   * @returns {string}
   */
  getNodeServiceEndpoint(): string {
    return this.node.getBaseUrl();
  }
}
