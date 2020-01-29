import {Component, OnInit, Output, Input, EventEmitter, OnDestroy, TemplateRef, ElementRef, ViewChild} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {DateFormatPipe} from 'angular2-moment';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {GlobalState} from '../../../global.state';

import 'style-loader!./baPageTop.scss';
import {HelpService, RestService, SessionService} from 'core';
import {DownloaderComponent} from '../downloader/downloader.component';
import {SharedService} from '../../shared.service';
import {LicenseService} from '../../../license/license.service';
import {LicenseModel} from '../../../license/license.model';
import {ErrorHandlerComponent} from '../error-handler/error-handler.component';
import {HighlightableList} from 'shared/util/keyboard';
import {LocaleService} from 'shared/locale.service';

@Component({
  selector: 'ba-page-top',
  templateUrl: './baPageTop.html',
})
export class BaPageTop extends HighlightableList implements OnInit, OnDestroy {

  @Output() logo = new EventEmitter<any>();
  @Output() about = new EventEmitter<any>();
  @Output() logout = new EventEmitter<any>();
  @Output() onGetLicenseEvent: EventEmitter<LicenseModel> = new EventEmitter<LicenseModel>();
  @Output() quickstart = new EventEmitter<any>();
  @Output() downloadlogs = new EventEmitter<any>();
  @Output() downloadtesttool = new EventEmitter<any>();
  @Output() whatsnew = new EventEmitter<any>();

  @Input() toolTip: string = undefined;

  @ViewChild('dropdown') dropdown: ElementRef;

  public isScrolled: boolean = false;
  public isMenuCollapsed: boolean = false;
  public isDownloadLogCapable: boolean = true;
  downloader: DownloaderComponent;
  sessionService: SessionService;
  errorHandler: ErrorHandlerComponent;
  welcomeText: string;
  userIconMode: boolean = false;
  private subs: Subject<void> = new Subject<void>(); // this will keep a list of observers
  private license: LicenseModel;
  private textExpirationDate: string;
  private datePipe: DateFormatPipe;

  private restApiDocUrl: string = 'assets/apidoc/SPP_API_Guide.pdf';
  private vSnapApiDocUrl: string = 'assets/apidoc/SPP_vSnap_API_Guide.pdf';
  private checkLogUrl: string = 'api/endeavour/log/download/diagnostics?viewcheck=true';
  private testToolJarUrl: string = 'assets/tool/ngxdd.jar';
  private ngLocaleId: string;

  constructor(private _state: GlobalState,
              private core: RestService,
              private licenseService: LicenseService,
              private translate: TranslateService,
              private helpService: HelpService) {
    super();

    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });

    this._state.subscribe('menu.flashtooltip', (message) => {
      if (message !== undefined)
        this.flashMenuToolTip(message);
    });
    this.datePipe = new DateFormatPipe();
    this.ngLocaleId = LocaleService.getNgLocaleID();
  }

  ngOnInit() {
    this.getLogViewCheck().takeUntil(this.subs).subscribe(
      (allowed: boolean) => {
        this.isDownloadLogCapable = allowed;
      }
    );

    this.translate.get(['license.textExpirationDate']).takeUntil(this.subs)
      .subscribe(
        (resources: Object) => {
          this.textExpirationDate = resources['license.textExpirationDate'];
        }
      );
    this.sessionService = SessionService.getInstance();
    this.downloader = this.sessionService.context['downloader'];
    this.errorHandler = this.sessionService.context['errorHandler'];
    this.welcomeText = this.sessionService.getAccountName();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.licenseService.getLicense().takeUntil(this.subs).subscribe(
      (license: LicenseModel) => {
        this.license = license;
        SessionService.getInstance().license = this.license;
        this.onGetLicenseEvent.emit(this.license);
        this.textExpirationDate = SharedService.formatString(this.textExpirationDate,
          this.getExpirationDate(this.license));
      },
      (err: HttpErrorResponse) => this.errorHandler.handle(err, false, true)
    );

  }

  ngOnDestroy() {
    // [SC] this cleans up any observers by sending a broadcast and completing.
    // This component will only get destroyed when the session ends. Hey, best practice.
    // Better safe than sorry, man.
    this.subs.next();
    this.subs.complete();
  }

  flashMenuToolTip(message: string): void {
    Observable.interval(250).take(1).takeUntil(this.subs).subscribe(
        () => {
          this.toolTip = message;
        }
      );
    Observable.interval(3500).take(1).takeUntil(this.subs).subscribe(
      () => {
        this.toolTip = undefined;
      }
    );
  }


  public menuOpened(downdown: any): boolean {
    return downdown && downdown.classList && downdown.classList.contains('open');
  }

  public isTrialVersion() {
    return this.license && this.license instanceof LicenseModel && this.license.isTrial();
  }

  public toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
    return false;
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }

  public OnMenuClick(e: HTMLElement) {
    switch (e.id) {
      case 'about':
        // alert('Build: ' + environment.BUILD.NUMBER + ' ' + environment.BUILD.TIMESTAMP);
        this.about.emit();
        break;
      case 'whatsnew':
        this.whatsnew.emit();
        break;
      case 'logout':
        this.logout.emit();
        break;
      case 'quickstart':
        this.quickstart.emit();
        break;
      case 'launchapi':
        this.launchRestApi();
        break;
      case 'docvsnapapi':
        this.openUrl(this.vSnapApiDocUrl, 'docvsnapapi');
        break;
      case 'launchtesttool':
        this.launchTestTool();
        break;
      default:
        break;
    }
    this.ensureCloseDropdown();
    return false;
  }

  /**
   * Get download url for logs.
   *
   * @method getDownloadLogsUrl
   * @return {string} downloadUrl The url to download logs
   */
  public getDownloadLogsUrl(): string {
    let me = this,
      logUrl: string = '{0}api/endeavour/log/download/diagnostics?esessionid={1}',
      sessionId: string = me.sessionService.sessionId,
      baseUrl: string = me.core.getBaseUrl(),
      downloadUrl: string = SharedService.formatString(logUrl, baseUrl, sessionId);

    return downloadUrl && downloadUrl;
  }

  /**
   * Check download log permission
   *
   * @returns {OperatorFunction<T, R>}
   */
  private getLogViewCheck(): Observable<boolean> {
    this.core.setNoAuditHeader(true);
    return this.core.getAll(this.checkLogUrl).map(
      res => {
        let body = res;
        if (body.system !== undefined && body.system === true) {
          return true;
        }
        return false;
      },
      err => {
        return false;
      }
    );
  }

  /**
   * Download logs.
   *
   * @method onDownloadLog
   */
  private onDownloadLogs() {
    let me = this,
        downloadUrl: string = me.getDownloadLogsUrl();
    if (me.downloader && downloadUrl) {
      me.downloader.download(downloadUrl);
      me.downloadlogs.emit();
    }
    me.ensureCloseDropdown();
  }

  private onLaunchHelp() {
    console.log('Help URL: ' + this.helpService.getHelpUrl());
    this.openUrl(this.helpService.getHelpUrl(), 'spp_help');
  }

  private onBumper() {
    this.userIconMode = !this.userIconMode;
  }

  /**
   * Open the specified URL.
   *
   * @method openUrl
   * @param {String} url An URL.
   */
  private openUrl(url: string, frameName: string) {
    let popup,
        windowParams = 'directories=no,location=no,menubar=no,resizable=yes,scrollbars=yes,toolbar=yes,titlebar=yes';
    popup = window.open(url, frameName, windowParams);
    if (popup) {
      popup.focus();
    }
  }

  private getExpirationDate(license: LicenseModel): string {
    return this.datePipe.transform(license.expiryDate, ('ja' === this.ngLocaleId) ? 'll dddd' : 'dddd ll');
  }

  private onLogoClick(): void {
    this.logo.emit();
  }

  private launchTestTool(): void {
    let testToolTpl = '{0}//{1}/sst/';
    this.openUrl(SharedService.formatString(testToolTpl,
      location.protocol, location.hostname), 'testtool');
  }

  private launchRestApi(): void {
    let me = this,
        tpl = '{0}//{1}/api/endeavour/apidoc/?sessionid={2}&locale={3}',
        sessionId: string = me.sessionService.sessionId;

    this.openUrl(SharedService.formatString(tpl,
      location.protocol, location.hostname, sessionId, LocaleService.getHeaderLangID()), 'restapi');
  }

  private onDownloadTestTool() {
    let me = this,
      downloadUrl: string = me.testToolJarUrl;
    if (me.downloader && downloadUrl) {
      me.downloader.download(downloadUrl);
      me.downloadtesttool.emit();
    }
    me.ensureCloseDropdown();
  }

  private ensureCloseDropdown(): void {
    if (this.dropdown && this.dropdown.nativeElement && this.dropdown.nativeElement.classList)
      this.dropdown.nativeElement.classList.remove('open');
  }
}
