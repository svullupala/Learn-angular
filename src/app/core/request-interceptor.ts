import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { HttpFaultResponse } from './http-fault-response';
import { Observable } from 'rxjs/Observable';
import { SessionService } from './session.service';
import { AlertComponent, AlertType } from 'shared/components/msgbox/alert.component';
import { LocaleService } from 'shared/locale.service';


export class RequestInterceptor implements HttpInterceptor {
  private alert: AlertComponent;

  public constructor() {
  }


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let clonedReq = req, node = req.headers.has('X-endeavour-node'),
      i18n = req.url.indexOf('/assets/i18n/') !== -1,
      // don't use slash after help since there is help-map and help-content
      help = req.url.indexOf('/assets/help') !== -1;

    if (i18n || help)
      return next.handle(req);

    if (SessionService.getInstance().isAuthenticated) {
      clonedReq = req.clone({
        setHeaders: {
          'X-Endeavour-Sessionid': SessionService.getInstance().sessionId,
          'X-Endeavour-Locale': LocaleService.getHeaderLangID()
        }
      });
    } else {
      clonedReq = req.clone({ setHeaders: { 'X-Endeavour-Locale': LocaleService.getHeaderLangID() } });
    }

    if (node) {
      clonedReq = clonedReq.clone({ headers: clonedReq.headers.delete('X-endeavour-node') });
    }

    return next.handle(clonedReq).map((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse && event.body && event.body.responseMessage) {
        this.showResponseMessage(event.body.responseMessage.title, event.body.responseMessage.content, event.body.responseMessage.type);
      }
      return event;
    }).catch((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (err['error'] != null 
            && err['error']['response'] != null 
            && err['error']['response']['response'] != null
            && err['error']['response']['response']['id'] === "XSBMissingSessionidException") {
          window.location.href = '/login';          
        }
      }
      let fault: HttpFaultResponse = <HttpFaultResponse>err;
      fault.request = clonedReq;
      return Observable.throw(fault);
    });
  }

  private showResponseMessage(title: string, message: string, type: string) {
    this.getAlertMsgBox().show(title, message, this.getAlertType(type));
  }

  private getAlertType(type: string): AlertType {
    if (type === undefined) {
      return AlertType.INFO;
    }

    switch (type.toUpperCase()) {
      case 'ERROR': {
        return AlertType.ERROR;
      }
      case 'WARNING': {
        return AlertType.WARNING;
      }
      default: {
        return AlertType.INFO;
      }
    }
  }

  private getAlertMsgBox(): AlertComponent {
    if (this.alert === undefined) {
      this.alert = SessionService.getInstance().context['msgbox.alert'];
    }

    return this.alert;
  }
}
