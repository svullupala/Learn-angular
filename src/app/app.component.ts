import { Routes } from '@angular/router';
import {Component, HostListener, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';

import { GlobalState } from './global.state';
import { BaImageLoaderService, BaThemePreloader, BaThemeSpinner } from './theme/services';
import { layoutPaths } from './theme/theme.constants';
import { BaThemeConfig } from './theme/theme.config';
import { BaMenuService } from './theme';
import { MENU } from './app.menu';

import 'style-loader!./app.scss';
import 'style-loader!./theme/initial.scss';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {LocaleService} from './shared/locale.service';
import {AlertComponent, AlertType} from './shared/components/msgbox/alert.component';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';
import {TAB} from '@angular/cdk/keycodes';
import { environment } from './environment';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  template: `
    <main [ngClass]="{'menu-collapsed': isMenuCollapsed}" baThemeRun>
      <div class="additional-bg"></div>
      <router-outlet></router-outlet>
      <msgbox-alert [autoShow]= "false"></msgbox-alert>
    </main>
  `
})
export class App implements OnInit, OnDestroy {

  @ViewChild(AlertComponent) alert: AlertComponent;
  hideAlertSub: any;
  isMenuCollapsed: boolean = false;
  forcedReload: boolean = false;
  langDetectClock: Subscription;
  langCode: string;
  warningTitle: string;
  textLanguageChangeDetected: string;

  constructor(private _state: GlobalState,
              private _imageLoader: BaImageLoaderService,
              private _spinner: BaThemeSpinner,
              private _config: BaThemeConfig,
              private _menuService: BaMenuService,
              private viewContainerRef: ViewContainerRef,
              private translate: TranslateService) {

    this._menuService.updateMenuByRoutes(<Routes>MENU);

    // this._loadImages();

    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      setTimeout(() => {
        this.isMenuCollapsed = isCollapsed;
      }, 100);
    });

  }

  @HostListener('window:beforeunload', ['$event'])
  // NOTE: Prevent displaying confirm modal when autologin mode is on - this is for faster development;
  confirmPageQuit($event) {
    if (!environment.autologin) {
      confirm()
      {
        if (!this.forcedReload)
          return false;
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    let target = event && event.srcElement ? event.srcElement : event.target;
    if (target && event.keyCode === TAB) {
      if (SharedService.isModalBackgroundElement(target)) {
        SharedService.focusFirstFocusableElementInOpenModal();
        event.preventDefault();
      } else if (SharedService.isDrpBackgroundElement(target)) {
        SharedService.focusFirstFocusableElementInOpenDrp();
        event.preventDefault();
      } else if (SharedService.isDpBackgroundElement(target)) {
        SharedService.focusFirstFocusableElementInOpenDp();
        event.preventDefault();
      }
    }
  }

  public ngAfterViewInit(): void {
    // hide spinner once all loaders are completed
    BaThemePreloader.load().then((values) => {
      this._spinner.hide();
    });
  }
  //
  // private _loadImages(): void {
  //   // register some loaders
  //   BaThemePreloader.registerLoader(this._imageLoader.load(layoutPaths.images.root + 'sky-bg.jpg'));
  // }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.warningTitle',
      'common.textLanguageChangeDetected'
    ])
      .subscribe((resource: Object) => {
        me.warningTitle = resource['common.warningTitle'];
        me.textLanguageChangeDetected = resource['common.textLanguageChangeDetected'];
      });
    this.initLangDetectClock();
  }

  ngOnDestroy() {
    this.destroyHideAlertSub();
    this.destroyLangDetectClock();
  }

  private destroyLangDetectClock() {
    let me = this;
    if (me.langDetectClock) {
      me.langDetectClock.unsubscribe();
      me.langDetectClock = undefined;
    }
  }

  private destroyHideAlertSub() {
    let me = this;
    if (me.hideAlertSub) {
      me.hideAlertSub.unsubscribe();
      me.hideAlertSub = undefined;
    }
  }

  private detectLangChange() {
    let me = this, lang = LocaleService.getCultureLang();
    if (me.langCode !== lang) {

      if (me.alert && me.hideAlertSub === undefined) {
        me.alert.show(me.warningTitle, me.textLanguageChangeDetected,
          AlertType.WARNING, undefined, undefined, 0);
        me.hideAlertSub = me.alert.hideEvent.subscribe(() => {
          if (window.location) {
            me.forcedReload = true;
            me.destroyLangDetectClock();
            me.destroyHideAlertSub();
            window.location.reload();
          }
        });
      }
    }
  }

  private initLangDetectClock() {
    let me = this;
    me.langCode = LocaleService.getCultureLang();
    this.langDetectClock = Observable.interval(5000).subscribe(
      () => {
        me.detectLangChange();
      }
    );
  }
}
