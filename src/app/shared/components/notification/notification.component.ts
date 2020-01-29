import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {EmailValidator} from 'theme/validators/email.validator';
import {SdlTooltipDirective} from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';

@Component({
  selector: 'notification-component',
  templateUrl: 'notification.component.html',
  styleUrls: ['notification.component.scss']
})

export class NotificationComponent implements OnInit {

  private notificationForm: FormGroup;
  private notificationList: Array<string> = [];
  private email: AbstractControl;
  private error: boolean = false;

  suggest: boolean = false;

  constructor() {}

  ngOnInit() {
    this.notificationForm = new FormGroup({email: new FormControl('', [])});
    this.email = this.notificationForm.controls['email'];
  }

  public emptyNotificationList(): void {
    this.notificationList = [];
    this.email.reset('');
  }

  public getNotification(): Array<string> {
    return this.notificationList && this.notificationList;
  }

  public setNotification(notifications: Array<string>): void {
    this.notificationList = notifications;
  }

  public validate(): boolean {
    let valid = EmailValidator.validate(this.email);
    this.error = valid === null ? false : true;
    return valid === null;
  }

  public onAddNotification(): void {
    this.notificationList.push(this.email.value);
    this.email.reset('');
  }

  public isInputEmpty(): boolean {
    return this.email.value === '';
  }


  private onRemoveNotification(index: number): void {
    this.notificationList.splice(index, 1);
  }

  public errorCondition(): boolean {
    return this.error;
  }

  private onEnterPressed(keyStroke) {
    if (keyStroke.keyCode === 13 && this.validate()) {
      this.onAddNotification();
    }
  }

}
