import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {isObject} from 'rxjs/util/isObject';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {ErrorModel} from '../../models/error.model';
import {ErrorNodeModel} from '../../models/error-node.model';
import {AlertType, AlertComponent} from '../../components';
import {SessionService} from 'core';
import {SharedService} from 'shared/shared.service';
import {RestService} from 'core';
import {NodeService} from 'core';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'error-handler',
  template: ''
})
export class ErrorHandlerComponent implements OnInit {

  @Output() sessionExpired = new EventEmitter();

  private alert: AlertComponent;
  private textCoreService: string;
  private textNodeService: string;
  private errorTitle: string;
  private textUnknownError: string;
  private textUnexpectedNetworkError: string;
  private textTemporaryNetworkError: string;
  private textSessionExpiredError: string;
  private textSessionExpiredTitle: string;
  private textServerNotRespondingError: string;
  private textServerRequestFailedError: string;
  private textInternalServiceError: string;
  constructor(private translate: TranslateService, private core: RestService, private node: NodeService) {
  }

  /**
   * Processes the error from the AJAX request and if applicable,
   * raises an event - sessionExpired.
   * @param err The error from the ajax request or application.
   * @param node True if the error comes from the NodeJS service, optional.
   * @param silence True if do NOT want to show a message box, optional.
   * @returns {ErrorModel} An error model instance or undefined if there isn't a real error (status is 200 or 201).
   */
  handle(err: HttpErrorResponse | ErrorModel, node?: boolean, silence?: boolean): ErrorModel {
    // When ran the app without having any backend, the err._body is a ProcessEvent object
    // instead of a string, and err.status equals to 0. For now, all the cases we assume that
    // an unexpected network error has occurred. More testing is needed in the future.

    let me = this, isHttpError = err instanceof HttpErrorResponse, eo: any = err,
      status = isHttpError && isObject(eo) ? eo.status || 0 : 0,
      validSession = me.isValidSession(),
      message = node ? me.textTemporaryNetworkError : me.textUnexpectedNetworkError,
      error = isHttpError ? me.parseError(eo, {
        title: ErrorModel.unexpectedNetworkException, message: message, id: ErrorModel.unexpectedNetworkException
      }, node) : eo as ErrorModel;
    if (error) {
      // Fix error title if session is expired.
      if (me.isSessionExpired(error)) {
        error.title = me.textSessionExpiredTitle;
      }

      // Fix error message.
      message = (validSession && me.isSessionExpired(error)) ?
        me.textSessionExpiredError :
        status > 0 ? (
            (error.id !== ErrorModel.unexpectedNetworkException && error.message && error.message.length > 0) ?
              error.message :
              ((!validSession && status === 404) ? me.textServerNotRespondingError : me.textServerRequestFailedError)) :
          error.message;
      if (status === 500 && err.message && (err.message === 'API' || err.message === 'NGP')) {
        me.textInternalServiceError = SharedService.formatString(this.textInternalServiceError, err.message);
        error.message = me.textInternalServiceError;
      } else {
        error.message = message;
      }

      if (silence)
        me.sessionExpiredHandler(error);
    }
    me.showHideError(error, err, silence);
    return error;
  }


  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.coreService',
      'common.nodeService',
      'common.errorTitle',
      'common.textUnknownError',
      'common.textUnexpectedNetworkError',
      'common.textTemporaryNetworkError',
      'common.textSessionExpiredError',
      'common.textSessionExpiredTitle',
      'common.textServerNotRespondingError',
      'common.textServerRequestFailedError',
      'common.textInternalServerError'])
      .subscribe((resource: Object) => {
        me.textCoreService = resource['common.coreService'];
        me.textNodeService = resource['common.nodeService'];
        me.errorTitle = resource['common.errorTitle'];
        me.textUnknownError = resource['common.textUnknownError'];
        me.textUnexpectedNetworkError = resource['common.textUnexpectedNetworkError'];
        me.textTemporaryNetworkError = resource['common.textTemporaryNetworkError'];
        me.textSessionExpiredError = resource['common.textSessionExpiredError'];
        me.textSessionExpiredTitle = resource['common.textSessionExpiredTitle'];
        me.textServerNotRespondingError = resource['common.textServerNotRespondingError'];
        me.textServerRequestFailedError = resource['common.textServerRequestFailedError'];
        me.textInternalServiceError = resource['common.textInternalServerError'];
      });
    JsonConvert.valueCheckingMode = JsonConvert.ValueCheckingMode.ALLOW_NULL;
    if (me.isValidSession() && me.isValidConext())
      me.alert = me.getAlertInstance();
  }

  private isSuccessStatus(err: HttpErrorResponse): boolean {
    return err && err.status >= 200 && err.status <= 299;
  }

  private parseError(err: HttpErrorResponse, defaultConfig?: { title: string, message: string, id?: string },
                     node?: boolean): ErrorModel {
    let me = this, error: ErrorModel;
    if (err && err.status > 0) {

      if (!me.isSuccessStatus(err)) {
        if (err.error) {
          try {
            if (typeof(err.error) === 'string') {
              error = (node === true) ? JsonConvert.deserializeString(err.error, ErrorNodeModel).error :
                JsonConvert.deserializeString(err.error, ErrorModel);
            } else if (isObject(err.error)) {
              error = (node === true) ? JsonConvert.deserializeObject(err.error, ErrorNodeModel).error :
                JsonConvert.deserializeObject(err.error, ErrorModel);
            }
          } catch (e) {
              error = new ErrorModel(me.errorTitle, JSON.stringify(err.error));
          }
        } else if (err.message) {
          error = new ErrorModel(me.errorTitle, err.message);
        }

        if (!error)
          error = new ErrorModel(me.errorTitle, err.statusText || '');
      }

    } else {
      if (defaultConfig)
        error = new ErrorModel(defaultConfig.title, defaultConfig.message, defaultConfig.id);
      else
        error = new ErrorModel(me.errorTitle, me.textUnknownError);
    }
    return error;
  }

  /**
   * Returns true if there is a valid session.
   *
   * @method isValidSession
   * @return {boolean}
   */
  private isValidSession(): boolean {
    return SessionService.getInstance().isValidSession();
  }

  /**
   * Returns true if there is a valid session context(NOT empty).
   *
   * @method isValidSession
   * @return {boolean}
   */
  private isValidConext(): boolean {
    return !!SessionService.getInstance().isValidContext();
  }

  /**
   * Gets the msgbox.alert instance saved in session context.
   *
   * @method getAlertInstance
   * @return {AlertComponent}
   */
  private getAlertInstance(): AlertComponent {
    return SessionService.getInstance().context['msgbox.alert'];
  }

  private isSessionExpired(error: ErrorModel): boolean {
    return error && (error.id === 'XSBSessionDoesNotExistException' || error.id === 'XSBMissingSessionidException');
  }

  private sessionExpiredHandler(error: ErrorModel): void {
    let me = this;
    if (me.isSessionExpired(error)) {
      me.sessionExpired.emit();
    }
  }

  private prettyExceptionTitle(error: ErrorModel): string {
    if (error.id && !SharedService.hasWhiteSpace(error.id) && error.id.endsWith('Exception')) {
      if (error.id.startsWith('XSB')) {
        return SharedService.formatCamelCase(error.id.substr(3));
      } else {
        return SharedService.formatCamelCase(error.id);
      }
    }
    
    return error.id;
  }

  private showHideError(error: ErrorModel, err: any, silence?: boolean): void {
    let me = this, force = false;
    if (me.alert) {
      if (error) {
        if (me.isSessionExpired(error)) {
          let subscriber = me.alert.hideEvent.subscribe(() => {
            subscriber.unsubscribe();
            me.sessionExpired.emit();
          });
          force = true;
        }
        if (force || !silence)
          me.alert.show(error.title || me.prettyExceptionTitle(error) || me.errorTitle, error.message, AlertType.ERROR, () => {}, () => {}, 3000, false, false, err);
        else
          me.alert.hide();
      } else {
        me.alert.hide();
      }
    }
  }
}
