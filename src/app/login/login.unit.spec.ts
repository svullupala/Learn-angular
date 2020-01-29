// Unit test for the login component beginning suite
import {FormGroup, AbstractControl, FormBuilder, Validators} from '@angular/forms';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/throw';

import { LoginService } from './login.service';
import { ErrorModel } from 'shared/models/error.model';
import { LoginComponent }  from './login.component';
import { Observable } from 'rxjs/Observable';

describe('Login component onsubmit method', () => {
	let loginComponent: LoginComponent,
      loginService: LoginService,
      formBuilder: FormBuilder,
      userCredentials = {username: 'admin', password: 'syncs0rt'};


  beforeEach(() => {
     formBuilder = new FormBuilder();
     loginService = new LoginService(null);
     loginComponent = new LoginComponent(loginService, null, formBuilder, null);

     loginComponent.form = formBuilder.group({
       'username': [userCredentials.username, Validators.compose([Validators.required, Validators.minLength(1)])],
       'password': [userCredentials.password, Validators.compose([Validators.required, Validators.minLength(1)])]
     });
  });

  it('it should successfully call the login method from the login service since the form is valid', () => {
    let spyOnLoginServiceLoginMethod = spyOn(loginComponent.loginService, 'login').and.returnValue(Observable.empty());

    loginComponent.onSubmit();

    expect(loginComponent.form.valid).toBeTruthy();

    expect(spyOnLoginServiceLoginMethod).toHaveBeenCalled();
  });

  // it('it should handle the case then the login call from the login service fails and assign appropriate strings from the backend failed response', () => {
  //   let error: ErrorModel = new ErrorModel("XSBAuthenticationException", "Login has failed due to incorrect user name or password. Please try again.");
  //   let errorResponse: Object = {status: 401, statusText: 'Unauthorized', _body: JSON.stringify(error)};
  //
  //   spyOn(loginComponent.loginService, 'login').and.returnValue(Observable.throw(errorResponse));
  //
  //   loginComponent.onSubmit();
  //
  //   expect(loginComponent.error).toEqual(error);
  // });

});
