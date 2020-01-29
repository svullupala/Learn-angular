import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

import {
  RESTClient, GET, PUT, POST, DELETE,
  BaseUrl, Headers, HEADER, PATH, BODY, QUERY, OBSERVE, RESPONSETYPE
} from './rest.client';
import {productionMode} from '../environment';
import {DummyService} from '../dummy/dummy.service';

export interface HasProxy {
  proxy: RestService;
}

export interface HasPersistentJson {
  getPersistentJson(): Object;
}

export interface HasUpdateJson {
  getUpdateJson(): Object;
}

export interface HasProxyAndPersistentJson extends HasProxy, HasPersistentJson {
}

export type RestObserveType = 'body' | 'response';
export type RestResponseType = 'json' | 'text';

@Injectable()
export class RestService extends RESTClient {

  static pageSize: number = 100;

  private exHeaders: { key: string, value: string }[] = [];

  private noAudit = false;
  private useAuditHeader = true;

  public constructor(protected http: HttpClient, protected dummy: DummyService) {
    super(http, dummy);
  }

  protected getDefaultHeaders(): {
    [name: string]: string | string[];
  } {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  protected getExtraHeaders(): {
    [name: string]: string | string[];
  } {
    let me = this, headers = super.getExtraHeaders();
    if (me.exHeaders && me.exHeaders.length > 0) {
      me.exHeaders.forEach(item => {
        headers[item.key] = item.value;
      });
    }
    if (me.useAuditHeader)
      headers['X-endeavour-auditrequest'] =  String(!this.noAudit);

    // Always reset no audit header back to false.
    this.setNoAuditHeader(false);
    return headers;
  }

  /**
   * One time setter to set audit flag to skip messages from logging in audit log
   *
   * @param {boolean} flag
   */
  public setNoAuditHeader(flag: boolean) {
    this.noAudit = flag;
  }

  /**
   * Set the useAuditHeader flag.
   *
   * @param {boolean} flag
   */
  public setUseAuditHeader(flag: boolean) {
    this.useAuditHeader = flag;
  }

  public getBaseUrl(): string {
    // return `https://${this.getHostname(false)}/`; // Use this for testing
    if (productionMode()) {
      return `${location.protocol}//${this.getHostname(false)}/`;
    } else {
      return `${location.protocol}//${this.getHostname(false)}:${(location.protocol === 'http:' ? 8082 : 8443)}/`;
    }
  }

  @GET('{api}')
  public getAll(@PATH('api') api: string,
                @QUERY('filter') filter?: Array<Object>,
                @QUERY('sort') sort?: Array<Object>,
                @QUERY('pageSize') pageSize?: number,
                @QUERY('pageStartIndex') pageStartIndex?: number): Observable<any> {
    return null;
  }

  @GET('{api}/{id}')
  public get(@PATH('api') api: string, @PATH('id') id: string): Observable<any> {
    return null;
  }

  @GET('{url}', true)
  public getByUrl(@PATH('url') url: string,
                  @QUERY('filter') filter?: Array<Object>,
                  @QUERY('sort') sort?: Array<Object>,
                  @QUERY('pageSize') pageSize?: number,
                  @QUERY('pageStartIndex') pageStartIndex?: number): Observable<any> {
    return null;
  }

  @POST('{api}')
  public post(@PATH('api') api: string, @BODY payload: Object,
              @OBSERVE observe?: RestObserveType, @RESPONSETYPE responseType?: RestResponseType): Observable<any> {
    return null;
  }

  @POST('{url}', true)
  public postByUrl(@PATH('url') url: string, @BODY payload: Object,
                   @OBSERVE observe?: RestObserveType, @RESPONSETYPE responseType?: RestResponseType): Observable<any> {
    return null;
  }

  @PUT('{api}/{id}')
  public put(@PATH('api') api: string, @PATH('id') id: string, @BODY payload: Object,
             @OBSERVE observe?: RestObserveType, @RESPONSETYPE responseType?: RestResponseType): Observable<any> {
    return null;
  }

  @PUT('{url}', true)
  public putByUrl(@PATH('url') url: string, @BODY payload: Object,
                  @OBSERVE observe?: RestObserveType, @RESPONSETYPE responseType?: RestResponseType): Observable<any> {
    return null;
  }

  @DELETE('{api}/{id}')
  public delete(@PATH('api') api: string, @PATH('id') id: string,
                @OBSERVE observe?: RestObserveType, @RESPONSETYPE responseType?: RestResponseType): Observable<any> {
    return null;
  }

  @DELETE('{url}', true)
  public deleteByUrl(@PATH('url') url: string,
                     @OBSERVE observe?: RestObserveType,
                     @RESPONSETYPE responseType?: RestResponseType): Observable<any> {
    return null;
  }

  public extraHeaders(headers?: { key: string, value: string }[]) {
    this.exHeaders = headers || [];
  }

  public getPage(api: string,
                 filter?: Array<Object>,
                 sort?: Array<Object>,
                 pageStartIndex: number = 0,
                 pageSize: number = RestService.pageSize): Observable<any> {
    return this.getAll(api, filter, sort, pageSize, pageStartIndex);
  }

  public getPageByUrl(url: string,
                      filter?: Array<Object>,
                      sort?: Array<Object>,
                      pageStartIndex: number = 0,
                      pageSize: number = RestService.pageSize): Observable<any> {
    return this.getByUrl(url, filter, sort, pageSize, pageStartIndex);
  }
}
