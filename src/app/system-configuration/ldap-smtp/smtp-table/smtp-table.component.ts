import {Component, OnChanges, Input, Output, EventEmitter, ViewChild, OnInit} from '@angular/core';
import {SmtpsModel} from '../smtps.model';
import {SmtpModel} from '../smtp.model';
import {NotificationComponent} from 'shared/components/notification/notification.component';
import {LinkModel} from 'shared/models/link.model';
import {BaseModel} from 'shared/models/base.model';
import {MD5} from 'shared/util/md5';
import {Subject} from 'rxjs';
import {BaseModalComponent} from 'shared/components/base-modal/base-modal.component';
import {LdapSmtpService} from 'ldapsmtp/ldap-smtp.service';
import {AlertComponent} from 'shared/components';
import {SessionService} from 'core';

@Component({
  selector: 'smtp-table',
  templateUrl: './smtp-table.component.html',
  styleUrls: ['./smtp-table.component.scss']
})
export class SmtpTableComponent implements OnChanges, OnInit{
  @Input() smtpEntries: SmtpsModel = undefined;
  @Output() onUnregister = new EventEmitter();
  @Output() onEdit = new EventEmitter();
  @ViewChild(NotificationComponent) notificationComponent: NotificationComponent;
  @ViewChild(BaseModalComponent) testModal: BaseModalComponent;
  alert: AlertComponent;

  private smtp: SmtpModel = new SmtpModel;
  private selectedSMTP: SmtpModel = new SmtpModel;
  private subs: Subject<void> = new Subject<void>();
  private disableConfirmButton: boolean = false;

  constructor(private service: LdapSmtpService) {
  }

  ngOnInit(): void {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnChanges() {
    if (this.isRecords()) {
      this.getRecords();
    }
  }

  getRecords(): void {
    this.smtp = this.smtpEntries.smtps[0];
  }

  isRecords(): boolean {
    if (this.smtpEntries !== undefined && this.smtpEntries.smtps.length > 0) {
      return true;
    }

    return false;
  }

  unregister(item: SmtpModel) {
    this.onUnregister.emit(item);
  }

  edit(item: SmtpModel) {
    this.onEdit.emit(item);
  }

  private testNotification() {
    let me = this, body: any;

    if((me.notificationComponent.errorCondition() === false) && (me.notificationComponent.getNotification().length === 0))
    {
      me.notificationComponent.onAddNotification();
    }

    body = {'recipients': me.notificationComponent.getNotification()};

    this.disableConfirmButton = true;

    me.service.testSMTP(me.selectedSMTP, body).takeUntil(me.subs).subscribe(
      (data) => {
        this.testModal.hide();
        this.notificationComponent.emptyNotificationList();
        let href = Object.create(data);
        this.disableConfirmButton = false;
        me.service.getSMTPTest(href.statusHref).takeUntil(me.subs).subscribe(
          (testResult) => {
            let result = Object.create(testResult);
            me.info(result.configGroups[0].tests[0].description + ' - '
              + result.configGroups[0].tests[0].status, result.configGroups[0].tests[0].name);
          },
          err => {
            this.disableConfirmButton = false;
          }
        );
      },
      err => {
            this.disableConfirmButton = false;
      }
    );
  }

  private trackByLinkModel(idx: number, model: LinkModel) {
    return model.href;
  }

  private onExecuteSessionAction(item: SmtpModel, link: LinkModel): void {
    let me = this, observable;
    me.toggleDropDown(item);
    if (link.name === 'test') {
      me.selectedSMTP = item;
      this.testModal.show();
      return;
    }
    observable = item.doAction<SmtpModel>(SmtpModel, link.name);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
         response => {
        },
        err => {}
      );
  }

  private isDropDown(item: SmtpModel): boolean {
    if (item) {
      return !!item.metadata['dropdown'];
    }
    return false;
  }

  private toggleDropDown(item: BaseModel): void {
    let me = this, operatorId = me.getDropDownMenuId(item);
    if (item) {
      item.metadata['dropdown'] = !item.metadata['dropdown'];
      if ( item.metadata['dropdown'] )
        me.setCollapsibleIcon(operatorId, 'hide', 'show');
      else
        me.setCollapsibleIcon(operatorId, 'show', 'hide');
    }
  }

  private setCollapsibleIcon(operatorId: string, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + operatorId);
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }

  private getDropDownMenuId(item: BaseModel): string {
    return 'smtp-actions-menu-' + MD5.encode(item.getId());
  }

  private info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title, message);
    }
  }

  private getDropDownActionId(item: SmtpModel): string {
    return 'smtp-table-dropdown-action-' + MD5.encode(item.getId());
  }
}
