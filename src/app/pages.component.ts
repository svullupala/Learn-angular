import { ViewChild, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, Routes, NavigationStart, NavigationEnd, Event} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AlertComponent, AlertType, ErrorHandlerComponent, DownloaderComponent, AboutDialogComponent }
  from 'shared/components';
import { SessionService, RestService } from 'core';
import { QuickStartComponent } from './quickstart/quickstart.component';
import { QuickStartService } from './quickstart/quickstart.service';
import { SharedService } from 'shared/shared.service';
import { FeedbackComponent } from './feedback/feedback.component';
import { FeedbackService } from './feedback/feedback.service';
import { LicenseModel } from './license/license.model';
import { GlobalState } from './global.state';
import { VersionService } from 'shared/version-info/version.service';
import { VersionModel } from 'shared/version-info/version.model';
import { JsonConvert } from 'json2typescript';

// tslint:disable:max-line-length
@Component({
  //To prevent the error: ExpressionChangedAfterItHasBeenCheckedError
  // changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pages',
  styleUrls: ['pages.component.scss'],
  templateUrl: './pages.component.html',
  providers: [VersionService]
})
export class Pages implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(AlertComponent) alert: AlertComponent;
  @ViewChild(ErrorHandlerComponent) errorHandler: ErrorHandlerComponent;
  @ViewChild(DownloaderComponent) downloader: DownloaderComponent;
  @ViewChild(AboutDialogComponent) aboutDlg: AboutDialogComponent;
  @ViewChild(QuickStartComponent) quickStartDlg: QuickStartComponent;
  @ViewChild(FeedbackComponent) feedbackDlg: FeedbackComponent;

  private isSessionExpired: boolean = false;
  private showAbout: boolean = false;
  private showQuickStart: boolean = false;
  private showFeedback: boolean = false;
  private textConfirm: string;
  private textConfirmLogout: string;
  private hideAlertSub: any;
  private tooltipShowSub: any;
  private tooltipHideSub: any;
  private textDownloadTitle: string;
  private textDownloadInitiatedMsg: string;
  private textDownloadTestToolTitle: string;
  private textDownloadTestToolInitiatedMsg: string;
  private timer: any;
  private license: LicenseModel;
  private showBanner: boolean = false;
  private isSidebarHidden: boolean = false;
  private versionInfo: VersionModel = undefined;
  private backgroundColor: string = "F0F3F4";
  private textWhatsNewToolTip: string;
  private maskPage: boolean = false;
  private textWhatsNewBanner: string;

  constructor(private translate: TranslateService,
    private router: Router,
    private quickStartService: QuickStartService,
    private state: GlobalState,
    private rest: RestService,
    private versionService: VersionService,
    private feedbackService: FeedbackService) {

    this.state.subscribe('main.alcontent', (screen) => {
      if (screen && screen.full === true) {
        this.goFullScreen(screen.backgroundColor, screen.fontColor, screen.title, screen.url);
      } else if (screen && screen.full === false) {
        this.resetFullScreen();
      }
    });
  }

  private goFullScreen(backgroundColor: string, fontColor: string, title: string, prevUrl: string): void {
    if (this.isSidebarHidden) {
      return;
    }

    if (backgroundColor) {
      SharedService.setMainBackgroundColor(backgroundColor);
    }

    this.state.notifyDataChanged('menu.isCollapsed', true);

    setTimeout(()=>{
      this.isSidebarHidden = true;
      }, 1);
  }

  private resetFullScreen(): void {
    if (!this.isSidebarHidden) {
      return;
    }

    SharedService.setMainBackgroundColor(this.backgroundColor);

    this.isSidebarHidden = false;
  }

  ngOnInit() {
    let me = this;
    // Issue: Bootstrap-Modal-Dialog-showing-under-Modal-Background,
    // see https://weblog.west-wind.com/posts/2016/Sep/14/Bootstrap-Modal-Dialog-showing-under-Modal-Background.
    // Workaround: Save the alert instance to the context['msgbox.alert'] of Session service for usability later.
    SessionService.getInstance().context['msgbox.alert'] = this.alert;
    SessionService.getInstance().context['errorHandler'] = this.errorHandler;
    SessionService.getInstance().context['downloader'] = this.downloader;
    me.translate.get([
      'common.textConfirm',
      'common.textConfirmLogout',
      'common.textDownloadInitiatedMsg',
      'common.textDownloadTestToolInitiatedMsg',
      'common.textDownloadTestTool',
      'job.textDownloadLogs',
      'common.textWhatsNewToolTip',
      'common.textWhatsNewBanner',
    ])
      .subscribe((resource: Object) => {
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmLogout = resource['common.textConfirmLogout'];
        me.textDownloadInitiatedMsg = resource['common.textDownloadInitiatedMsg'];
        me.textDownloadTitle = resource['job.textDownloadLogs'];
        me.textDownloadTestToolInitiatedMsg = resource['common.textDownloadTestToolInitiatedMsg'];
        me.textDownloadTestToolTitle = resource['common.textDownloadTestTool'];
        me.textWhatsNewToolTip = resource['common.textWhatsNewToolTip'];
        me.textWhatsNewBanner = resource['common.textWhatsNewBanner'];
      });

    // Figure out if we need to show the quick start before the cycle gets too late.
    me.showQuickStart = me.quickStartService.getFlag();

    if (me.alert) {
      me.hideAlertSub = me.alert.hideEvent.subscribe(() => {
        SharedService.restoreBodyScrollbar();
      });
    }

    me.versionService.getVersion()
      .subscribe(
        data => {
          me.versionInfo = JsonConvert.deserializeObject(data, VersionModel);
          if (me.versionInfo.version !== undefined && me.versionInfo.version !== me.getBannerFlag()) {
            me.textWhatsNewBanner =  SharedService.formatString(me.textWhatsNewBanner, me.versionInfo.version)            
            this.showBanner = true;
          }
        },
        err => {
          this.showBanner = false;
        }
      );
      this.initRouterListener();
  }

  ngAfterViewInit(): void {
    this.state.notifyDataChanged('menu.isCollapsed', true);
    this.backgroundColor = SharedService.setMainBackgroundColor(undefined);
  }

  ngOnDestroy(): void {
    if (this.hideAlertSub) {
      this.hideAlertSub.unsubscribe();
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.tooltipShowSub) {
      this.tooltipShowSub.unsubscribe();
    }
    if (this.tooltipHideSub) {
      this.tooltipHideSub.unsubscribe();
    }
  }

  onSessionExpired(): void {
    this.isSessionExpired = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  onAbout(hide?: boolean): void {
    let me = this, dlg = me.aboutDlg;
    me.showAbout = !hide;
    if (dlg && !hide)
      dlg.show();
  }

  onQuickStart(hide?: boolean): void {
    let me = this, quickStartDlg = me.quickStartDlg;
    me.showQuickStart = !hide;
    if (quickStartDlg && !hide) {
      quickStartDlg.show();
    }
  }

  onShowFeedback(hide?: boolean): void {
    let me = this, feedbackDlg = me.feedbackDlg;
    me.showFeedback = !hide;
    console.log('onShowFeedback');
    if (feedbackDlg && !hide) {
      feedbackDlg.show();
    }
  }

  onLogout(): void {
    let me = this;
    me.confirm(function () {
      me.router.navigate(['/pages/logout']);
    });
  }

  onWhatsNew(): void {
    let me = this;
    me.onCloseBanner(false);
    me.router.navigate(['/pages/whatsnew']);
  }

  onLogo(): void {
    this.router.navigate(['/pages/dashboard']);
  }

  onDownloadLogs(): void {
    let me = this;
    if (me.alert)
      me.alert.show(me.textDownloadTitle, me.textDownloadInitiatedMsg);
  }

  onDownloadTestTool(): void {
    let me = this;
    if (me.alert)
      me.alert.show(me.textDownloadTestToolTitle, me.textDownloadTestToolInitiatedMsg);
  }

  onCloseBanner(showToolTip: boolean): void {
    this.showBanner = false;
    if (this.versionInfo !== undefined)
      this.setBannerFlag(this.versionInfo.version);

    if (showToolTip)
      this.state.notifyDataChanged('menu.flashtooltip', this.textWhatsNewToolTip, true);
  }

  setBannerFlag(value: string) {
    let userModel = SessionService.getInstance().getUserModel();
    userModel.updateMetadata('whatsNewBanner', value, this.rest);
  }

  getBannerFlag(): string {
    let userModel = SessionService.getInstance().getUserModel();

    if (userModel.metadata !== undefined && userModel.metadata.whatsNewBanner !== undefined) {
      return userModel.metadata.whatsNewBanner;
    } else {
      return undefined;
    }
  }


  private confirm(handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, me.textConfirmLogout, AlertType.CONFIRMATION, handler);
  }

  private handleFeedback(license: LicenseModel): void {
    let me = this;
    me.license = license;
    if (!me.license.isTrial())
      if (me.feedbackService.shouldShowFeedback()) {
        // Wait for 30 seconds
        console.log('Count 30 seconds to show feedback form.');
        me.timer = setTimeout(function () {
          me.showFeedback = true;
          me.onShowFeedback();
        }, 30000);
      }
  }
  
  private initRouterListener() {
    let me = this;

    me.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        setTimeout(() => {
          me.maskPage = true;      
        }, 1);
      } else if (event instanceof NavigationEnd) {
        setTimeout(() => {
          me.maskPage = false;      
        }, 1);
      }
    });
  }
}
