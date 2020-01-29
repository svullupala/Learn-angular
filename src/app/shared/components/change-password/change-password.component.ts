import {
  ViewChild, Component, EventEmitter, Input, Output, OnInit, AfterViewInit, OnChanges,
  SimpleChanges
} from '@angular/core';
import {FormGroup, AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap';
import {SdlTooltipDirective} from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() autoShow: boolean = true;
  @Input() userName: string;
  @Input() isLoggedIn: boolean;
  @Input() changeOsPassword: boolean = false;
  @Input() isUserNameReadonly: boolean = true;
  @Input() minPasswordLength: number = undefined;

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();
  @Output() passwordChange = new EventEmitter<Object>();
  @Output() passwordChangeAbort = new EventEmitter();

  @ViewChild('lgModal') lgModal: ModalDirective;
  public form: FormGroup;
  public username: AbstractControl;
  public newUsername: AbstractControl;
  public password: AbstractControl;
  public newPassword: AbstractControl;
  public repeatNewPassword: AbstractControl;
  private displayFocusTrap: boolean = false;
  private changeUsernameOnly: boolean = false;
  private hideNewUsername: boolean = false;
  private model: {username: string, newUsername: string, password: string, newPassword: string, repeatNewPassword: string};
  private usernameValidators = [Validators.required, Validators.minLength(1)];
  private passwordValidators = [Validators.required];
  private textMinPasswordSuggestion: string;
  private textCommonUsername: string;
  private textValidOsPasswordRule2: string;
  private textValidOsPasswordRule3: string;
  private textValidOsPasswordRule4: string;
  private textValidOsPasswordRule5: string;

  constructor(private fb: FormBuilder, private translate: TranslateService) {
    this.initForm();
  }

  ngOnInit() {
    let me = this;
    me.initModel();
    me.translate.get([
      'common.textNewPasswordErrorSuggestion',
      'common.textCommonUsername',
      'common.textValidOsPasswordRule2',
      'common.textValidOsPasswordRule3',
      'common.textValidOsPasswordRule4',
      'common.textValidOsPasswordRule5'
    ])
      .subscribe((resource: Object) => {
        me.textMinPasswordSuggestion = resource['common.textNewPasswordErrorSuggestion'];
        me.textCommonUsername = resource['common.textCommonUsername'];
        me.textValidOsPasswordRule2 = resource['common.textValidOsPasswordRule2'];
        me.textValidOsPasswordRule3 = resource['common.textValidOsPasswordRule3'];
        me.textValidOsPasswordRule4 = resource['common.textValidOsPasswordRule4'];
        me.textValidOsPasswordRule5 = resource['common.textValidOsPasswordRule5'];
      });
  }

  getPasswordTips(): string[] {
    let me = this, password: string, tips = [], tip: string , changeOsPassword = me.changeOsPassword;
    if (changeOsPassword) {
      password = me.model.newPassword;
      if (!me.validOsPasswordRule2(password)) {
        tips.push(me.textValidOsPasswordRule2);
      }

      if (!me.validOsPasswordRule3(password)) {
        tips.push(me.textValidOsPasswordRule3);
      }

      if (!me.validOsPasswordRule4(password)) {
        tips.push(me.textValidOsPasswordRule4);
      }

      if (!me.validOsPasswordRule5(password)) {
        tips.push(me.textValidOsPasswordRule5);
      }
    } else {
      tip = SharedService.formatString(this.textMinPasswordSuggestion,
        (this.minPasswordLength) ? this.minPasswordLength : '1');
      tips.push(tip);
    }
    return tips;
  }

  initForm() {
    this.form = this.fb.group({
      'username': ['', Validators.compose(this.usernameValidators)],
      'newUsername': ['', Validators.compose(this.usernameValidators)],
      'password': ['', Validators.compose(this.passwordValidators.concat(Validators.minLength(1)))],
      'newPassword': ['', Validators.compose(this.passwordValidators)],
      'repeatNewPassword': ['', Validators.compose(this.passwordValidators)]
    });

    if (this.minPasswordLength !== undefined) {
      this.setMinPasswordLength(this.minPasswordLength);
    }

    this.username = this.form.controls['username'];
    this.newUsername = this.form.controls['newUsername'];
    this.password = this.form.controls['password'];
    this.newPassword = this.form.controls['newPassword'];
    this.repeatNewPassword = this.form.controls['repeatNewPassword'];
  }

  setMinPasswordLength(value: number) {
    this.form.controls['newPassword'].setValidators(
      Validators.compose(this.passwordValidators.concat(Validators.minLength(value))));
    this.form.controls['repeatNewPassword'].setValidators(
      Validators.compose(this.passwordValidators.concat(Validators.minLength(value))));
  }

  ngAfterViewInit() {
    this.autoShow ? this.show() : this.hide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes) {
      if (changes['userName'] && me.model) {
        me.model.username = changes['userName'].currentValue;
      } else if (changes['minPasswordLength']) {
        this.setMinPasswordLength(changes['minPasswordLength'].currentValue);
      }
   }
  }

  show(hideUsername: boolean = false): void {
    let me = this;
      me.initModel();

    me.changeUsernameOnly = false;
    me.lgModal.show();
    me.displayFocusTrap = true;
    me.showEvent.emit();

    this.hideNewUsername = hideUsername;
    if (this.hideNewUsername) {
      this.newUsername.disable();
    }
    this.newPassword.enable();
    this.repeatNewPassword.enable();
  }

  showUsernameChangeOnly(reset: boolean = true): void {
    let me = this;
    if (reset)
      me.initModel();

    me.changeUsernameOnly = true;
    me.lgModal.show();
    me.displayFocusTrap = true;
    me.showEvent.emit();

    this.newUsername.enable();
    this.newPassword.disable();
    this.repeatNewPassword.disable();
  }

  hide(): void {
    this.lgModal.hide();
    this.hideEvent.emit();
  }

  /**
   * Rule 1. Number of characters in the new password that must not be present in the old password - 8
   * @param {string} password
   * @return {boolean}
   */
  private validOsPasswordRule1(password: string): boolean {
    // The UI cannot validate Rule 1.
    // UI does not have the old password.
    // This will require the backend to return an appropriate error when validation in the backend fails.
    // Return true here.
    return true;
  }

  /**
   * Rule 2. Minimum acceptable size for the new password - 15
   * @param {string} password
   * @return {boolean}
   */
  private validOsPasswordRule2(password: string): boolean {
    return password && password.length >= 15;
  }

  /**
   * Rule 3. The minimum number of required classes of characters for the new password
   * (digits, uppercase, lowercase, others) - 4
   * @param {string} password
   * @return {boolean}
   */
  private validOsPasswordRule3(password: string): boolean {
    return /(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^a-zA-Z0-9])/.test(password);
  }

  /**
   * Rule 4. The maximum number of allowed same consecutive characters in the new password - 3
   * @param {string} password
   * @return {boolean}
   */
  private validOsPasswordRule4(password: string): boolean {
    let reg = /(\w)\1+/g,
      array = password.match(reg);
    return (array || []).findIndex(function (item) {
      return item.length > 3;
    }) === -1;
  }

  /**
   * Rule 5. The maximum number of allowed consecutive characters of the same class in the new password - 4
   * @param {string} password
   * @return {boolean}
   */
  private validOsPasswordRule5(password: string): boolean {
    let me = this, len = password ? password.length : 0;
    for (let i = 0; i < len - 4; i++) {
      let char1 = password.charAt(i),
        char2 = password.charAt(i + 1),
        char3 = password.charAt(i + 2),
        char4 = password.charAt(i + 3),
        char5 = password.charAt(i + 4),
        class1 = me.classOfChar(char1),
        class2 = me.classOfChar(char2),
        class3 = me.classOfChar(char3),
        class4 = me.classOfChar(char4),
        class5 = me.classOfChar(char5);
      if (class1 === class2 && class2 === class3 && class3 === class4 && class4 === class5)
        return false;
    }
    return true;
  }

  private classOfChar(char: string): number {
    if (/(?=.*[A-Z])/.test(char))
      return 1;
    else if (/(?=.*[a-z])/.test(char))
      return 2;
    else if (/(?=.*[0-9])/.test(char))
      return 3;
    else
      return 4;
  }

  private validOsPassword(): boolean {
    let me = this, password = me.model.newPassword;
    return me.validOsPasswordRule1(password) && me.validOsPasswordRule2(password)
      && me.validOsPasswordRule3(password) && me.validOsPasswordRule4(password)
      && me.validOsPasswordRule5(password);
  }

  private isValid() {
    let me = this,
      valid = me.form.valid && me.newPassword.value === me.repeatNewPassword.value;
    if (valid && me.changeOsPassword)
      valid = me.validOsPassword();
    return valid;
  }

  private initModel(): void {
    this.model = { username: this.userName, newUsername: '', password: '', newPassword: '', repeatNewPassword: ''};
  }

  private onPasswordChange(): void {
    let me = this;
    if (me.isValid()) {
      me.hide();
      me.passwordChange.emit(me.model);
    }
  }

  private onPasswordChangeAbort(): void {
    let me = this;
    me.hide();
    me.passwordChangeAbort.emit();
  }
}
