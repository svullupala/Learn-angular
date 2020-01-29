import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';
import {AlertMessageModel} from './alert-message.model';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {HttpErrorResponse} from '@angular/common/http';

@JsonObject
export class AlertMessagesModel extends DatasetModel<AlertMessageModel> implements HasAPI {

  @JsonProperty('alerts', [AlertMessageModel])
  public messages: Array<AlertMessageModel> = [];

  protected getRecords(): Array<AlertMessageModel> {
    return this.messages;
  }

  /**
   * Sends a POST request for the specified action to server side by the given generic type, model class, action name,
   * payload and proxy.
   *
   * @param {{new() => T}} classObject The model class.
   * @param {string} name The action name
   * @param {Object} payload Optional payload.
   * @param {RestService} proxy Optional data proxy service.
   * @returns {Observable<T extends HasProxy>}
   */
  postAction<T>(classObject: { new(): T },
                name: string, payload: Object,
                proxy: RestService): Observable<T> {
    let me = this, observable: Observable<Object>, result: Observable<T>,
      link = me.getLink(name);
    if (link && proxy) {
      observable = proxy.postByUrl(link.href, payload);
      result = observable.map((body: Object) => {
        const data = body;
        let updated: T;
        try {
          updated = <T>JsonConvert.deserializeObject(data, classObject);
        } catch (e) {
        }
        return updated;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
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
    return 'api/endeavour/alert/message';
  }
}
