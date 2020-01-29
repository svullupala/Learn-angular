import {
  ViewChild, Component, EventEmitter, Input, Output, AfterViewInit, TemplateRef,
  Renderer2, OnInit, OnDestroy
} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap';
import {Observable} from 'rxjs/Observable';
import {isObject} from 'rxjs/util/isObject';
import {isString} from 'util';
import {isArray} from 'rxjs/util/isArray';
import {TranslateService} from '@ngx-translate/core';

export class Notification {
  private title: string;
  private content: string | TemplateRef<any>;
  private type: string;

  constructor(title?: string, content?: string | TemplateRef<any>, type?: string) {
    this.title = title;
    this.content = content;
    this.type = type;
  }

  public getTitle() {
    return this.title;
  }

  public getContent() {
    return this.content;
  }

  public getType() {
    return this.type;
  }
}

export enum AlertType {
  MASK,
  ERROR,
  WARNING,
  INFO,
  CONFIRMATION,
  TEMPLATE,
  DELETE,
  UNREGISTER,
  DANGEROK,
  NOTIFICATIONS_STANDARD,
  NOTIFICATIONS_INFO,
  NOTIFICATIONS_CRITICAL,
  NOTIFICATIONS_WARNING,
  NOTIFICATIONS_SUCCESS
}

@Component({
  selector: 'msgbox-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements AfterViewInit {
  @Input() title: string = '';
  @Input() message: string | TemplateRef<any> = '';
  @Input() autoShow: boolean = true;
  @Input() simplyMask: boolean = false; // Simply mask the page without showing the spinning wheel

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();
  @Output('confirm') confirmEvent = new EventEmitter();
  @Output('discard') discardEvent = new EventEmitter();

  @ViewChild('lgModal')
  private lgModal: ModalDirective;
  private type: AlertType = AlertType.INFO;
  private trotting: boolean = false;
  private confirmed: boolean = false;
  private forceConfirmationHandler: boolean = false;
  private confirmation: Function;
  private discardHandler: Function;
  private noInteraction: boolean = false;
  private sub: any;
  private isDetails: boolean = false;
  private details: any = undefined;

  private isDanger: boolean = false;
  private dangerConfirmedString: string = "";
  private dangerRequiredString: string = "YES";
  private dangerMessage: string = "THIS IS A DESTRUCTIVE ACTION. TO CONFIRM, ENTER CODE:"
  private dangerButtonText: string = "OK";
  private deleteButtonText: string = "delete";
  private unregisterButtonText: string = "unregister";
  private okButtonText: string = "ok";

  // Notification part
  private notificationArray: Notification[] = [];

  private AlertType = AlertType;

  constructor(private translate: TranslateService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.textDangerMessageColon',
      'common.textDELETE',
      'common.textUNREGISTER',
      'common.textOK'
    ])
      .subscribe((resource: Object) => {
        me.dangerMessage = resource['common.textDangerMessageColon'];
        me.deleteButtonText = resource['common.textDELETE'];
        me.unregisterButtonText = resource['common.textUNREGISTER'];
        me.okButtonText = resource['common.textOK'];
      });
  }

  ngAfterViewInit() {
    this.autoShow ? this.show() : this.hide();
  }

  isDangerValid(): boolean {
    return this.dangerConfirmedString === this.dangerRequiredString;
  }

  show(title?: string, message?: string | TemplateRef<any>, type: AlertType = AlertType.INFO,
       confirmation?: Function, discardHandler?: Function, delayms: number = 3000,
       noInteraction: boolean = false, forceConfirmation: boolean = false, details?: any): void {

    let notificationClass: string = '';
    let me = this;
    switch (type) {
      case AlertType.NOTIFICATIONS_INFO:
        notificationClass = 'info';
      break;
      case AlertType.NOTIFICATIONS_WARNING:
        notificationClass = 'warning';
      break;
      case AlertType.NOTIFICATIONS_STANDARD:
        notificationClass = 'standard';
      break;
      case AlertType.NOTIFICATIONS_SUCCESS:
        notificationClass = 'success';
      break;
      case AlertType.NOTIFICATIONS_CRITICAL:
        notificationClass = 'critical';
      break;
      default:
        // notificationClass = 'info';
      break;
    }

    if (notificationClass) {
      me.notificationArray.push(new Notification(title, message, notificationClass));
      return;
    }

    this.dangerConfirmedString = "";
    this.title = title || '';
    this.message = message || '';
    this.type = type;
    this.trotting = type === AlertType.MASK;
    this.confirmed = (type === AlertType.DELETE || type === AlertType.UNREGISTER ||  type === AlertType.CONFIRMATION || type === AlertType.DANGEROK) && !!confirmation;
    this.isDanger = (type === AlertType.DELETE || type === AlertType.UNREGISTER || type === AlertType.DANGEROK);
    this.forceConfirmationHandler = (forceConfirmation && !!confirmation);
    this.confirmation = (this.confirmed || forceConfirmation) ? confirmation : undefined;
    this.discardHandler = discardHandler;
    this.noInteraction = noInteraction;
    this.details = this.filterOutPassword(details);
    this.isDetails = false;
    this.initDangerLabels();
    this.lgModal.show();
    this.showEvent.emit();
   }

  initDangerLabels() {
    this.dangerRequiredString = this.randomString(5);
    if (this.type === AlertType.DELETE) {
      this.dangerButtonText = this.deleteButtonText;
    } else if (this.type === AlertType.UNREGISTER) {
      this.dangerButtonText = this.unregisterButtonText;
    } else {
      this.dangerButtonText = this.okButtonText;
    }
  }

  hide(): void {
    this.lgModal.hide();
    this.hideEvent.emit();
    if (this.sub) { this.sub.unsubscribe(); }
  }

  get hasDetails(): boolean {
    if (this.details !== undefined) {
      return true;
    }

    return false;
  }

  showDetails(): void {
    this.isDetails = (this.isDetails) ? false : true;
  }

  get prettyDetails(): string {
    return JSON.stringify(this.details, null, '\t');
  }

  private discardNotification(index: number): void {
    let me = this;
    this.notificationArray.splice(index, 1);
  }

  private maskPasswordEntry(data: any, key: any): void {
    this.maskEntry(data, key, /password/i);
  }

  private maskSecretEntry(data: any, key: any): void {
    this.maskEntry(data, key, /secret/i);
  }

  private maskEntry(data: any, key: any, entry: any): void {
    let done = false;
    if (isString(key) && key.search(entry) !== -1) {
      if (isString(data[key]) || data[key] == null) {
        data[key] = '***';
        done = true;
      }
    }
    if (!done) {
      if (isObject(data[key])) {
        for (let property in data[key]) {
          if (data[key].hasOwnProperty(property)) {
            this.maskEntry(data[key], property, entry);
          }
        }
      } else if (isArray(data[key])) {
        data[key].forEach(function (item, idx, all) {
          this.maskEntry(all, idx, entry);
        });
      }
    }
  }



  private filterOutPassword(details: any): any {
    let body = isObject(details) && isObject(details.request) ? JSON.parse(details.request.body) : null;
    if (isObject(body)) {
      for (let property in body) {
        if (body.hasOwnProperty(property)) {
          this.maskPasswordEntry(body, property);
          this.maskSecretEntry(body, property);
        }
      }
      details.request.body = JSON.stringify(body);
    }
    return details;
  }

  private delayHide(delay: number): void {
    this.sub = Observable.interval(delay).take(1).subscribe(
      () => {
        this.hide();
      }
    );
  }

  private discard(): void {
    if (this.discardHandler) {
      this.discardHandler.call(this, ['confirm-test']);
      this.discardEvent.emit();
    }
    this.hide();
  }

  private confirm(): void {
    if ((this.confirmed && this.confirmation)
      || (this.forceConfirmationHandler && this.confirmation)) {
      this.confirmation.call(this, ['confirm-test']);
      this.confirmEvent.emit();
    }
    this.hide();
  }

  private onKeyDownEnterEsc(): void {
    if (!this.trotting && !this.noInteraction)
      this.discard();
  }

  randomString(length: number): string {
    let text = "", possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
}
