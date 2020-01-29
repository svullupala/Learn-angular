import {Component, Input, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {DashboardService} from '../dashboard.service';
import {TranslateService} from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'unprotected-vm',
  styleUrls: ['./unprotected-vm.scss'],
  templateUrl: './unprotected-vm.component.html'
})
export class UnprotectedVmComponent implements OnInit, AfterViewInit, OnDestroy {

  title: string;
  icon: string = 'ion-ios-information-outline';
  iconColor: string = 'grey';
  value: number = 0;
  dbValue: number = 0;
  sub: any[] = [];
  @Input()
  rate: number = 60000;

  private textUnProtectedVmsTpl: string;
  private textUnProtectedDbsTpl: string;
  private vmTooltip: string;
  private dbTooltip: string;
  private apiProtected: string = 'api/endeavour/catalog/recovery/hypervisorvm';
  private apiAllVm: string = 'api/endeavour/catalog/hypervisor/vm';
  private aggrField: string = 'pk';

  constructor(private service: DashboardService, private translate: TranslateService) { }

  ngOnDestroy() {
    for (let i = 0; i < this.sub.length; i++) {
      if (this.sub[i])  {
        this.sub[i].unsubscribe();
      }
    }
  }

  ngAfterViewInit() {
    this.refresh();
  }

  refresh() {
    this.sub.push(this.service.getAggrCount(this.apiAllVm, this.aggrField).subscribe(
      allRes => {
        let allVmCount: number = allRes.count;
        this.service.getAggrCount(this.apiProtected, this.aggrField).subscribe(
          protRes => {
            if (allVmCount < protRes.count) {
              this.value = 0;
            }  else {
              this.value = allVmCount - protRes.count;
            }
            this.vmTooltip = this.formatTooltip(this.textUnProtectedVmsTpl, this.value);
          }
        );
      },
      err => {
        this.value = -1;
      }
    ));
    this.sub.push(this.service.getDbAggrCount(this.aggrField, 'all').subscribe(
      allRes => {
        let allDbCount: number = allRes.count || 0;
        this.service.getDbAggrCount(this.aggrField, 'protection').subscribe(
          protRes => {
            if (allDbCount < protRes.count) {
              this.dbValue = 0;
            }  else {
              this.dbValue = allDbCount - protRes.count || 0;
            }
            this.dbTooltip = this.formatTooltip(this.textUnProtectedDbsTpl, this.dbValue);
          }
        );
      },
      err => {
        this.dbValue = 0;
      }
    ));
  }

  ngOnInit() {
    this.iconColor = this.service.getWarningColor();
    this.init();
  }

  private init() {
    this.sub.push(this.translate.get([
      'dashboard.textUnprotectedVMs',
      'dashboard.textUnProtectedVmsTpl',
      'dashboard.textUnProtectedDbsTpl'
    ]).subscribe(
      resource => {
        this.title = resource['dashboard.textUnprotectedVMs'];
        this.textUnProtectedVmsTpl = resource['dashboard.textUnProtectedVmsTpl'];
        this.textUnProtectedDbsTpl = resource['dashboard.textUnProtectedDbsTpl'];
      }
    ));
  }

  private formatTooltip(tpl: string, value: number): string {
    return SharedService.formatString(tpl, value);
  }
}
