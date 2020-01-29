import {Injectable} from '@angular/core';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';

import {AuditLogsModel} from './audit-logs.model';
import {FilterModel} from 'shared/models/filter.model';
import {SharedService} from 'shared/shared.service';
import {SessionService} from 'core';

@Injectable()
export class AuditLogService {
  private api: string = 'api/endeavour/log/audit';
  private checkLogUrl: string = 'api/endeavour/log/download/diagnostics?viewcheck=true';

  constructor(private rest: RestService){ }

  /**
   * Returns true if user has permsision to download audit logs
   * @returns {Observable<boolean>}
   */
  getLogViewCheck(): Observable<boolean> {
    this.rest.setNoAuditHeader(true);
    return this.rest.getAll(this.checkLogUrl).map(
      res => {
        let body = res;
        if (body.audit !== undefined && body.audit === true) {
          return true;
        }
        return false;
      },
      err => {
        return false;
      }
    );
  }

  /**
   * Get the audit logs from backend.
   * @param filters
   * @param pageSize
   * @param pageOffset
   * @returns {Observable<R>}
   */
  getAuditLogs(filters?: FilterModel[], pageSize?: number, pageOffset?: number): Observable<AuditLogsModel> {
    var _filter = null;
    var _sort = null;
    var _pageSize = 10;
    var _pageOffset = 0;

    if (filters !== undefined) {
      _filter = FilterModel.array2json(filters);
    }

    if (pageSize !== undefined) {
      _pageSize = pageSize;
    }

    if (pageOffset !== undefined) {
      _pageOffset = pageOffset;
    }

    return this.rest.getAll(this.api, _filter, _sort, _pageSize, _pageOffset)
      .map(this.extractData).catch(this.handleError);
  }

  /**
   * Returns the link to get diagnostics
   *
   * @method getAuditDiagnosticsUrl
   */
  getAuditDiagnosticsUrl(): string {
    let me = this,
      url = SharedService.formatString('{0}api/endeavour/log/audit/download/zip?esessionid={1}',
        this.rest.getBaseUrl(),
        SessionService.getInstance().sessionId);
    return url;
  }



  private extractData(res: Object) {
    let body = res;
    return body || { };
  }

  private handleError(error: any) {
    return Observable.throw(error);
  }


}
