import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

import {
  RESTClient, GET, PUT, POST, DELETE,
  BaseUrl, Headers, HEADER, PATH, BODY, QUERY, OBSERVE, RESPONSETYPE
} from './rest.client';
import {productionMode} from '../environment';
import {DummyService} from '../dummy/dummy.service';

export interface HasNodeAPI {
  nodeApi(): string;
}

export type NodeObserveType = 'body' | 'response';
export type NodeResponseType = 'json' | 'text';

@Injectable()
export class NodeService extends RESTClient {

  static pageSize: number = 100;

  private exHeaders: { key: string, value: string }[] = [];

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
    headers['X-endeavour-node'] = String(true);
    return headers;
  }

  public getBaseUrl(): string {
    if (productionMode()) {
      return `${location.protocol}//${this.getHostname(true)}/`;
    } else {
      return `${location.protocol}//${this.getHostname(true)}:8083/`;
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
              @OBSERVE observe?: NodeObserveType, @RESPONSETYPE responseType?: NodeResponseType): Observable<any> {
    return null;
  }

  @POST('{url}', true)
  public postByUrl(@PATH('url') url: string, @BODY payload: Object,
                   @OBSERVE observe?: NodeObserveType, @RESPONSETYPE responseType?: NodeResponseType): Observable<any> {
    return null;
  }

  @PUT('{api}/{id}')
  public put(@PATH('api') api: string, @PATH('id') id: string, @BODY payload: Object,
             @OBSERVE observe?: NodeObserveType, @RESPONSETYPE responseType?: NodeResponseType): Observable<any> {
    return null;
  }

  @PUT('{url}', true)
  public putByUrl(@PATH('url') url: string, @BODY payload: Object,
                  @OBSERVE observe?: NodeObserveType, @RESPONSETYPE responseType?: NodeResponseType): Observable<any> {
    return null;
  }

  @DELETE('{api}/{id}')
  public delete(@PATH('api') api: string, @PATH('id') id: string,
                @OBSERVE observe?: NodeObserveType, @RESPONSETYPE responseType?: NodeResponseType): Observable<any> {
    return null;
  }

  @DELETE('{url}', true)
  public deleteByUrl(@PATH('url') url: string,
                     @OBSERVE observe?: NodeObserveType,
                     @RESPONSETYPE responseType?: NodeResponseType): Observable<any> {
    return null;
  }

  public extraHeaders(headers?: { key: string, value: string }[]) {
    this.exHeaders = headers || [];
  }

  public getPage(api: string,
                 filter?: Array<Object>,
                 sort?: Array<Object>,
                 pageStartIndex: number = 0,
                 pageSize: number = NodeService.pageSize): Observable<any> {
    return this.getAll(api, filter, sort, pageSize, pageStartIndex);
  }

  public getPageByUrl(url: string,
                      filter?: Array<Object>,
                      sort?: Array<Object>,
                      pageStartIndex: number = 0,
                      pageSize: number = NodeService.pageSize): Observable<any> {
    return this.getByUrl(url, filter, sort, pageSize, pageStartIndex);
  }
}
