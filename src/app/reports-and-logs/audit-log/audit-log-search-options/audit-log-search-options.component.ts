import {Component, NgZone, Renderer2} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {BsDaterangepickerDirective} from 'ngx-bootstrap/datepicker';
import {AuditLogSearchOptionsModel} from '../audit-log-search-options.model';
import {KeyboardDateRange} from 'shared/util/keyboard-date-range';
import {FocusMonitor} from '@angular/cdk/a11y';
import {BsDatepickerState} from 'ngx-bootstrap/datepicker/reducer/bs-datepicker.state';
import {LocaleService} from 'shared/locale.service';

@Component({
  selector: 'audit-log-search-options',
  styleUrls: ['./audit-log-search-options.component.scss'],
  templateUrl: './audit-log-search-options.component.html',
})
export class AuditLogSearchOptionsComponent extends KeyboardDateRange {

  private model: AuditLogSearchOptionsModel;
  private bsConfig: Partial<BsDatepickerState>;

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private translate: TranslateService,
              private localeService: LocaleService) {
    super(renderer, focusMonitor, ngZone);
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      rangeInputFormat: 'L',
      showWeekNumbers: false,
      locale: this.localeService.bsLocaleID
    });
    this.model = new AuditLogSearchOptionsModel(null, '');
  }

  getValue(): AuditLogSearchOptionsModel {
    return this.model;
  }

  private onDateRangeKeyDown(drp: BsDaterangepickerDirective, event: KeyboardEvent): void {
    if (event.keyCode === 8) { // BackSpace Key.
      this.model.accessDateRange = null;
      drp.bsValue = null;
      drp.hide();
    }
  }
}


