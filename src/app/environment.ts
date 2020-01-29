// Angular 2
// rc2 workaround
import { enableDebugTools, disableDebugTools } from '@angular/platform-browser';
import { enableProdMode, ApplicationRef } from '@angular/core';
// Environment Providers
let PROVIDERS: any[] = [
  // common env directives
];

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
let _decorateModuleRef = function identity<T>(value: T): T { return value; };

let _productionMode = () => { return false; };

if ('production' === ENV || 'renderer' === ENV) {
  // Production
  disableDebugTools();
  enableProdMode();

  PROVIDERS = [
    ...PROVIDERS,
    // custom providers in production
  ];

  _productionMode = () => { return true; };

} else {

  _decorateModuleRef = (modRef: any) => {
    const appRef = modRef.injector.get(ApplicationRef);
    const cmpRef = appRef.components[0];

    let _ng = (<any>window).ng;
    enableDebugTools(cmpRef);
    (<any>window).ng.probe = _ng.probe;
    (<any>window).ng.coreTokens = _ng.coreTokens;
    return modRef;
  };

  // Development
  PROVIDERS = [
    ...PROVIDERS,
    // custom providers in development
  ];

}

export const productionMode = _productionMode;

export const environment = {
  REST_SERVER: undefined,
  NODE_SERVER: undefined,
  DummyServiceEnabled: DummyServiceEnabled,
  /**
   * For faster development process you can assign
   * { username: '<username>', password: '<password>', redirectUrl: null }` object to `autologin` property.
   * It will log in automatically when you save changes or reload page and redirect to last opened URL.
   * Assign value (e.g. `/pages/dashboard`) to `redirectUrl` if you always want to be redirected to a specific URL.
   */
  autologin: null,
};

export const decorateModuleRef = _decorateModuleRef;

export const ENV_PROVIDERS = [
  ...PROVIDERS
];
