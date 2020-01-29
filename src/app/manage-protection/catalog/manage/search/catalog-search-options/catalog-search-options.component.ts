import {Component, NgZone, Renderer2} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {BsDaterangepickerDirective} from 'ngx-bootstrap/datepicker';
import {CatalogSearchOptionsModel} from '../catalog-search-options.model';
import {KeyboardDateRange} from 'shared/util/keyboard-date-range';
import {FocusMonitor} from '@angular/cdk/a11y';
import {BsDatepickerState} from 'ngx-bootstrap/datepicker/reducer/bs-datepicker.state';
import {LocaleService} from 'shared/locale.service';

@Component({
  selector: 'catalog-search-options',
  styleUrls: ['./catalog-search-options.component.scss'],
  templateUrl: './catalog-search-options.component.html',
})
export class CatalogSearchOptionsComponent extends KeyboardDateRange {

  private model: CatalogSearchOptionsModel;
  private bsConfig: Partial<BsDatepickerState>;

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private localeService: LocaleService,
              private translate: TranslateService) {
    super(renderer, focusMonitor, ngZone);
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      rangeInputFormat: 'L',
      showWeekNumbers: false,
      locale: this.localeService.bsLocaleID
    });
    this.model = new CatalogSearchOptionsModel('', null, '', '');
  }

  getValue(): CatalogSearchOptionsModel {
    return this.model;
  }

  private onDateRangeKeyDown(drp: BsDaterangepickerDirective, event: KeyboardEvent): void {
    if (event.keyCode === 8) { // BackSpace Key.
      this.model.dateRange = null;
      drp.bsValue = null;
      drp.hide();
    }
  }
}


