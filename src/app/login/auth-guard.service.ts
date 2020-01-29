import {Injectable}       from '@angular/core';
import {
  CanActivate, Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild
}                           from '@angular/router';

import {LoginService}      from './login.service';
import {SessionService} from 'core';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private loginService: LoginService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let url: string = state.url, result = this.checkLogin(url);
    if (result && !this.skipRbacCheck(url))
      result = this.checkRbac(url);
    return result;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  /**
   * Check if have already signed in or not.
   *
   * @param url {String}
   * @returns {boolean}
   */
  checkLogin(url: string): boolean {
    if (this.loginService.isLoggedIn) {
      return true;
    }
    // Store the attempted URL for redirecting
    this.loginService.redirectUrl = url;
    // Navigate to the login page
    this.router.navigate(['/login']);
    return false;
  }

  /**
   * Check RBAC related.
   *
   * @param url {String}
   * @returns {boolean}
   */
  checkRbac(url: string): boolean {
    let rbacReady = SessionService.getInstance().rbacReady,
      routerPaths = rbacReady ? SessionService.getInstance().routerPathsAllowed : [],
      defaultPath = routerPaths && routerPaths.length > 0 ? routerPaths[0] : '/login';
    if (!rbacReady || routerPaths.indexOf(url) !== -1)
      return true;

    // Navigate to the default page
    this.router.navigate([defaultPath]);
    return false;
  }

  /**
   * Returns true if need to skip RBAC related check.
   * @param {string} url
   * @returns {boolean}
   */
  skipRbacCheck(url: string): boolean {
    // TODO: Add more items in the array if necessary.
    return ['/login', '/pages/logout', '/pages/whatsnew', '/pages/jobsandoperations'].indexOf(url) !== -1;
  }
}
