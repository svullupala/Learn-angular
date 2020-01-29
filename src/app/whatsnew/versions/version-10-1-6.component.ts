import {Component} from '@angular/core';
import {HelpService} from 'core';
import {SharedService} from 'shared/shared.service';
import {TranslateService} from '@ngx-translate/core';
import {LocaleService} from 'shared/locale.service';
import {DynaComp} from 'shared/dynacomp.service';

@Component({
  selector: 'version-10-1-6',
  styleUrls: ['./version-10-1-6.component.scss'],
  templateUrl: './version-10-1-6.component.html'
})
export class Version_10_1_6Component implements DynaComp {
  data: any;

  private ngLocaleId: string;

  //external links
  private bugFixUrl: string = 'https://www-01.ibm.com/support/docview.wss?uid=swg22014122';
  private featureDocsUrl: string = 'https://www-01.ibm.com/support/docview.wss?uid=swg22014120';
  private enhancementUrl: string = 'https://www.ibm.com/support/knowledgecenter/SSNQFQ_10.1.6/spp/r_techchg_spp.html';

  constructor(private help: HelpService, private translate: TranslateService) {
    this.ngLocaleId = LocaleService.getNgLocaleID();
  }

  goLearnMore(key: string) {
    console.log('Help URL: ' + this.help.getHelp('whatsnew-10-1-6-' + key));
    SharedService.openUrl(this.help.getHelp('whatsnew-10-1-6-' + key), '');
  }

  goBugFixes() {
    SharedService.openUrl(this.bugFixUrl, '');
  }

  goFeatureDocs() {
    SharedService.openUrl(this.featureDocsUrl, '');
  }

  goEnhancements() {
    SharedService.openUrl(this.enhancementUrl, '');
  }

  getCardLinkIconCls(): string {
    let cls = 'bidi-link-blue';
    if ('es' === this.ngLocaleId || 'ja' === this.ngLocaleId)
      cls += ' maybe-long-text';
    if ('ja' === this.ngLocaleId)
      cls += ' offset';
    return cls;
  }
}
