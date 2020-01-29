import {Component, Input, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {DashboardService} from '../dashboard.service';
import {TranslateService} from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'protected-vm',
  styleUrls: ['./protected-vm.scss'],
  templateUrl: './protected-vm.component.html'
})
export class ProtectedVmComponent implements OnInit, AfterViewInit, OnDestroy {

  title: string;
  icon: string = 'ion-android-happy';
  iconColor: string = 'grey';
  value: number = 0;
  dbValue: number = 0;
  @Input()
  rate: number = 60000;
  sub: any[] = [];

  private textProtectedVmsTpl: string;
  private textProtectedDbsTpl: string;
  private vmTooltip: string;
  private dbTooltip: string;
  private api: string = 'api/endeavour/catalog/recovery/hypervisorvm';
  private aggrField: string = 'pk';

  constructor(private service: DashboardService, private translate: TranslateService) { }


  ngAfterViewInit() {
    this.refresh();
  }

  ngOnDestroy() {
    for (let i = 0; i < this.sub.length; i++) {
      if (this.sub[i])  {
        this.sub[i].unsubscribe();
      }
    }
  }

  refresh() {
    this.sub.push(this.service.getAggrCount(this.api, this.aggrField).subscribe(
      res => {
        this.value = res.count || 0;
        this.vmTooltip = this.formatTooltip(this.textProtectedVmsTpl, this.value);
      },
      err => {
        this.value = 0;
      }
    ));
    this.sub.push(this.service.getDbAggrCount(this.aggrField, 'protection').subscribe(
      res => {
        this.dbValue = res.count || 0;
        this.dbTooltip = this.formatTooltip(this.textProtectedDbsTpl, this.dbValue);
      },
      err => {
        this.dbValue = 0;
      }
    ));
  }

  ngOnInit() {
    this.iconColor = this.service.getSuccessColor();
    this.init();
  }

  private init() {
    this.sub.push(this.translate.get([
      'dashboard.textProtectedVMs',
      'dashboard.textProtectedVmsTpl',
      'dashboard.textProtectedDbsTpl'
    ]).subscribe(
      resource => {
        this.title = resource['dashboard.textProtectedVMs'];
        this.textProtectedVmsTpl = resource['dashboard.textProtectedVmsTpl'];
        this.textProtectedDbsTpl = resource['dashboard.textProtectedDbsTpl'];
      }
    ));
  }

  private formatTooltip(tpl: string, value: number): string {
    return SharedService.formatString(tpl, value);
  }
}
