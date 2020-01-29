import {NgModule} from '@angular/core';
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {TranslateService} from '@ngx-translate/core';
import {BsLocaleService} from 'ngx-bootstrap';
import {LocaleService} from './locale.service';
import {TranslationLoader} from './translation-loader';

export function createTranslateLoader(http: HttpClient) {
  return new TranslationLoader(http, './assets/i18n/portal_', '.json');
}

const translationOptions = {
  loader: {
    provide: TranslateLoader,
    useFactory: (createTranslateLoader),
    deps: [HttpClient]
  }
};

@NgModule({
  imports: [HttpClientModule, TranslateModule.forRoot(translationOptions)],
  exports: [TranslateModule],
  providers: [
    TranslateService,
    BsLocaleService,
    LocaleService
  ]
})
export class TranslationModule {
  constructor(private translate: TranslateService, private localeSvc: LocaleService) {
    let langID = localeSvc.appLangID;

    // Change language according to locale.
    translate.addLangs([langID]);
    translate.setDefaultLang(langID);
    translate.use(langID);
  }
}
