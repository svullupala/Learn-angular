import {ViewChild, Component, OnInit, AfterViewInit, ElementRef, Input, isDevMode} from '@angular/core';
import {FormGroup, AbstractControl, FormBuilder, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {DateFormatPipe} from 'angular2-moment';

import {LoginService} from './login.service';
import {SessionModel} from 'core/session.model';
import {ErrorModel} from 'shared/models/error.model';
import {SessionService, ScreenId} from 'core';
import {AlertType, AlertComponent, ChangePasswordComponent, InitializeSystemComponent} from 'shared/components';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {SharedService} from 'shared/shared.service';
import {VersionService} from 'shared/version-info/version.service';
import {VersionModel} from 'shared/version-info/version.model';
import 'style-loader!./login.component.scss';
import { AppState } from 'app/app.service';
import { environment } from '../environment';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  providers: [VersionService]
})

export class LoginComponent implements OnInit, AfterViewInit {
  private browserNameAndVersion: object;
  private isBrowserValid: boolean = false;

  public form: FormGroup;
  public username: AbstractControl;
  public password: AbstractControl;
  public submitted: boolean = false;
  public simplyMask: boolean = true;
  @ViewChild(AlertComponent) alert: AlertComponent;
  @ViewChild(ErrorHandlerComponent) errorHandler: ErrorHandlerComponent;
  @ViewChild(ChangePasswordComponent) changePassword: ChangePasswordComponent;
  @ViewChild(InitializeSystemComponent) initSystem: InitializeSystemComponent;
  @ViewChild('inputUsername') inputUsername: ElementRef;

  private nextChangeOsPassword: boolean = false;
  private newPasswordValid: boolean = false;
  private newPassword: string;
  private isOsPasswordExpired: boolean = false;
  private isUsernameExpired: boolean = false;
  private isInitSystem: boolean = false;
  private errorPasswordExpired: ErrorModel;
  private errorOsPasswordExpired: ErrorModel;
  private session: SessionService;
  private errorTitle = '';
  private infoTitle = '';
  private textAuthError = '';
  private processingRequestMsg = '';
  private textCoreService = '';
  private buildInfo = '';
  private textServerIsBeingBroughtUp = '';
  private textMustChangePassword = '';
  private textMustChangeUsername = '';
  private textMustChangePasswordAndUsername = '';
  private serverIsReady: boolean = false;
  private versionInfo: VersionModel = new VersionModel();
  private show: boolean = false;
  private minPasswordLength: number = 0;
  private textCurrentBrowserFormat: string = "";
  private datePipe: DateFormatPipe;

  constructor(public loginService: LoginService,
              public versionService: VersionService,
              public router: Router, fb: FormBuilder,
              public translate: TranslateService,
              private appService: AppState) {
    this.form = fb.group({
      'username': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'password': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });

    this.username = this.form.controls['username'];
    this.password = this.form.controls['password'];
    this.session = SessionService.getInstance();
    this.datePipe = new DateFormatPipe();
  }

  ngOnInit() {
    let me = this;

    me.browserNameAndVersion = me.getBrowserNameAndVersion();
    me.isBrowserValid = me.validateBrowserNameVersion(me.browserNameAndVersion['name'], me.browserNameAndVersion['version']);

    me.translate.get([
      'common.coreService',
      'common.errorTitle',
      'common.processingRequestMsg',
      'common.infoTitle',
      'common.textMustChangePassword',
      'common.textMustChangeUsername',
      'common.textMustChangePasswordAndUsername',
      'login.textAuthError',
      'login.textServerIsBeingBroughtUp',
      'login.textCurrentBrowserFormat',
      'about.buildInfo'])
      .subscribe((resource: Object) => {
        me.textCoreService = resource['common.coreService'];
        me.errorTitle = resource['common.errorTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.infoTitle = resource['common.infoTitle'];
        me.textMustChangePassword = resource['common.textMustChangePassword'];
        me.textMustChangeUsername = resource['common.textMustChangeUsername'];
        me.textMustChangePasswordAndUsername = resource['common.textMustChangePasswordAndUsername'];
        me.textAuthError = resource['login.textAuthError'];
        me.textServerIsBeingBroughtUp = resource['login.textServerIsBeingBroughtUp'];
        me.textCurrentBrowserFormat = resource['login.textCurrentBrowserFormat'];
        me.buildInfo = resource['about.buildInfo'];

        me.versionService.getVersion()
          .subscribe(
            data => {
              // Cast the JSON object to VersionModel instance.
              me.versionInfo = JsonConvert.deserializeObject(data, VersionModel);
              me.buildInfo = SharedService.formatString(me.buildInfo,
                me.versionInfo.version, me.versionInfo.build, this.datePipe.transform(me.versionInfo.epoch, 'll LTS'));
                if (me.versionInfo.version !== undefined && me.versionInfo.version !== '10.1.0') {
                  this.show = true;
                }
            },
            err => {
              me.buildInfo = SharedService.formatString(me.buildInfo,
                me.versionInfo.version, me.versionInfo.build, this.datePipe.transform(me.versionInfo.epoch, 'll LTS'));
            }
          );
      });

      me.loginService.getPasswordMinLength().subscribe((data) => {
        this.minPasswordLength = data;
      },
      (err) => {
	console.warn('Unable to get password length preference from backend');
      });
  }

  ngAfterViewInit() {
    this.checkServerIsReady();
    // NOTE: Autologin when page is reloaded - this is for faster development
    if (isDevMode() && environment.autologin) {
      this.autologin();
    }
  }

  handleError(err: HttpErrorResponse, node?: boolean): void {
    let me = this, error: ErrorModel;
    if (me.errorHandler)
      error = me.errorHandler.handle(err, node, true);

    if (me.alert) {
      if (error) {
        if (error.id === 'XSBPasswordExpiredException') {
          me.alert.hide();
          me.connectWithChangePassword(error);
        } else if (error.id === 'XSBOsPasswordExpiredException') {
          me.alert.hide();
          error.message = me.textMustChangePassword;
          me.connectWithChangeOsPassword(error);
        } else if (error.id === 'XSBUsernameExpiredException') {
          me.alert.hide();
          error.message = me.textMustChangeUsername;
          me.connectWithChangeUsername(error);
        } else if (error.id === 'XSBPasswordOsPasswordExpiredException') {
          me.alert.hide();
          error.message = me.textMustChangePassword;
          me.connectWithChangePasswordOsPassword(error);
        } else {
          let errorTitle = error.title;
          // Check if it is authentication error.  Use better alert title
          if (error.id === 'XSBAuthenticationException') {
            errorTitle = me.textAuthError;
          }
          me.alert.show(errorTitle, error.message, AlertType.ERROR);
        }
      } else
        me.alert.hide();
    }
  }

  public getCurrentBrowserMessage(): string {
    return SharedService.formatString(this.textCurrentBrowserFormat, this.browserNameAndVersion['name'],
            this.browserNameAndVersion['version']);

  }

  public onSubmit(/*values: Object*/): void {
    let me = this;
    me.submitted = true;

    if (me.form.valid) {
      if (me.alert) {
        me.alert.show('', me.processingRequestMsg, AlertType.MASK);
      }

      me.loginService.login({
        username: me.username.value,
        password: me.password.value
      })
        .subscribe(
          data => me.loginSuccess(data),
          err => me.handleError(err)
        );
    }
  }

  checkServerIsReady(): void {
    let me = this, observable = me.loginService.checkServerIsReady();
    if (observable) {
      observable.subscribe(
        success => {
          me.serverIsReady = !!success;
          if (me.serverIsReady) {
            me.serverIsBeingBroughtUp(false);
            me.delay(() => {
              me.focusUsernameField();
            }, 200);
          } else {
            me.serverIsBeingBroughtUp(true);
            me.delay(() => {
              me.checkServerIsReady();
            }, 2000);
          }
        }
      );
    }
  }

  focusUsernameField(): void {
    this.inputUsername.nativeElement.focus();
  }

  private autologin() {
    const { username, password } = environment.autologin;
    this.submitted = true;

    if (this.alert) {
      setTimeout(() => {
        this.alert.show('', this.processingRequestMsg, AlertType.MASK);
      }, 0);
    }

    this.loginService
      .login({
        username, password
      })
      .subscribe(
        data => this.loginSuccess(data),
        err => this.handleError(err)
      );
  }

  private serverIsBeingBroughtUp(broughtUp: boolean): void {
    let me = this;
    if (me.alert) {
      if (broughtUp)
        me.alert.show('', me.textServerIsBeingBroughtUp,
          AlertType.INFO, undefined, undefined, 0, true);
      else {
        if (!environment.autologin) {
          me.alert.hide();
        }
      }
    }
  }

  private connectWithChangePassword(error: ErrorModel) {
    let me = this;
    me.newPasswordValid = false;
    me.errorPasswordExpired = error;
    me.isInitSystem = true;
    me.isOsPasswordExpired = false;
    me.nextChangeOsPassword = false;
    me.changePassword.show();
  }

  private connectWithChangeUsername(error: ErrorModel) {
    let me = this;
    me.newPasswordValid = false;
    me.isUsernameExpired = true;
    me.errorPasswordExpired = error;
    me.isOsPasswordExpired = false;
    me.nextChangeOsPassword = false;
    me.changePassword.showUsernameChangeOnly();
  }

  private connectWithChangeOsPassword(error: ErrorModel) {
    let me = this;
    me.errorOsPasswordExpired = error;
    me.isOsPasswordExpired = true;
    me.nextChangeOsPassword = false;
    me.changePassword.show(true);
  }

  private connectWithChangePasswordOsPassword(error: ErrorModel) {
    let me = this;
    me.connectWithChangePassword(error);
    me.nextChangeOsPassword = true;
  }

  private getAppCredential(): {username: string, password: string} {
    let me = this, credential = {username: me.username.value, password: me.password.value};
    if (me.newPasswordValid) {
      credential.password = me.newPassword;
    }
    return credential;
  }

  private onPasswordChange(config): void {
    let me = this, credential, isOsPasswordExpired = me.isOsPasswordExpired;
    if (me.alert) {
      me.alert.show('', me.processingRequestMsg, AlertType.MASK);
    }
    if (me.isUsernameExpired) {
      me.loginService.changeUsername(config)
        .subscribe(
          data => {
            if (me.alert)
              me.alert.hide();
            me.username.setValue(config.newUsername);
            me.password.setValue(config.password);
            me.changeUsernameSuccess();
          },
          err => {
            me.handleError(err);
            me.errorPasswordExpired = null;
          }
        );
    } else if (isOsPasswordExpired) {
      me.simplyMask = false;
      credential = me.getAppCredential();
      me.loginService.changeOsPassword(credential.username, credential.password, config)
        .subscribe(
          data => {
            if (me.alert)
              me.alert.hide();
            me.simplyMask = true;
            me.changeOsPasswordSuccess(data);
          },
          err => {
            me.handleError(err);
            me.simplyMask = true;
            me.errorOsPasswordExpired = null;
          }
        );
    } else {
      me.loginService.changePassword(config)
        .subscribe(
          data => {
            if (me.alert)
              me.alert.hide();
            me.username.setValue(config.newUsername);
            me.password.setValue(config.newPassword);
            me.changePasswordSuccess();
          },
          err => {
            me.handleError(err);
            me.errorPasswordExpired = null;
          }
        );
    }
  }

  private onPasswordChangeAbort(): void {
    let me = this, isOsPasswordExpired = me.isOsPasswordExpired, error = isOsPasswordExpired ?
      me.errorOsPasswordExpired : me.errorPasswordExpired;
    if (me.alert) {
      if (error) {
        me.alert.show(error.title, error.message, AlertType.ERROR);
        if (isOsPasswordExpired)
          me.errorOsPasswordExpired = null;
        else
          me.errorPasswordExpired = null;
      }
      else
        me.alert.hide();
    }
  }

  private changePasswordSuccess(): void {
    let me = this;
    if (me.nextChangeOsPassword) {
      me.newPasswordValid = true;
      me.connectWithChangeOsPassword(new ErrorModel('', me.textMustChangePassword, 'XSBOsPasswordExpiredException'));
    } else
      me.onSubmit();
  }

  private changeUsernameSuccess(): void {
    let me = this;
    me.onSubmit();
  }

  private changeOsPasswordSuccess(data): void {
    let me = this;
    me.errorOsPasswordExpired = null;
    me.clearOutLoginFields();
  }

  private clearOutLoginFields(): void {
    let me = this;
    me.username.setValue('');
    me.password.setValue('');
  }

  private loginSuccess(data): void {
    let me = this;

    if (me.loginService.isLoggedIn) {
      // Cast the JSON object to SessionModel instance & Save it into the context property of SessionService.
      let session = JsonConvert.deserializeObject(data, SessionModel);
      me.session.context = session;
      me.session.sessionId = session.sessionid;
      me.session.screens = session.screens;
    }
    if (me.loginService.isLoggedIn && me.isInitSystem) {
      me.initSystem.show();
      me.errorPasswordExpired = null;
    } else if (me.loginService.isLoggedIn) {
      // Get the redirect URL from our auth service
      // If no redirect has been set, use the default
      // let redirect = me.loginService.redirectUrl ? me.loginService.redirectUrl : '/pages';
      //
      // NOTE: Attempt to avoid issue mentioned by ECC-11832 (https://jira.catalogicsoftware.com/browse/ECC-11832),
      // use the default route '/pages' here.
      let redirect = isDevMode() && environment.autologin
        ? (environment.autologin.redirectUrl || this.loginService.redirectUrl || '/pages/dashboard')
        : '/pages';
      // Redirect the user
      me.router.navigate([redirect]);
    }
    if (me.alert)
      me.alert.hide();
  }

  private afterInitSystem() {
    let me = this;
    let redirect = me.loginService.redirectUrl ? me.loginService.redirectUrl : '/pages';

    // Redirect the user
    me.router.navigate([redirect]);
  }

  private delay(callback: any, interval: number) {
    let sub: any = Observable.interval(interval).take(1).subscribe(
      () => {
        callback();
        sub.unsubscribe();
      }
    );
  }

  private getBrowserNameAndVersion() {
    let ua = navigator.userAgent, tem,
      M = ua.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*(\.?\d+(\.\d+)*)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+([\.\d]+)/g.exec(ua) || [];
      return { name: 'IE', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\b(OPR|Edge)\/([\.\d]+)/);
      if (tem != null) return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/([\.\d]+)/i)) != null)
      M.splice(1, 1, tem[1]);
    return { name: M[0], version: M[1] };
  }

  private validateBrowserNameVersion(name: string, version: string) {
    //The minimum required versions for these 3 browsers are obtained from the documentation.
    if (name === "Chrome") {
      if (version >= "60.0.3112") {
        return true;
      }
    }
    if (name === "Edge") {
      if (version >= "15.15063") {
        return true;
      }
    }
    if (name === "Firefox") {
      if (version >= "55.0.3") {
        return true;
      }
    }
    return false;
  }
}
