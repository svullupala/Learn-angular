import {
  ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {BsDaterangepickerDirective} from 'ngx-bootstrap/datepicker';
import {FileSearchOptionsModel} from '../file-search-options.model';
import {VmSearchSelectComponent} from '../vm-search-select/vm-search-select.component';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {FocusMonitor} from '@angular/cdk/a11y';
import {KeyboardDateRange} from 'shared/util/keyboard-date-range';
import {BsDatepickerState} from 'ngx-bootstrap/datepicker/reducer/bs-datepicker.state';
import {LocaleService} from 'shared/locale.service';

@Component({
  selector: 'file-search-options',
  styleUrls: ['./file-search-options.component.scss'],
  templateUrl: './file-search-options.component.html',
})
export class FileSearchOptionsComponent extends KeyboardDateRange implements OnDestroy, OnInit {

  @ViewChild(VmSearchSelectComponent) vmSearchSelect: VmSearchSelectComponent;

  private model: FileSearchOptionsModel;
  private bsConfig: Partial<BsDatepickerState>;

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private localeService: LocaleService,
              private translate: TranslateService,
              private cdr: ChangeDetectorRef) {
    super(renderer, focusMonitor, ngZone);
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      showWeekNumbers: false,
      rangeInputFormat: 'L',
      locale: this.localeService.bsLocaleID
    });
    this.model = new FileSearchOptionsModel([], null, '', '');
  }

  getValue(): FileSearchOptionsModel {
    return this.model;
  }

  private onVmSelect(vm: BaseHypervisorModel): void {
    let me = this, idx = (me.model.vms || []).findIndex(function (item) {
      return item === vm.name;
    });
    if (idx === -1) {
      // The current rest api supports search of single vm ONLY.
      me.model.vms.splice(0);
      me.model.vms.push(vm.name);
    }
  }

  private onVmDeselect(vm?: BaseHypervisorModel): void {
    let me = this, idx: number;
    if (vm) {
      idx = (me.model.vms || []).findIndex(function (item) {
        return item === vm.name;
      });
      if (idx !== -1)
        me.model.vms.splice(idx, 1);
    } else
      me.model.vms.splice(0);
  }

  private onDateRangeKeyDown(drp: BsDaterangepickerDirective, event: KeyboardEvent): void {
    if (event.keyCode === 8) { // BackSpace Key.
      this.model.dateRange = null;
      drp.bsValue = null;
      drp.hide();
    }
  }
}


