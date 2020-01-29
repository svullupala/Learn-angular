import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { DashboardService } from '../dashboard.service';
import { FixedStack, StackItem } from '../shared/fixedstack.item';
import { NvPairModel } from 'shared/models/nvpair.model';
import { Router } from '@angular/router';
import { SharedService } from 'shared/shared.service';
import { SessionService, ScreenId } from 'core';
import { SlapolicyService } from 'slapolicy/shared/slapolicy.service';
import { JsonConvert } from 'json2typescript/src/json2typescript/json-convert';
import { SlapoliciesModel } from 'slapolicy/shared/slapolicies.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dashboard-coverage',
  styleUrls: ['../dashboard.scss'],
  templateUrl: './dashboard-coverage.component.html'
})

export class DashboardCoverageComponent {

  subs: Subject<void> = new Subject<void>();
  selectedLastPeriod: number = 12;

  private fillColor = '#F9F9F9';
  private cerulean70Color: string = '#1c496d';
  private apiAllVMs: string = 'api/endeavour/catalog/hypervisor/vm';
  private apiProtectedVMs: string = 'api/endeavour/catalog/recovery/hypervisorvm';
  private apiAllDBs: string = 'api/endeavour/catalog/application/database';
  private apiProtectedDBs: string = 'api/endeavour/catalog/recovery/applicationdatabase';
  private aggrField: string = 'pk';
  private totalResources: number = 0;
  private protectedResources: number = 0;
  private policyStack: FixedStack;
  private policyMap: NvPairModel[];
  private totalPolicies: number = 0;
  private sourcesText: string;

  constructor(private router: Router, private service: DashboardService, private slaService: SlapolicyService,
    private translate: TranslateService) {
  }

  ngOnInit() {
    this.translate.get([
      'common.sourcesText',
    ]).subscribe((resource: Object) => {
      this.sourcesText = resource['common.sourcesText'];
    });

    this.refreshPolicyData();
    this.refreshProtectionData();
  }

  getSourcesForPolicyMap0() {
    return SharedService.formatString(this.sourcesText, this.policyMap[0].value)
  }

  getSourcesForPolicyMap1() {
    return SharedService.formatString(this.sourcesText, this.policyMap[1].value)
  }

  getSourcesForPolicyMap2() {
    return SharedService.formatString(this.sourcesText, this.policyMap[2].value)
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  refreshProtectionData() {
    let me = this;
    me.totalResources = 0;
    me.protectedResources = 0;

    me.service.getAggrCount(me.apiAllVMs, me.aggrField).takeUntil(me.subs).subscribe(
      allRes => {
        me.totalResources += allRes.count;
        me.service.getAggrCount(me.apiProtectedVMs, me.aggrField).takeUntil(me.subs).subscribe(
          protectedRes => {
            me.protectedResources += protectedRes.count;
          }
        );
      },
      err => {
        console.log('dashboard-coverage-component error: ' + JSON.stringify(err));
      }
    );

    me.service.getAggrCount(me.apiAllDBs, me.aggrField).takeUntil(me.subs).subscribe(
      allRes => {
        me.totalResources += allRes.count;
        me.service.getAggrCount(me.apiProtectedDBs, me.aggrField).takeUntil(me.subs).subscribe(
          protectedRes => {
            me.protectedResources += protectedRes.count;
          }
        );
      },
      err => {
        console.log('dashboard-coverage-component error: ' + JSON.stringify(err));
      }
    );
  }

  refreshPolicyData() {
    let me = this;
    me.policyStack = new FixedStack();
    me.totalPolicies = 0;

    this.service.getAggrGroupCount(this.apiProtectedVMs, 'pk', 'protectionInfo.storageProfileName')
      .takeUntil(me.subs).subscribe(
        res => {
          let data = res;
          for (let i = 0; i < data.length; i++) {
            me.policyStack.pushSum(new StackItem(data[i].group, data[i].count));
          }
        },
        err => {
          console.log('slaCompliance widget error: ' + JSON.stringify(err));
        },
        () => {
          me.policyMap = me.parseProtectionData(me.policyStack);
        }
      );

    this.service.getAggrGroupCount(this.apiProtectedDBs, 'pk', 'protectionInfo.storageProfileName')
      .takeUntil(me.subs).subscribe(
        res => {
          let data = res;
          for (let i = 0; i < data.length; i++) {
            me.policyStack.pushSum(new StackItem(data[i].group, data[i].count));
          }
        },
        err => {
          console.log('slaCompliance widget error: ' + JSON.stringify(err));
        },
        () => {
          me.policyMap = me.parseProtectionData(me.policyStack);
        }
      );

    this.slaService.getSLAPolicies().takeUntil(me.subs).subscribe(
      res => {
        let dataset = JsonConvert.deserializeObject(res, SlapoliciesModel);
        this.totalPolicies = dataset.total;
      },
      err => {
        console.log('slaCompliance widget error: ' + JSON.stringify(err));
      }
    );
  }

  onViewPolicies(): void {
    this.router.navigate(['/pages/manageprotection/policyoverview']);
  }

  private hasViewPermission(): boolean {
    return SessionService.getInstance().hasScreenPermission(ScreenId.POLICYOVERVIEW);
  }

  private getCoverageStatus(): string {
    // Multi color status for critical/warning level, removed for now
    // let status = (this.protectedResources / this.totalResources) * 100;
    // return status >= 75 ? 'normal-coverage' : status >= 50 ? 'warning' : 'critical';
    return 'normal-coverage';
  }

  private parseProtectionData(stack: FixedStack): NvPairModel[] {
    let retVal: NvPairModel[] = [];

    if (stack === undefined) {
      return retVal;
    }

    let values: StackItem[] = stack.getContents();

    for (let i = 0; i < values.length; i++) {
      retVal.push(new NvPairModel(values[i].label, values[i].value));
    }
    return retVal;
  }

  private ellipsis(value: string, length?: number): string {
    return SharedService.ellipsisPath(value, (length) ? length : 15);
  }
}
