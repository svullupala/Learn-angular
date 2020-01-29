import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {SharedService} from 'shared/shared.service';
import {LocaleService} from 'shared/locale.service';
import {environment} from '../environment';

@Injectable()
export class HelpService {
  private defaultLocale = LocaleService.getHelpLangID();
  private defaultUrl = 'http://' + window.location.hostname + ':9090/SSNQFQ_10.1.5/spp/' + this.defaultLocale + '/welcome.html';
  private defaultJsonUrl = 'assets/help/help-map.json';
  private hostname = window.location.hostname;
  private contextHelpMap: any = undefined;

  constructor(private http: HttpClient, private router: Router) {
    this.init();
  }

  public getHelpUrl(): string {
    if (this.contextHelpMap === undefined) {
      return this.defaultUrl;
    }
    console.log('CORE_IP: ' + CORE_IP);
    return SharedService.formatString(CORE_IP ? this.contextHelpMap['localUrlHTTP'] : this.contextHelpMap['localUrl'], this.defaultLocale, this.getHelpContext(), CORE_IP || this.hostname);
  }

  public getHelp(key: string): string {
    if (key === undefined) {
      return this.defaultUrl;
    }
    console.log('CORE_IP: ' + CORE_IP);
    return SharedService.formatString(CORE_IP ? this.contextHelpMap['localUrlHTTP'] : this.contextHelpMap['localUrl'], this.defaultLocale, this.lookup(key), CORE_IP || this.hostname);
  }

  public getMessageId(key: string): string{
    if (key === undefined) {
    return this.defaultUrl;
    }
    console.log('CORE_IP: ' + CORE_IP);
    // At this time, messageId userresponses in the KC are not translated
    return SharedService.formatString(CORE_IP ? this.contextHelpMap['messageUrlHTTP'] : this.contextHelpMap['messageUrl'], 'en', key, CORE_IP || this.hostname);
  }

  private getHelpContext(): string {
    let route: string = this.router.url;
    return this.lookup(route);
  }

  private lookup(key: string): string {
    let retVal = this.contextHelpMap[key];
    if (retVal === undefined || retVal === '') {
      return this.contextHelpMap['default'];
    }

    return retVal;
  }

  private init() {
    if (CORE_IP) {
      this.defaultUrl = 'http://' +  CORE_IP + ':9090/SSNQFQ_10.1.5/spp/' + this.defaultLocale + '/welcome.html';
    } else {
      this.defaultUrl = 'http://' +  window.location.hostname + ':9090/SSNQFQ_10.1.5/spp/' + this.defaultLocale + '/welcome.html';
    }
    this.getMap().subscribe(
      map => {
        this.contextHelpMap = map;
      }
    );
  }

  private getMap(): Observable<any> {
    return this.http.get(this.defaultJsonUrl).map(this.extractData).catch(this.handleError);
  }

  private extractData(res: Object) {
    let body = res;
    return body || {};
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

}
