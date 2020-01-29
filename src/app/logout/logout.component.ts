import {Component, OnInit} from '@angular/core';

import {Router}      from '@angular/router';
import {LoginService} from '../login/login.service';
import {LogoutService} from './logout.service';
import {SessionService} from 'core';

@Component({
  selector: 'logout',
  template: '',
})
export class LogoutComponent implements OnInit {
  private session: SessionService;

  constructor(public loginService: LoginService, public logoutService: LogoutService, public router: Router) {
    this.session = SessionService.getInstance();
  }

  ngOnInit() {
    let me = this;
    if (me.loginService.isLoggedIn) {
      me.logoutService.logout()
        .subscribe(
          data => {
          },
          err => me.afterLogout(),
          () => me.afterLogout()
        );
    }
  }

  private afterLogout(): void {
    let me = this;
    me.loginService.isLoggedIn = false;

    // Clean up the session id & context.
    me.session.sessionId = '';
    me.session.context = null;

    me.router.navigate(['/login']);
  }
}
