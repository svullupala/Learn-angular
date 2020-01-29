import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {dummyData} from './dummy.data';
import {DummyEntry, DummyEntryPlain} from './dummy.entry';
import {ErrorModel} from 'shared/models/error.model';
import {environment} from '../environment';

@Injectable()
export class DummyService {

  /**
   * Change enabled to true when interact with dummy data.
   * @type {boolean}
   */
  public enabled: boolean = environment.DummyServiceEnabled;


  private dummyData: DummyEntry[] = [];

  constructor(private http: HttpClient) {

    this.loadData();
  }

  /**
   * Handle method.
   *
   * @param {method} method
   * @param {string} targetUrl
   * @returns {Observable<Object>}
   */
  public handle(method: string, targetUrl: string): Observable<Object> {
    let entry = this.getEntry(method, targetUrl), result;
    if (entry) {
      if (entry.error) {
        return Observable.throw(entry.error);
      } else {
        if (entry.response) {
          result = entry.response;
          return Observable.of(result).delay(entry.delay ? entry.delay : 1000).do(val => val);
        }
      }
    }
    return undefined;
  }

  /**
   * Retrieves the matched dummy entry.
   *
   * @param {string} method
   * @param {string} targetUrl
   * @returns {DummyEntry}
   */
  private getEntry(method: string, targetUrl: string): DummyEntry {
    return this.dummyData.find(function (entry: DummyEntry) {
      return method === entry.method && !!(targetUrl || '').match(entry.pattern);
    });
  }

  private loadCategory(fileName: string): void {
    let me = this, observable = me.http.get<Array<DummyEntryPlain>>(dummyData.targetDir + fileName);
    if (observable) {
      observable.subscribe((records) => {
        (records || []).forEach(function (entry: DummyEntryPlain) {
          me.dummyData.push({
            method: entry.method,
            pattern: entry.regexp ? new RegExp(entry.pattern) : entry.pattern,
            response: entry.response ? entry.response : undefined,
            delay: entry.delay ? entry.delay : undefined,
            error: entry.error ? new ErrorModel(entry.error.title, entry.error.message, entry.error.id) : undefined
          });
        });
      });
    }
  }

  private loadData(): void {
    let me = this, files = dummyData.files || [];
    if (me.enabled) {
      files.forEach(function (file) {
        me.loadCategory(file);
      });
    }
  }
}
