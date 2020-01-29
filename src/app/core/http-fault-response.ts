import {HttpRequest, HttpErrorResponse} from '@angular/common/http';

export class HttpFaultResponse extends HttpErrorResponse {
  private _request: any = undefined;

  get request(): any {
    return this._request;
  }

  set request(req: any) {
    this._request = req;
  }
    
}
