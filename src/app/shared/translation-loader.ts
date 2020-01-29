import {HttpClientModule, HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {TranslateService} from '@ngx-translate/core';
import {BsLocaleService} from 'ngx-bootstrap';
import {LocaleService} from './locale.service';

// en.temp.json must always exist.  At the very least it can be empty {}
//  we only secondary translation for en language.
export class TranslationLoader implements TranslateLoader {
	mainTransloader: TranslateLoader;
	secondaryTransloader: TranslateLoader;
  USE_DEFAULT: boolean = true;

	constructor(http: HttpClient, prefix: string, suffix: string) {
		this.mainTransloader = new TranslateHttpLoader(http, prefix, suffix);
		this.secondaryTransloader = new TranslateHttpLoader(http, prefix, '.temp' + suffix);
  }

	getTranslation(lang: string): Observable<any> {
		let main = this.getMainTranslation(lang);
		
		if (lang === LocaleService.DEFAULT_LOCALE || lang === LocaleService.getDefaultAppLangID()) {
			return main.flatMap(
				(data) => {
					return this.mergeSecondaryTranslation(data);
				}
			);
		}

    if (this.USE_DEFAULT) {
      return main.flatMap(
        (data) => {
          return this.mergeDefaultTranslation(data);
        }
      );
    } 
    
    return main;
	}

	getMainTranslation(lang: string): Observable<any> {
		return this.mainTransloader.getTranslation(lang);
	}

  mergeDefaultTranslation(main: any): Observable<any> {
		return this.mainTransloader.getTranslation(LocaleService.getDefaultAppLangID()).map(
			(data) => {
				this.merge(data, main);
				return data;
			}
		);
  }

	mergeSecondaryTranslation(main: any): Observable<any> {
		return this.secondaryTransloader.getTranslation(LocaleService.DEFAULT_LOCALE).map(
			(data) => {
				this.merge(main, data);
				return main;
			}
		);
	}

	private merge(current: any, update: any) {
		Object.keys(update).forEach(key => {
			if (current.hasOwnProperty(key) && typeof current[key] === 'object') {
				this.merge(current[key], update[key]);
			} else {
				current[key] = update[key];	
			}
		});
	}
}
