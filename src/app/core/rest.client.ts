/*

 Rest Client.
 Based on angular2-rest project(https://github.com/Paldom/angular2-rest),
 refactor it for compatibility with Angular 5.

 - Add Parameter Decorators:
 @OBSERVE(string)
 @RESPONSETYPE(string)
 */
/*

 angular2-rest
 (c) Domonkos Pal
 License: MIT

 Table of Contents:

 - class RESTClient

 - Class Decorators:
 @BaseUrl(String)

 - Method Decorators:
 @GET(url: String)
 @POST(url: String)
 @PUT(url: String)
 @DELETE(url: String)
 @Headers(object)

 - Parameter Decorators:
 @PATH(string)
 @QUERY(string)
 @HEADER(string)
 @BODY
 */

import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {environment} from '../environment';
import {DummyService} from '../dummy/dummy.service';


/**
 * Angular X RESTClient class.
 *
 * @class RESTClient
 * @constructor
 */
export class RESTClient {
  protected http: HttpClient = null;
  protected dummy: DummyService = null;

  public constructor(http: HttpClient, dummy: DummyService) {
    this.http = http;
    this.dummy = dummy;
  }

  protected getBaseUrl(): string {
    return null;
  }

  protected getDefaultHeaders(): {
    [name: string]: string | string[];
  } {
    return {};
  }

  protected getExtraHeaders(): {
    [name: string]: string | string[];
  } {
    return {};
  }

  protected getHostname(node: boolean): string {
    return node ?
      (environment.NODE_SERVER || location.hostname) :
      (environment.REST_SERVER || location.hostname);
  }
}

/**
 * Set the base URL of REST resource
 * @param {String} url - base URL
 */
export function BaseUrl(url: string) {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    target.prototype.getBaseUrl = function () {
      return url;
    };
    return target;
  };
}

function paramBuilder(paramName: string) {
  return function (key: string) {
    return function (target: RESTClient, propertyKey: string | symbol, parameterIndex: number) {
      let metadataKey = `${propertyKey}_${paramName}_parameters`;
      let paramObj: any = {
        key: key,
        parameterIndex: parameterIndex
      };
      if (Array.isArray(target[metadataKey])) {
        target[metadataKey].push(paramObj);
      } else {
        target[metadataKey] = [paramObj];
      }
    };
  };
}

/**
 * Path variable of a method's url, type: string
 * @param {string} key - path key to bind value
 */
export let PATH = paramBuilder('Path');
/**
 * Query value of a method's url, type: string
 * @param {string} key - query key to bind value
 */
export let QUERY = paramBuilder('Query');
/**
 * Body of a REST method, type: key-value pair object
 * Only one body per method!
 */
export let BODY = paramBuilder('Body')('Body');
/**
 * Custom header of a REST method, type: string
 * @param {string} key - header key to bind value
 */
export let HEADER = paramBuilder('Header');

/**
 * Observe value of POST/PUT/DELETE method, type: string.
 * It could be 'body' or 'response', defaults to 'body'.
 */
export let OBSERVE = paramBuilder('Observe')('Observe');

/**
 * ResponseType value of POST/PUT/DELETE method, type: string.
 * It could be 'json' or 'text', defaults to 'json'.
 */
export let RESPONSETYPE = paramBuilder('ResponseType')('ResponseType');

/**
 * Set custom headers for a REST method
 * @param {Object} headersDef - custom headers in a key-value pair
 */
export function Headers(headersDef: any) {
  return function (target: RESTClient, propertyKey: string, descriptor: any) {
    descriptor.headers = headersDef;
    return descriptor;
  };
}

function methodBuilder(method: string) {
  return function (url: string, fullPath?: boolean) {
    return function (target: RESTClient, propertyKey: string, descriptor: any) {

      let pPath = target[`${propertyKey}_Path_parameters`];
      let pQuery = target[`${propertyKey}_Query_parameters`];
      let pBody = target[`${propertyKey}_Body_parameters`];
      let pHeader = target[`${propertyKey}_Header_parameters`];
      let pObserve = target[`${propertyKey}_Observe_parameters`];
      let pResponseType = target[`${propertyKey}_ResponseType_parameters`];

      descriptor.value = function (...args: any[]) {

        // Observe
        let observe: 'body' | 'response' = 'body';
        if (pObserve) {
          observe = args[pObserve[0].parameterIndex];
          if (observe !== 'response')
            observe = 'body';
        }

        // ResponseType
        let responseType: 'json' | 'text' = 'json';
        if (pResponseType) {
          responseType = args[pResponseType[0].parameterIndex];
          if (responseType !== 'text')
            responseType = 'json';
        }

        // Body
        let body = null;
        if (pBody) {
          body = JSON.stringify(args[pBody[0].parameterIndex]);
        }

        // Path
        let resUrl: string = url;
        if (pPath) {
          for (let k in pPath) {
            if (pPath.hasOwnProperty(k)) {
              resUrl = resUrl.replace('{' + pPath[k].key + '}', args[pPath[k].parameterIndex]);
            }
          }
        }

        // Query
        let search = new HttpParams();
        if (pQuery) {
          pQuery
            .filter(p => args[p.parameterIndex]) // filter out optional parameters
            .forEach(p => {
              let key = p.key;
              let value = args[p.parameterIndex];
              // if the value is a instance of Object, we stringify it
              if (value instanceof Object) {
                value = JSON.stringify(value);
              }
              // search.set(encodeURIComponent(key), encodeURIComponent(value));
              search = search.set(encodeURIComponent(key), value);
            });
        }

        // Headers
        // Get default & extra headers
        let headers = this.getDefaultHeaders(), extraHeaders = this.getExtraHeaders();

        // set method specific headers
        for (let k in descriptor.headers) {
          if (descriptor.headers.hasOwnProperty(k)) {
            headers[k] = descriptor.headers[k];
          }
        }

        // set parameter specific headers
        if (pHeader) {
          for (let k in pHeader) {
            if (pHeader.hasOwnProperty(k)) {
              headers[pHeader[k].key] = args[pHeader[k].parameterIndex];
            }
          }
        }

        // set extra headers
        if (extraHeaders) {
          for (let k in extraHeaders) {
            if (extraHeaders.hasOwnProperty(k)) {
              headers[k] = extraHeaders[k];
            }
          }
        }

        // Request options
        let options = {
          headers: new HttpHeaders(headers),
          params: search,
          responseType: responseType,
          observe: observe,
          withCredentials: false
        };

        let targetUrl = fullPath === true ? resUrl : this.getBaseUrl() + resUrl;
        let observable;

        // Dummy data has priority.
        if (this.dummy.enabled) {
          observable = this.dummy.handle(method, targetUrl);
          if (observable) {
            console.log('DummyService intercept : ' + method + ' : ' + targetUrl);
            if (body) {
              console.log('Request Body:' + body);
            }
            return observable;
          }
        }

        // make the request and return the observable for later transformation
        switch (method) {
          case 'GET':
            observable = this.http.get(targetUrl, options);
            break;
          case 'POST':
            observable = this.http.post(targetUrl, body, options);
            break;
          case 'PUT':
            observable = this.http.put(targetUrl, body, options);
            break;
          case 'DELETE':
            observable = this.http.delete(targetUrl, options);
            break;
          case 'HEAD':
            observable = this.http.head(targetUrl, options);
            break;
          default:
            break;
        }
        return observable;
      };

      return descriptor;
    };
  };
}

/**
 * GET method
 * @param {string} url - resource url of the method
 */
export let GET = methodBuilder('GET');
/**
 * POST method
 * @param {string} url - resource url of the method
 */
export let POST = methodBuilder('POST');
/**
 * PUT method
 * @param {string} url - resource url of the method
 */
export let PUT = methodBuilder('PUT');
/**
 * DELETE method
 * @param {string} url - resource url of the method
 */
export let DELETE = methodBuilder('DELETE');
/**
 * HEAD method
 * @param {string} url - resource url of the method
 */
export let HEAD = methodBuilder('HEAD');
