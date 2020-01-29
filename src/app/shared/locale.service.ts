import {Injectable} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeZh from '@angular/common/locales/zh';
import localeZhTw from '@angular/common/locales/zh-Hant';
import localeIt from '@angular/common/locales/it';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeJa from '@angular/common/locales/ja';
import localePt from '@angular/common/locales/pt';
import * as moment from 'moment';
import {defineLocale} from 'ngx-bootstrap/bs-moment';
import {BsLocaleService} from 'ngx-bootstrap';
import {
  de,
  es,
  fr,
  it,
  ja,
  ptBr,
  zhCn
} from 'ngx-bootstrap/locale';
import {LocaleData} from 'ngx-bootstrap';

// tslint:disable:quotemark
// tslint:disable:member-ordering

@Injectable()
export class LocaleService {

  readonly appLangID: string;
  bsLocaleID: string;

  static APPLANG = {
    "en-us": "en-us",
    "en": "en-us",
    "zh-cn": "zh-cn",
    "zh": "zh-cn",
    "es-es": "es-es",
    "es": "es-es",
    "de-de": "de-de",
    "de": "de-de",
    "fr-fr": "fr-fr",
    "fr": "fr-fr",
    "it-it": "it-it",
    "it": "it-it",
    "ja-jp": "ja-jp",
    "ja": "ja-jp",
    "pt-br": "pt-br",
    "pt": "pt-br",
    "zh-tw": "zh-tw"
  };

  static HELPLANG = {
    "en-us": "en",
    "en": "en",
    "zh-cn": "zh",
    "zh": "zh",
    "es-es": "es",
    "es": "es",
    "de-de": "de",
    "de": "de",
    "fr-fr": "fr",
    "fr": "fr",
    "it-it": "it",
    "it": "it",
    "ja-jp": "ja",
    "ja": "ja",
    "pt-br": "pt-br",
    "pt": "pt",
    "zh-tw": "zh-tw"
  };

  static MTLOCALE = {
    "en": "en",
    "zh-hans": "zh-cn",
    "zh-hant": "zh-tw",
    "de": "de-de",
    "es": "es-es",
    "fr": "fr-fr",
    "ja": "ja-jp",
    "it": "it-it",
    "pt": "pt-br"
  };

  static NGLOCALE = {
    "en": "en",
    "zh": "zh-Hans",
    "zh-tw": "zh-Hant",
    "de": "de",
    "es": "es",
    "fr": "fr",
    "it": "it",
    "ja": "ja",
    "pt": "pt"
  };

  static NGLOCALEDATA = {
    "en": localeEn,
    "zh-hans": localeZh,
    "zh-hant": localeZhTw,
    "de": localeDe,
    "es": localeEs,
    "fr": localeFr,
    "it": localeIt,
    "ja": localeJa,
    "pt": localePt
  };

  static BSLOCALE = {
    "en": "en",
    "zh": "zh-cn",
    "es": "es",
    "de": "de",
    "fr": "fr",
    "it": "it",
    "ja": "ja",
    "pt": "pt"
  };

  static BSLOCALEDATA = {
    "zh-cn": zhCn,
    "de": de,
    "es": es,
    "fr": fr,
    "it": it,
    "ja": ja,
    "pt": ptBr
  };

  public static DEFAULT_LOCALE = 'en';
  public static DEFAULT_CULTURELANG = 'en-us';
  public static DEFAULT_NGLOCALEDATA = localeEn;

  static registerLocale(): void {
    let ngLocaleID = LocaleService.getNgLocaleID();

    // console.log('registerLocale()... ngLocaleID=' + ngLocaleID);

    // Register locale data for NG if necessary.
    if (ngLocaleID !== 'en')
      registerLocaleData(LocaleService.getNgLocaleData(ngLocaleID));

    // Define locale for moment
    moment.locale(LocaleService.getMtLangName(ngLocaleID));
  }

  static getAppLangID(): string {
    return LocaleService.getHeaderLangID().replace(/-/g, '_');
  }

  static getDefaultAppLangID(): string {
    return LocaleService.DEFAULT_CULTURELANG.replace(/-/g, '_');
  }

  static getHeaderLangID(): string {
    let cultureLang = LocaleService.getCultureLang();

    if (cultureLang === undefined || LocaleService.APPLANG[cultureLang.toLowerCase()] === undefined) {
      return LocaleService.DEFAULT_CULTURELANG.toLowerCase();
    }

    return LocaleService.APPLANG[cultureLang.toLowerCase()].toLowerCase();
  }

  /**
   * Returns the culture language code name from the browser, e.g. "en-US"
   *
   * @returns {string}
   */
  static getCultureLang(): string {
    let hasLang = navigator.languages && navigator.languages.length > 0;
    return hasLang ? navigator.languages[0] : 'en-US';
  }

  static getSupportedLang(): string {
    let lang = LocaleService.getLang();

    if (lang === undefined || LocaleService.APPLANG[lang.toLowerCase()] === undefined) {
      return LocaleService.DEFAULT_LOCALE;
    }

    return lang;
  }

  /**
   * Returns the language code name from the browser, e.g. "de"
   *
   * @returns {string}
   */
  static getLang(): string {
    let lang = LocaleService.getCultureLang();
    if (lang.indexOf('-') !== -1) {
      lang = lang.split('-')[0];
    }
    if (lang.indexOf('_') !== -1) {
      lang = lang.split('_')[0];
    }
    return lang;
  }

  static getHelpLangID(): string {
    let cultureLang = LocaleService.getCultureLang(), langCode = LocaleService.getLang();

    if (cultureLang !== undefined && LocaleService.HELPLANG[cultureLang.toLowerCase()] !== undefined) {
      return LocaleService.HELPLANG[cultureLang.toLowerCase()];
    }

    if (langCode !== undefined && LocaleService.HELPLANG[langCode.toLowerCase()] !== undefined) {
      return LocaleService.HELPLANG[langCode.toLowerCase()];
    }

    return LocaleService.DEFAULT_LOCALE;
  }

  static getNgLocaleID(): string {
    let cultureLang = LocaleService.getCultureLang(), langCode = LocaleService.getLang();

    if (cultureLang !== undefined && LocaleService.NGLOCALE[cultureLang.toLowerCase()] !== undefined) {
      return LocaleService.NGLOCALE[cultureLang.toLowerCase()];
    }

    if (langCode !== undefined && LocaleService.NGLOCALE[langCode.toLowerCase()] !== undefined) {
      return LocaleService.NGLOCALE[langCode.toLowerCase()];
    }

    return LocaleService.DEFAULT_LOCALE;
  }

  static getBsLocaleID(): string {
    let cultureLang = LocaleService.getCultureLang(), langCode = LocaleService.getLang();

    if (cultureLang !== undefined && LocaleService.BSLOCALE[cultureLang.toLowerCase()] !== undefined) {
      return LocaleService.BSLOCALE[cultureLang.toLowerCase()];
    }

    if (langCode !== undefined && LocaleService.BSLOCALE[langCode.toLowerCase()] !== undefined) {
      return LocaleService.BSLOCALE[langCode.toLowerCase()];
    }

    return LocaleService.DEFAULT_LOCALE;
  }

  private static getNgLocaleData(ngLocaleID: string): LocaleData {
    if (ngLocaleID === undefined || LocaleService.NGLOCALEDATA[ngLocaleID.toLowerCase()] === undefined) {
      return LocaleService.DEFAULT_NGLOCALEDATA;
    }

    return LocaleService.NGLOCALEDATA[ngLocaleID.toLowerCase()];
  }

  private static getMtLangName(ngLocaleID: string): string {
    if (ngLocaleID === undefined || LocaleService.MTLOCALE[ngLocaleID.toLowerCase()] === undefined) {
      return LocaleService.DEFAULT_LOCALE;
    }

    return LocaleService.MTLOCALE[ngLocaleID.toLowerCase()];
  }

  constructor(private bsLocale: BsLocaleService) {
    this.appLangID = LocaleService.getAppLangID();
    this.bsLocaleID = LocaleService.getBsLocaleID();

    // console.log(`Locale service... appLangID=${this.appLangID}, bsLocaleID=${this.bsLocaleID}`);

    // Define locale for ngx-bootstrap if necessary.
    if (this.bsLocaleID !== 'en') {
      let bsLocaleData = this.getBsLocaleData();
      if (bsLocaleData) {
        defineLocale(this.bsLocaleID, bsLocaleData);
        bsLocale.use(this.bsLocaleID);
      }
    }
  }

  private getBsLocaleData(): LocaleData {
    let bsLocaleID = this.bsLocaleID;
    if (bsLocaleID === undefined || LocaleService.BSLOCALEDATA[bsLocaleID.toLowerCase()] === undefined) {
      return null;
    }
    return LocaleService.BSLOCALEDATA[bsLocaleID.toLowerCase()];
  }
}
