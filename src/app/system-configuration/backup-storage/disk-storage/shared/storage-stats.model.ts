import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {HasAPI, HasNewOperator, HasProxyAndAPI} from 'shared/models/dataset.model';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {StorageStatModel} from 'diskstorage/shared/storage-stat.model';

@JsonObject
export class StorageStatsModel extends BaseModel implements HasAPI {

  @JsonProperty('sizeTotalAllStorage', Number, true)
  public sizeTotalAllStorage: number = 0;

  @JsonProperty('deduplicationRatio', String, true)
  public deduplicationRatio: string = undefined;

  @JsonProperty('compressionRatio', String, true)
  public compressionRatio: string = undefined;

  @JsonProperty('sizeUsedAllStorage', Number, true)
  public sizeUsedAllStorage: number = 0;

  @JsonProperty('sizeFreeAllStorage', Number, true)
  public sizeFreeAllStorage: number = 0;

  @JsonProperty('available', Number, true)
  public available: number = 0;

  @JsonProperty('unavailable', Number, true)
  public unavailable: number = 0;

  @JsonProperty('full', Number, true)
  public full: number = 0;

  @JsonProperty('total', Number, true)
  public total: number = 0;

  @JsonProperty('unavailableStorage', [StorageStatModel], true)
  public unavailableStorage: StorageStatModel[] = [];

  @JsonProperty('fullStorage', [StorageStatModel], true)
  public fullStorage: StorageStatModel[] = [];

  @JsonProperty('availableStorage', [StorageStatModel], true)

  /**
   * A static method to retrieve stats data from server-side by the given type, model class, proxy,
   * optional filters and extraParams parameters.
   *
   * @param classObject The model class.
   * @param proxy {RestService} The data proxy service.
   * @param filters {Array<FilterModel>} optional filters.
   * @param extraParams {Array<NvPairModel>} optional extra params which will append to the request URL.
   *        e.g. If need a URL like 'http://.../api/xxx?from=hlo', pass extra parameters as below.
   *        [ new NvPairModel('from', 'hlo') ]
   * @returns {Observable<StorageStatsModel>}
   */
  public static retrieve(classObject: HasNewOperator<HasProxyAndAPI>,
                         proxy: RestService,
                         filters?: Array<FilterModel>,
                         extraParams?: Array<NvPairModel>): Observable<StorageStatsModel> {
    let observable: Observable<Object>, result: Observable<StorageStatsModel>,
      api = classObject.prototype.api(), params = '';
    if (extraParams) {
      extraParams.forEach(function (param, idx) {
        params += (idx === 0) ? '?' : '&';
        params += `${param.name}=${encodeURIComponent(param.value)}`;
      });
      api += params;
    }
    observable = proxy.getAll(api, FilterModel.array2json(filters));
    result = observable.map((body: Object) => {
      let data;
      // data = {
      //   'links': {
      //     'self': {
      //       'rel': 'self',
      //       'href': 'https://IP/api/storage/stats',
      //       'hreflang': null,
      //       'media': null,
      //       'title': null,
      //       'type': null,
      //       'deprecation': null
      //     }
      //   },
      //   'sizeTotalAllStorage': 1091987361584,
      //   'sizeUsedAllStorage': 771400821760,
      //   'sizeFreeAllStorage': 320586539824,
      //   'available': 2,
      //   'unavailable': 1,
      //   'full': 0,
      //   'unavailableStorage': [{
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/4/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '4aaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaa',
      //       'sizeTotal': 0,
      //       'sizeUsed': 0,
      //       'sizeFree': 0,
      //       'writable': false,
      //       'site': 'Primary',
      //       'description': null,
      //       'compressionRatio': null,
      //       'deduplicationRatio': null,
      //       'type': 'vsnap',
      //       'errorDescription': 'Storage is not available',
      //       'time': '14:21:21'
      //     }, {
      //     'links': {
      //       'self': {
      //         'rel': 'self',
      //         'href': 'https://IP/api/storage/4/stats',
      //         'hreflang': null,
      //         'media': null,
      //         'title': null,
      //         'type': null,
      //         'deprecation': null
      //       }
      //     },
      //     'storageId': '4aaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaa',
      //     'sizeTotal': 0,
      //     'sizeUsed': 0,
      //     'sizeFree': 0,
      //     'writable': false,
      //     'site': 'Primary',
      //     'description': null,
      //     'compressionRatio': null,
      //     'deduplicationRatio': null,
      //     'type': 'vsnap',
      //     'errorDescription': 'Storage is not available',
      //     'time': '14:21:21'
      //   }, {
      //     'links': {
      //       'self': {
      //         'rel': 'self',
      //         'href': 'https://IP/api/storage/4/stats',
      //         'hreflang': null,
      //         'media': null,
      //         'title': null,
      //         'type': null,
      //         'deprecation': null
      //       }
      //     },
      //     'storageId': '4aaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaa',
      //     'sizeTotal': 0,
      //     'sizeUsed': 0,
      //     'sizeFree': 0,
      //     'writable': false,
      //     'site': 'Primary',
      //     'description': null,
      //     'compressionRatio': null,
      //     'deduplicationRatio': null,
      //     'type': 'vsnap',
      //     'errorDescription': 'Storage is not available',
      //     'time': '14:21:21'
      //   }, {
      //     'links': {
      //       'self': {
      //         'rel': 'self',
      //         'href': 'https://IP/api/storage/4/stats',
      //         'hreflang': null,
      //         'media': null,
      //         'title': null,
      //         'type': null,
      //         'deprecation': null
      //       }
      //     },
      //     'storageId': '4aaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaa',
      //     'sizeTotal': 0,
      //     'sizeUsed': 0,
      //     'sizeFree': 0,
      //     'writable': false,
      //     'site': 'Primary',
      //     'description': null,
      //     'compressionRatio': null,
      //     'deduplicationRatio': null,
      //     'type': 'vsnap',
      //     'errorDescription': 'Storage is not available',
      //     'time': '14:21:21'
      //   }, {
      //     'links': {
      //       'self': {
      //         'rel': 'self',
      //         'href': 'https://IP/api/storage/4/stats',
      //         'hreflang': null,
      //         'media': null,
      //         'title': null,
      //         'type': null,
      //         'deprecation': null
      //       }
      //     },
      //     'storageId': '4aaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaa',
      //     'sizeTotal': 0,
      //     'sizeUsed': 0,
      //     'sizeFree': 0,
      //     'writable': false,
      //     'site': 'Primary',
      //     'description': null,
      //     'compressionRatio': null,
      //     'deduplicationRatio': null,
      //     'type': 'vsnap',
      //     'errorDescription': 'Storage is not available',
      //     'time': '14:21:21'
      //   }
      //   ],
      //   'availableStorage': [],
      //   'fullStorage': [
      //     {
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/2/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '2vvvvvvvvvvvvvvvvvvvvv vvvvvvvvvvvvvvvvvvvvvvv',
      //       'sizeTotal': 513118788400,
      //       'sizeUsed': 411699785216,
      //       'sizeFree': 101419003184,
      //       'writable': true,
      //       'site': 'Primary',
      //       'description': null,
      //       'compressionRatio': '4.23',
      //       'deduplicationRatio': '1.29',
      //       'type': 'vsnap',
      //       'errorDescription': null,
      //       'time': '14:21:21'
      //     },
      //     {
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/3/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '3',
      //       'sizeTotal': 578868573184,
      //       'sizeUsed': 359701036544,
      //       'sizeFree': 219167536640,
      //       'writable': true,
      //       'site': 'NYC',
      //       'description': null,
      //       'compressionRatio': '2.35',
      //       'deduplicationRatio': '1.0',
      //       'type': 'vsnap',
      //       'errorDescription': null,
      //       'time': '14:21:21'
      //     }, {
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/2/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '2vvvvvvvvvvvvvvvvvvvvv vvvvvvvvvvvvvvvvvvvvvvv',
      //       'sizeTotal': 513118788400,
      //       'sizeUsed': 411699785216,
      //       'sizeFree': 101419003184,
      //       'writable': true,
      //       'site': 'Primary',
      //       'description': null,
      //       'compressionRatio': '4.23',
      //       'deduplicationRatio': '1.29',
      //       'type': 'vsnap',
      //       'errorDescription': null,
      //       'time': '14:21:21'
      //     },
      //     {
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/3/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '3',
      //       'sizeTotal': 578868573184,
      //       'sizeUsed': 359701036544,
      //       'sizeFree': 219167536640,
      //       'writable': true,
      //       'site': 'NYC',
      //       'description': null,
      //       'compressionRatio': '2.35',
      //       'deduplicationRatio': '1.0',
      //       'type': 'vsnap',
      //       'errorDescription': null,
      //       'time': '14:21:21'
      //     }, {
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/2/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '2vvvvvvvvvvvvvvvvvvvvv vvvvvvvvvvvvvvvvvvvvvvv',
      //       'sizeTotal': 513118788400,
      //       'sizeUsed': 411699785216,
      //       'sizeFree': 101419003184,
      //       'writable': true,
      //       'site': 'Primary',
      //       'description': null,
      //       'compressionRatio': '4.23',
      //       'deduplicationRatio': '1.29',
      //       'type': 'vsnap',
      //       'errorDescription': null,
      //       'time': '14:21:21'
      //     },
      //     {
      //       'links': {
      //         'self': {
      //           'rel': 'self',
      //           'href': 'https://IP/api/storage/3/stats',
      //           'hreflang': null,
      //           'media': null,
      //           'title': null,
      //           'type': null,
      //           'deprecation': null
      //         }
      //       },
      //       'storageId': '3',
      //       'sizeTotal': 578868573184,
      //       'sizeUsed': 359701036544,
      //       'sizeFree': 219167536640,
      //       'writable': true,
      //       'site': 'NYC',
      //       'description': null,
      //       'compressionRatio': '2.35',
      //       'deduplicationRatio': '1.0',
      //       'type': 'vsnap',
      //       'errorDescription': null,
      //       'time': '14:21:21'
      //     }
      //   ],
      //   'compressionRatio': '3.29',
      //   'deduplicationRatio': '1.145'
      // };
      data = body;
      let record: StorageStatsModel;
      try {
        record = <StorageStatsModel>JsonConvert.deserializeObject(data, classObject);
        record.proxy = proxy;
      } catch (e) {
      }
      return record;
    }).catch((error: HttpErrorResponse) => Observable.throw(error));
    return result;
  }

  /**
   * Implements api method and returns a string indicates where the dataset will be retrieved from.
   * Note: the method will be invoked via classObject.prototype.api(), this occurs before an instance
   * of classObject is created. So can NOT use instance variables to build the return value, BUT can use
   * a foreign or static string, normally hard coding a const string is suggested.
   * @returns {string}
   */
  api(): string {
    return 'api/storage/stats';
  }
}
