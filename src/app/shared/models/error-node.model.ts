import {JsonObject, JsonProperty} from 'json2typescript';
import {ErrorModel} from './error.model';
import {JsonConvert} from 'json2typescript';
import {ResponseNodelModel} from './response-node.model';
import * as _ from 'lodash';

@JsonObject
export class ErrorNodeModel extends ResponseNodelModel {

  private _error: ErrorModel;

  public get error(): ErrorModel {
    if (!this._error && this.response) {
      let err: ErrorModel;
      try {
        if (typeof(this.response) === 'string') {
          console.log('response=' + this.response);
          // Decode the response
          if (this.response.startsWith('"{') && this.response.endsWith('}"')) {
            this.response = JSON.parse(this.response);
          }
        }
        if (typeof(this.response) === 'string') {
          err = JsonConvert.deserializeString(this.response, ErrorModel);
        } else {
          if (_.isObject(this.response['response'])) {
            err = JsonConvert.deserializeObject(this.response['response'], ErrorModel);
          } else {
            err = JsonConvert.deserializeObject(this.response, ErrorModel);
          }
        }
      } catch (e) {
        err = new ErrorModel(e['name'], e['message']);
      }
      this._error = err;
    }
    return this._error;
  }

}
