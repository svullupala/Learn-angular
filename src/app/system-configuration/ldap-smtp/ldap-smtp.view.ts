import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { RegistrationFormQuestion, RegistrationFormQuestionDependency } from 'shared/form-question/form-question';
import { FormTextQuestion } from 'shared/form-question/form-text-question';
import { FormCheckboxQuestion } from 'shared/form-question/form-checkbox-question';
import { FormDropdownQuestion } from 'shared/form-question/form-dropdown-question';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { AlertType, AlertComponent, DynamicTabEntry } from 'shared/components';

import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'core';
import { SharedService } from 'shared/shared.service';

import { LdapSmtpService } from './ldap-smtp.service';
import { LdapsModel } from './ldaps.model';
import { SmtpsModel } from './smtps.model';
import { SmtpModel } from './smtp.model';
import { LdapModel } from './ldap.model';
import { UserModel } from './user.model';
import { LdapRegisterComponent } from './ldap-register/ldap-register.component';
import { SmtpRegisterComponent } from './smtp-register/smtp-register.component';

@Component({
  selector: 'ldap-smtp',
  styles: [],
  templateUrl: './ldap-smtp.view.html'
})
export class LdapSmtpView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ldapServer', { read: TemplateRef }) ldapServerTemplateRef: TemplateRef<any>;
  @ViewChild('smtpServer', { read: TemplateRef }) smtpServerTemplateRef: TemplateRef<any>;

  // defines
  private ldapEntries: LdapsModel = undefined;
  private smtpEntries: SmtpsModel = undefined;

  private smtpFormQuestions: RegistrationFormQuestion[];
  private ldapFormQuestions: RegistrationFormQuestion[];

  private ldapMode: string = 'list';
  private smtpMode: string = 'list';

  @ViewChild(LdapRegisterComponent)
  private ldapRegister: LdapRegisterComponent;
  @ViewChild(SmtpRegisterComponent)
  private smtpRegister: SmtpRegisterComponent;
  private errorHandler: ErrorHandlerComponent;

  private alert: AlertComponent;

  private users: UserModel[] = [];
  // private defines

  private subs: any[] = [];

  private confirmStr: string;
  private confirmDeleteStr: string;
  private textEnterCredentials: string;
  private textSelectUser: string;
  private validationInfoTitle: string;
  private validationInfoMessage: string;
  private textNumberErrorSugguestionTpl: string;

  @ViewChild('ldapCollapse')
  private ldapEditor: ElementRef;
  @ViewChild('smtpCollapse')
  private smtpEditor: ElementRef;
  private tabs: DynamicTabEntry[];
  private textLdapServer: string = 'LDAP';
  private textSmtpServer: string = 'SMTP';

  constructor(private service: LdapSmtpService, private translate: TranslateService) { }

  // Lifecycle hooks

  ngOnInit() {
    this.init();
    this.refreshUsers();
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  ngAfterViewInit() {
    this.getLdapRecords();
    this.getSmtpRecords();
  }



  ngOnDestroy() {
    for (let i = 0; i < this.subs.length; i++) {
      if (this.subs[i] !== undefined) { this.subs[i].unsubscribe(); }
    }
  }

  // SMTP methods

  onAddSmtpClick() {
    this.initForms();
    this.smtpMode = 'edit';
  }

  onEditSmtp(value: SmtpModel) {
    this.smtpMode = 'edit';
    this.smtpSetForm(value);
  }

  registerSmtp(value: any) {
    this.smtpMode = 'list';
    this._registerSmtp(value);
    // if (this._validateSmtp(value))  {
    //   this._registerSmtp(value);
    // } else {
    //   this.info(this.validationInfoTitle, this.validationInfoMessage);
    // }
  }

  _validateSmtp(value: any): boolean {
    if ((value.username === '' && value.password === '') ||
      (value.existingUser === null && value.username !== '' && value.password !== '')) {
      return true;
    } else {
      return false;
    }
  }

  _registerSmtp(value: any) {
    this.mask();
    if (value.id === undefined) {
      this.subs.push(this.service.registerSmtp(value).subscribe(
        () => {
          this.unmask();
          this.refreshSmtp();
        },
        err => {
          this.unmask();
          this.errorHandler.handle(err, true);
        }
      ));
    } else {
      this.subs.push(this.service.updateSmtp(value).subscribe(
        () => {
          this.unmask();
          this.refreshSmtp();
        },
        err => {
          this.unmask();
          this.errorHandler.handle(err, true);
        }
      ));
    }
  }

  unregisterSmtp(value: any) {
    let me = this;
    this.confirmUnregister(value.hostAddress, function () {
      me.subs.push(me.service.unregisterSmtp(value.id).subscribe(
        () => { me.refreshSmtp(); me.hideConfirm(); },
        err => { me.errorHandler.handle(err); }
      ));
    });
  }

  smtpSetForm(value: SmtpModel) {
    this.smtpFormQuestions = this.getFormQuestionsSmtp(value, this.toDropDownOptions());
    if (this.smtpRegister)
    this.smtpRegister.setForm(this.smtpFormQuestions, value);
  }

  smtpResetForm() {
    this.smtpFormQuestions = this.getFormQuestionsSmtp(undefined, this.toDropDownOptions());
    if (this.smtpRegister)
    this.smtpRegister.setForm(this.smtpFormQuestions, undefined);
    // this.switchSmtpEditor();
    this.smtpMode = 'list';
  }

  getFormQuestionsSmtp(values: SmtpModel, users: any[]): RegistrationFormQuestion[] {
    return [new FormTextQuestion({
      value: (values === undefined) ? '' : values.hostAddress,
      key: 'hostAddress',
      label: 'smtp.hostAddress',
      required: true,
      isFormGroup: false,
      type: 'text'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? 25 : values.portNumber,
      key: 'portNumber',
      label: 'smtp.portNumber',
      required: true,
      type: 'number',
      min: 0,
      max: 65535,
      errorSuggestion: SharedService.formatString(this.textNumberErrorSugguestionTpl, 0, 65535)
    }),
    // new FormDropdownQuestion({
    //   value: null,
    //   key: 'existingUser',
    //   label: this.textSelectUser,
    //   options: users
    // }),
    new FormTextQuestion({
      value: values ? values.username : '',
      key: 'username',
      label: 'smtp.username',
      isFormGroup: false,
      required: false,
      type: 'text'
    }),
    new FormTextQuestion({
      value: '',
      key: 'password',
      label: 'smtp.password',
      required: false,
      isFormGroup: false,
      type: 'password'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.timeout,
      key: 'timeout',
      label: 'smtp.timeout',
      required: false,
      type: 'number'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.fromAddress,
      key: 'fromAddress',
      label: 'smtp.fromAddress',
      required: false,
      type: 'text',
      placeholder: 'smtp.fromAddressPlaceholder'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.subjectPrefix,
      key: 'subjectPrefix',
      label: 'smtp.subjectPrefix',
      required: false,
      type: 'text'
    })
    ];
  }


  // LDAP

  onAddLdapClick() {
    this.initForms();
    this.ldapMode = 'edit';
  }

  onEditLdap(value: LdapModel) {
    this.ldapMode = 'edit';
    this.ldapSetForm(value);
  }

  registerLdap(value: any) {
    if (this._validateLdap(value)) {
      this.ldapMode = 'list';
      this._registerLdap(value);
    } else {
      this.info(this.validationInfoTitle, this.validationInfoMessage);
    }
  }

  _validateLdap(value: any): boolean {
    if ((value.useExistingUser === false && value.username !== '' && value.password !== '') ||
      (value.useExistingUser === true && value.existingUser !== null)) {
      return true;
    } else {
      return false;
    }
  }

  _registerLdap(value: any) {
    this.mask();
    if (value.id === undefined) {
      this.subs.push(this.service.registerLdap(value).subscribe(
        () => {
          this.unmask();
          this.refreshLdap();
        },
        err => {
          this.unmask();
          this.errorHandler.handle(err, true);
        }
      ));
    } else {
      this.subs.push(this.service.updateLdap(value).subscribe(
        () => {
          this.unmask();
          this.refreshLdap();
        },
        err => {
          this.unmask();
          this.errorHandler.handle(err, true);
        }
      ));
    }
  }

  unregisterLdap(value: any) {
    let me = this;
    this.confirmUnregister(value.hostAddress, function () {
      me.subs.push(me.service.unregisterLdap(value.id).subscribe(
        () => { me.refreshLdap(); me.hideConfirm(); },
        err => { me.errorHandler.handle(err); }
      ));
    });
  }

  isLdapAddDisabled(): boolean {
    if (this.ldapEntries !== undefined) {
      if (!this.ldapEntries.hasLink('create') || this.ldapEntries.ldapServers.length > 0) {
        return true;
      }
    }
    return false;
  }

  isSmtpAddDisabled(): boolean {
    if (this.smtpEntries !== undefined) {
      if (!this.smtpEntries.hasLink('create') || this.smtpEntries.smtps.length > 0) {
        return true;
      }
    }
    return false;
  }

  ldapSetForm(value: LdapModel) {
    this.ldapFormQuestions = this.getFormQuestionsLdap(value, this.toDropDownOptions());
    if (this.ldapRegister)
    this.ldapRegister.setForm(this.ldapFormQuestions, value);
  }

  ldapResetForm() {
    this.ldapMode = 'list';
    this.ldapFormQuestions = this.getFormQuestionsLdap(undefined, this.toDropDownOptions());
    if (this.ldapRegister)
    this.ldapRegister.setForm(this.ldapFormQuestions, undefined);
  }

  getFormQuestionsLdap(values: LdapModel, users: any[]): RegistrationFormQuestion[] {
    let useExistingUser = new FormCheckboxQuestion({
      value: values !== undefined,
      key: 'useExistingUser',
      label: 'ldap.useExistingUser',
    });
    return [new FormTextQuestion({
      value: (values === undefined) ? '' : values.hostAddress,
      key: 'hostAddress',
      label: 'ldap.hostAddress',
      required: true,
      isFormGroup: false,
      type: 'text'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? 389 : values.portNumber,
      key: 'portNumber',
      label: 'ldap.portNumber',
      required: true,
      type: 'number',
      min: 0,
      max: 65535,
      errorSuggestion: SharedService.formatString(this.textNumberErrorSugguestionTpl, 0, 65535)
    }),
    new FormCheckboxQuestion({
      value: (values === undefined) ? false : values.sslConnection,
      key: 'sslConnection',
      label: 'ldap.sslConnection',
    }),
      useExistingUser,
    new FormDropdownQuestion({
      value: (values && values.user && values.user.href) ? values.user.href : null,
      key: 'existingUser',
      label: 'ldap-smtp.selectUser',
      options: users,
      dependencies: [new RegistrationFormQuestionDependency(useExistingUser, true)]
    }),
    new FormTextQuestion({
      value: '',
      key: 'username',
      label: 'ldap.username',
      isFormGroup: false,
      type: 'text',
      dependencies: [new RegistrationFormQuestionDependency(useExistingUser, false)]
    }),
    new FormTextQuestion({
      value: '',
      key: 'password',
      label: 'ldap.password',
      required: false,
      isFormGroup: false,
      type: 'password',
      dependencies: [new RegistrationFormQuestionDependency(useExistingUser, false)]
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.baseDN,
      key: 'baseDN',
      label: 'ldap.baseDN',
      required: true,
      type: 'text'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.userFilter,
      key: 'userFilter',
      label: 'ldap.userFilter',
      required: true,
      type: 'text'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.userRDN,
      key: 'userRDN',
      label: 'ldap.userRDN',
      required: false,
      type: 'text'
    }),
    new FormTextQuestion({
      value: (values === undefined) ? '' : values.groupRDN,
      key: 'groupRDN',
      label: 'ldap.groupRDN',
      required: false,
      type: 'text'
    })
    ];
  }

  private initTabs() {
    this.tabs = [
      {
        key: 'ldapServer', title: this.textLdapServer, content: this.ldapServerTemplateRef, refresh:
          false, active: true
      },
      {
        key: 'smtpServer', title: this.textSmtpServer, content: this.smtpServerTemplateRef, refresh:
          false, active: false
      }
    ];
  }

  private init() {
    this.initTabs();
    this.initQuestions();
    this.subs.push(this.translate.get([
      'common.textConfirmDelete',
      'common.textConfirm',
      'common.textNumberErrorSugguestionTpl',
      'ldap-smtp.enterCredentials',
      'ldap-smtp.selectUser',
      'ldap-smtp.validationInfoTitle',
      'ldap-smtp.validationInfoMessage',
      'ldap-smtp.textLdapServer',
      'ldap-smtp.textSmtpServer'
    ]).subscribe(
      resource => {
        this.validationInfoTitle = resource['ldap-smtp.validationInfoTitle'];
        this.validationInfoMessage = resource['ldap-smtp.validationInfoMessage'];
        this.textEnterCredentials = resource['ldap-smtp.enterCredentials'];
        this.textSelectUser = resource['ldap-smtp.selectUser'];
        this.confirmStr = resource['common.textConfirm'];
        this.confirmDeleteStr = resource['common.textConfirmDelete'];
        this.textNumberErrorSugguestionTpl = resource['common.textNumberErrorSugguestionTpl'];
        this.textLdapServer = resource['ldap-smtp.textLdapServer'];
        this.textSmtpServer = resource['ldap-smtp.textSmtpServer'];
        this.initQuestions();
        this.initTabs();
      },
      err => {
        this.errorHandler.handle(err);
      }

    ));
  }

  private confirmUnregister(name: string, handler: Function) {
    this.confirm(this.confirmStr, SharedService.formatString(this.confirmDeleteStr, name), handler);
  }

  private info(title: string, message: string) {
    if (this.alert) {
      this.alert.show(title, message);
    }
  }

  private confirm(title: string, message: string, handler: Function) {
    if (this.alert) {
      this.alert.show(title, message, AlertType.CONFIRMATION, handler);
    }
  }

  private hideConfirm() {
    if (this.alert) {
      this.alert.hide();
    }
  }

  private getSmtpRecords() {
    this.subs.push(this.service.getSmtpEntries().subscribe(
      smtpEntries => {
        this.smtpEntries = smtpEntries;
      },
      err => {
        this.errorHandler.handle(err);
      }
    ));
  }

  private toDropDownOptions(): any[] {
    let retVal: any[] = [];

    // retVal.push({
    //   label: this.textEnterCredentials,
    //   value: null
    // });

    for (let i = 0; i < this.users.length; i++) {
      retVal.push(
        {
          label: this.users[i].username,
          value: this.users[i].getUrl('self')
        }
      );
    }

    return retVal;
  }

  private refreshUsers() {
    this.service.getUsers().subscribe(
      res => {
        this.users = res;
      },
      err => {
        this.errorHandler.handle(err);
      }
    );
  }

  private refreshSmtp() {
    this.smtpMode = 'list';
    this.refreshUsers();
    this.getSmtpRecords();
  }

  private refreshLdap() {
    this.ldapMode = 'list';
    this.getLdapRecords();
    // this.ldapClose();
  }

  private getLdapRecords() {
    this.subs.push(this.service.getLdapEntries().subscribe(
      ldapEntries => {
        this.ldapEntries = ldapEntries;
      },
      err => {
        this.errorHandler.handle(err);
      }
    ));
  }

  private initQuestions() {
    this.smtpFormQuestions = this.getFormQuestionsSmtp(undefined, this.toDropDownOptions());
    this.ldapFormQuestions = this.getFormQuestionsLdap(undefined, this.toDropDownOptions());
  }

  private initForms() {
    this.ldapRegister.setForm(this.ldapFormQuestions, undefined);
    this.smtpRegister.setForm(this.smtpFormQuestions, undefined);
  }

  private mask(): void {
    this.alert.show(undefined, undefined, AlertType.MASK);
  }

  private unmask(): void {
    this.alert.hide();
  }
}
