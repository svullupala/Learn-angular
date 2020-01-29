import {HttpParams} from '@angular/common/http';

import {environment} from '../environment';

export class UrlService {
  /**
   * To manipulate request URL that is made by this AngularUI to both NodeJS and core services.
   *
   * This method examines incoming request URL, fix location.protocol, hostname, port, and related Zuul path to hack
   * around the incorrect URL that is sent back by both core and nodejs service.  This is a temporary hack for SPP 3.0
   * and the engineering team has agreed to undo this hack and solve this issue "correctly" in future releases.
   *
   * @param {string} originalUrl - original URL of the request
   * @param {boolean} node - true if this is a NodeJS call
   * @returns {string} manipulated URL string
   */
  public static fixRequestUrl(originalUrl: string, node: boolean): string {
    let UI_RUNS_ON_PORT = 443;

    /**
     * Fixes sort & filter parameters.
     * @param {string} url The given URL.
     * @returns {string} The overridden URL.
     */
    function fixSortFilterParams(url: string): string {
      let idx = url.indexOf('?'), hasQueryString = idx !== -1,
        queryString = hasQueryString ? url.substring(idx + 1) : '',
        params = new HttpParams({fromString: queryString}),
        hasSort = params.has('sort'),
        hasFilter = params.has('filter');

      if (hasSort)
        params = params.set('sort', decodeURIComponent(params.get('sort')));
      if (hasFilter) {
        // By debugging, found the real appliance runs on ZUUL server supports the raw question mark pattern match,
        // add special processing for the question mark.
        let hasQuestionMark = false, decoded = decodeURIComponent(params.get('filter')), filter = JSON.parse(decoded);
        if (Array.isArray(filter)) {
          filter.forEach(function(item) {
            if (item.value && typeof(item.value) === 'string' && item.value.indexOf('%3F') !== -1) {
              item.value = decodeURIComponent(item.value);
              hasQuestionMark = true;
            }
          });
          if (hasQuestionMark)
            decoded = JSON.stringify(filter);
        }
        params = params.set('filter', decoded);
      }

      return hasQueryString ? (url.substring(0, idx + 1) + params.toString()) : url;
    }

    function getHostname(): string {
      return node ?
        (environment.NODE_SERVER || location.hostname) :
        (environment.REST_SERVER || location.hostname);
    }

    if (originalUrl === undefined || originalUrl === '') {
      return '';
    }

    let urlArray = originalUrl.split('?');
    let parser = document.createElement('a');

    parser.href = urlArray[0];

    if (parser.protocol !== location.protocol) {
      parser.protocol = location.protocol;
    }
    if (parser.hostname !== getHostname()) {
      parser.hostname = getHostname();
    }
    if (parser.port !== location.port) {
      if (location.port === '') {
        parser.port = UI_RUNS_ON_PORT.toString();
      } else {
        parser.port = location.port;
      }
    }
    if (parser.pathname.indexOf((node ? 'spp' : 'core')) === -1) {
      parser.pathname = (node ? '/spp' : '/core') + parser.pathname;
    }

    let result = parser.protocol + '//' + parser.host + parser.pathname;
    if (urlArray.length > 1) {
      result += '?' + urlArray[1];
    }

    // Fix sort & filter parameters.
    result = fixSortFilterParams(result);

    return result;
  }
}
